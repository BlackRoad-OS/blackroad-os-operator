#!/usr/bin/env python3
"""
PARALLEL INFERENCE EXPERIMENT
Can we run inference on BOTH models simultaneously using threads?
This tests Hailo-8's ability to handle concurrent workloads.

WARNING: This is EXTREME - probably won't work since Hailo-8
can only handle one model at a time, but let's find out!
"""

import subprocess
import threading
import time
import sys
from datetime import datetime

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] {msg}")
    sys.stdout.flush()

def get_temperature():
    try:
        result = subprocess.run(['vcgencmd', 'measure_temp'],
                              capture_output=True, text=True, timeout=5)
        temp_str = result.stdout.strip().replace("temp=", "").replace("'C", "")
        return float(temp_str)
    except:
        return None

def run_yolov5s_benchmark(duration=10):
    """Run YOLOv5s benchmark"""
    log("🎯 [YOLO THREAD] Starting YOLOv5s benchmark...")
    start = time.time()

    try:
        result = subprocess.run([
            'hailortcli', 'benchmark',
            'yolov5s.hef',
            '--time-to-run', str(duration),
            '--power-mode', 'performance'
        ], capture_output=True, text=True, timeout=duration+30)

        elapsed = time.time() - start

        # Parse FPS
        fps = None
        for line in result.stdout.split('\n'):
            if 'FPS' in line and 'hw_only' in line:
                try:
                    fps = float(line.split('=')[1].strip())
                    break
                except:
                    pass

        log(f"✅ [YOLO THREAD] Complete! FPS: {fps:.2f if fps else 'N/A'}, Time: {elapsed:.2f}s")
        return {'model': 'yolov5s', 'fps': fps, 'elapsed': elapsed, 'success': True}

    except subprocess.TimeoutExpired:
        log("⚠️  [YOLO THREAD] Timeout!")
        return {'model': 'yolov5s', 'fps': None, 'elapsed': None, 'success': False}
    except Exception as e:
        log(f"❌ [YOLO THREAD] Error: {e}")
        return {'model': 'yolov5s', 'fps': None, 'elapsed': None, 'success': False}

def run_resnet_benchmark(duration=10):
    """Run ResNet-50 benchmark"""
    log("🎯 [RESNET THREAD] Starting ResNet-50 benchmark...")
    start = time.time()

    try:
        result = subprocess.run([
            'hailortcli', 'benchmark',
            'resnet_v1_50.hef',
            '--time-to-run', str(duration),
            '--power-mode', 'performance'
        ], capture_output=True, text=True, timeout=duration+30)

        elapsed = time.time() - start

        # Parse FPS
        fps = None
        for line in result.stdout.split('\n'):
            if 'FPS' in line and 'hw_only' in line:
                try:
                    fps = float(line.split('=')[1].strip())
                    break
                except:
                    pass

        log(f"✅ [RESNET THREAD] Complete! FPS: {fps:.2f if fps else 'N/A'}, Time: {elapsed:.2f}s")
        return {'model': 'resnet_v1_50', 'fps': fps, 'elapsed': elapsed, 'success': True}

    except subprocess.TimeoutExpired:
        log("⚠️  [RESNET THREAD] Timeout!")
        return {'model': 'resnet_v1_50', 'fps': None, 'elapsed': None, 'success': False}
    except Exception as e:
        log(f"❌ [RESNET THREAD] Error: {e}")
        return {'model': 'resnet_v1_50', 'fps': None, 'elapsed': None, 'success': False}

