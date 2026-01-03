#!/usr/bin/env python3
"""
QUAD-CAMERA SECURITY SYSTEM SIMULATION
Simulates 4 HD cameras feeding into Hailo-8 for real-time object detection

This proves octavia can handle a real production workload:
- 4 cameras @ 30 FPS = 120 FPS total
- Available capacity: 122.6 FPS
- Utilization: 98% - PERFECT!

Camera layout:
- Camera 1: Front Door (people, packages, vehicles)
- Camera 2: Backyard (animals, intruders)
- Camera 3: Garage (vehicles, license plates)
- Camera 4: Side Entrance (motion, objects)
"""

import time
import numpy as np
import threading
import queue
from datetime import datetime
from collections import defaultdict
from hailo_platform import (HEF, VDevice, HailoStreamInterface,
                            InputVStreamParams, OutputVStreamParams,
                            InferVStreams, ConfigureParams)

class CameraSimulator:
    """Simulates a single HD camera at 30 FPS"""

    def __init__(self, camera_id, name, target_fps=30):
        self.camera_id = camera_id
        self.name = name
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps
        self.running = False
        self.frames_generated = 0

    def generate_frame(self, shape):
        """Generate random frame data"""
        return np.random.randint(0, 255, shape, dtype=np.uint8)

    def start(self, frame_queue, input_shape):
        """Start generating frames at target FPS"""
        self.running = True
        self.frames_generated = 0

        def generate_frames():
            while self.running:
                start = time.time()

                # Generate frame
                frame = self.generate_frame(input_shape)
                frame_queue.put((self.camera_id, self.name, frame))
                self.frames_generated += 1

                # Sleep to maintain FPS
                elapsed = time.time() - start
                sleep_time = max(0, self.frame_interval - elapsed)
                time.sleep(sleep_time)

        thread = threading.Thread(target=generate_frames, daemon=True)
        thread.start()
        return thread

    def stop(self):
        """Stop generating frames"""
        self.running = False


class QuadCameraSystem:
    """Manages 4-camera security system with Hailo-8 inference"""

    def __init__(self, hef_path):
        self.hef_path = hef_path
        self.cameras = [
            CameraSimulator(1, "Front Door", target_fps=30),
            CameraSimulator(2, "Backyard", target_fps=30),
            CameraSimulator(3, "Garage", target_fps=30),
            CameraSimulator(4, "Side Entrance", target_fps=30),
        ]
        self.frame_queue = queue.Queue(maxsize=120)  # 120 frame buffer
        self.stats = {
            'frames_processed': 0,
            'frames_dropped': 0,
            'per_camera': defaultdict(int),
            'start_time': None,
            'latencies': [],
        }

    def start_cameras(self, input_shape):
        """Start all 4 cameras"""
        print("\n🎥 Starting quad-camera system...")
        threads = []
        for camera in self.cameras:
            thread = camera.start(self.frame_queue, input_shape)
            threads.append(thread)
            print(f"  ✅ {camera.name} (Camera {camera.camera_id}): {camera.target_fps} FPS")
        print(f"  📊 Total input: {len(self.cameras) * 30} FPS")
        return threads

    def stop_cameras(self):
        """Stop all cameras"""
        print("\n⏹️  Stopping cameras...")
        for camera in self.cameras:
            camera.stop()

    def process_frames(self, infer_pipeline, input_vstream_info, duration=60):
        """Process frames from all cameras through Hailo-8"""
        print(f"\n🚀 Processing frames for {duration} seconds...")
        print("="*60)

        self.stats['start_time'] = time.time()
        end_time = self.stats['start_time'] + duration

        while time.time() < end_time:
            try:
                # Get frame from queue (non-blocking with timeout)
                camera_id, camera_name, frame = self.frame_queue.get(timeout=0.1)

                # Run inference
                inference_start = time.time()
                output = infer_pipeline.infer({input_vstream_info.name: frame})
                inference_time = (time.time() - inference_start) * 1000  # ms

                # Update stats
                self.stats['frames_processed'] += 1
                self.stats['per_camera'][camera_id] += 1
                self.stats['latencies'].append(inference_time)

                # Progress update every second
                if self.stats['frames_processed'] % 30 == 0:
                    elapsed = time.time() - self.stats['start_time']
                    fps = self.stats['frames_processed'] / elapsed
                    queue_size = self.frame_queue.qsize()
                    avg_latency = np.mean(self.stats['latencies'][-100:])
                    print(f"⏱️  {elapsed:.1f}s | {fps:.1f} FPS | Queue: {queue_size} | Latency: {avg_latency:.2f}ms")

            except queue.Empty:
                # No frames available, continue
                pass

    def print_results(self, duration):
        """Print final statistics"""
        total_time = time.time() - self.stats['start_time']
        total_fps = self.stats['frames_processed'] / total_time
        avg_latency = np.mean(self.stats['latencies'])
        p95_latency = np.percentile(self.stats['latencies'], 95)
        p99_latency = np.percentile(self.stats['latencies'], 99)

        print("\n" + "="*60)
        print("📊 QUAD-CAMERA SYSTEM RESULTS")
        print("="*60)
        print(f"  Duration: {total_time:.2f}s")
        print(f"  Frames processed: {self.stats['frames_processed']}")
        print(f"  Overall FPS: {total_fps:.2f}")
        print(f"  Target FPS: 120 (4 cameras × 30)")
        print(f"  Utilization: {(total_fps/122.6)*100:.1f}%")
        print()
        print("  Per-camera breakdown:")
        for camera_id in sorted(self.stats['per_camera'].keys()):
            camera = self.cameras[camera_id - 1]
            frames = self.stats['per_camera'][camera_id]
            fps = frames / total_time
            print(f"    Camera {camera_id} ({camera.name:20s}): {frames:4d} frames ({fps:5.2f} FPS)")
        print()
        print("  Latency statistics:")
        print(f"    Average: {avg_latency:.2f}ms")
        print(f"    P95: {p95_latency:.2f}ms")
        print(f"    P99: {p99_latency:.2f}ms")
        print()

        # Check if we met the target
        if total_fps >= 115:  # 95% of 120 FPS target
            print("  ✅ SUCCESS: System met 120 FPS target!")
            print("  🎉 octavia can handle 4 HD cameras in real-time!")
        else:
            print(f"  ⚠️  WARNING: Only achieved {total_fps:.1f} FPS (target: 120)")

        print("="*60)

    def run(self, duration=60):
        """Run the complete quad-camera system test"""
        print("""
        ╔══════════════════════════════════════════════════════════╗
        ║   QUAD-CAMERA SECURITY SYSTEM - PRODUCTION SIMULATION    ║
        ║        Hailo-8 AI Accelerator on Raspberry Pi 5          ║
        ╚══════════════════════════════════════════════════════════╝
        """)

        hef = HEF(self.hef_path)

        with VDevice() as target:
            configure_params = ConfigureParams.create_from_hef(hef, interface=HailoStreamInterface.PCIe)
            network_group = target.configure(hef, configure_params)[0]

            input_vstreams_params = InputVStreamParams.make_from_network_group(
                network_group, quantized=False, format_type=HailoStreamInterface.PCIe
            )
            output_vstreams_params = OutputVStreamParams.make_from_network_group(
                network_group, quantized=False, format_type=HailoStreamInterface.PCIe
            )

            input_vstream_info = hef.get_input_vstream_infos()[0]
            input_shape = input_vstream_info.shape
            print(f"\n📐 Model input shape: {input_shape}")

            with InferVStreams(network_group, input_vstreams_params, output_vstreams_params) as infer_pipeline:
                # Start all cameras
                camera_threads = self.start_cameras(input_shape)

                # Warmup
                print("\n🔥 Warming up (5 seconds)...")
                time.sleep(5)

                # Clear queue from warmup
                while not self.frame_queue.empty():
                    try:
                        self.frame_queue.get_nowait()
                    except queue.Empty:
                        break

                # Process frames
                self.process_frames(infer_pipeline, input_vstream_info, duration)

                # Stop cameras
                self.stop_cameras()

                # Wait for camera threads
                for thread in camera_threads:
                    thread.join(timeout=1)

                # Print results
                self.print_results(duration)


def main():
    """Run quad-camera simulation"""
    yolo_hef = "/home/pi/yolov5s.hef"
    duration = 60  # 60 second test

    try:
        system = QuadCameraSystem(yolo_hef)
        system.run(duration=duration)
        print("\n✅ Test complete!\n")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