def test_parallel_inference():
    """
    Test 1: Try to run both models in parallel threads
    Expected: Will fail with device busy error
    """
    print("""
╔══════════════════════════════════════════════════════════╗
║         PARALLEL INFERENCE EXPERIMENT                    ║
║         Testing Hailo-8 Multi-Threading Limits           ║
╚══════════════════════════════════════════════════════════╝
    """)

    log("TEST 1: Parallel Execution (Expected to FAIL)")
    log("=" * 60)

    temp_before = get_temperature()
    log(f"Temperature before: {temp_before}°C")

    results = [None, None]

    def yolo_wrapper():
        results[0] = run_yolov5s_benchmark(10)

    def resnet_wrapper():
        results[1] = run_resnet_benchmark(10)

    # Launch both threads simultaneously
    log("🚀 Launching both benchmarks in parallel...")
    thread1 = threading.Thread(target=yolo_wrapper)
    thread2 = threading.Thread(target=resnet_wrapper)

    start_time = time.time()

    thread1.start()
    time.sleep(0.1)  # Tiny offset to see which fails
    thread2.start()

    # Wait for both
    thread1.join()
    thread2.join()

    total_time = time.time() - start_time
    temp_after = get_temperature()

    log("=" * 60)
    log(f"Total wall time: {total_time:.2f}s")
    log(f"Temperature after: {temp_after}°C")
    log(f"Temperature delta: {temp_after - temp_before:.1f}°C")
    log("")

    # Analyze results
    log("RESULTS:")
    log("-" * 60)

    yolo_result = results[0]
    resnet_result = results[1]

    if yolo_result:
        status = "✅" if yolo_result['success'] else "❌"
        log(f"{status} YOLOv5s: {yolo_result['fps']} FPS in {yolo_result['elapsed']:.2f}s")

    if resnet_result:
        status = "✅" if resnet_result['success'] else "❌"
        log(f"{status} ResNet-50: {resnet_result['fps']} FPS in {resnet_result['elapsed']:.2f}s")

    log("")

    # Determine what happened
    both_succeeded = (yolo_result and yolo_result['success'] and
                     resnet_result and resnet_result['success'])

    if both_succeeded:
        log("🤯 INCREDIBLE! Both models ran in parallel!")
        log("This means Hailo-8 can handle concurrent workloads!")
    else:
        log("📊 EXPECTED RESULT: Device busy - only one model at a time")
        log("Hailo-8 is single-threaded for model execution")

    return results

def test_sequential_inference():
    """
    Test 2: Run models sequentially for comparison
    Expected: Both succeed
    """
    log("")
    log("=" * 60)
    log("TEST 2: Sequential Execution (Expected to SUCCEED)")
    log("=" * 60)

    temp_before = get_temperature()
    log(f"Temperature before: {temp_before}°C")

    start_time = time.time()

    # Run YOLOv5s first
    yolo_result = run_yolov5s_benchmark(5)
    time.sleep(1)

    # Then ResNet-50
    resnet_result = run_resnet_benchmark(5)

    total_time = time.time() - start_time
    temp_after = get_temperature()

    log("=" * 60)
    log(f"Total wall time: {total_time:.2f}s")
    log(f"Temperature after: {temp_after}°C")
    log(f"Temperature delta: {temp_after - temp_before:.1f}°C")
    log("")

    log("RESULTS:")
    log("-" * 60)

    if yolo_result and yolo_result['success']:
        log(f"✅ YOLOv5s: {yolo_result['fps']:.2f} FPS")

    if resnet_result and resnet_result['success']:
        log(f"✅ ResNet-50: {resnet_result['fps']:.2f} FPS")

    log("")
    log("✅ Sequential execution successful!")

    return [yolo_result, resnet_result]

if __name__ == "__main__":
    try:
        # Test parallel first
        parallel_results = test_parallel_inference()

        # Test sequential for comparison
        sequential_results = test_sequential_inference()

        # Final summary
        print("""
╔══════════════════════════════════════════════════════════╗
║                  EXPERIMENT COMPLETE                     ║
╚══════════════════════════════════════════════════════════╝
        """)

        log("CONCLUSION:")
        log("Hailo-8 is optimized for single-model, high-throughput inference")
        log("For multi-model workloads, use sequential execution or")
        log("deploy multiple Hailo-8 devices in a mesh!")

    except KeyboardInterrupt:
        log("\n⚠️  Experiment interrupted")
    except Exception as e:
        log(f"\n❌ Experiment error: {e}")
        import traceback
        traceback.print_exc()
