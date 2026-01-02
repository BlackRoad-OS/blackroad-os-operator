#!/usr/bin/env python3
"""
OCTAVIA MULTI-MODEL PIPELINE EXPERIMENT
Test simultaneous YOLOv5s + ResNet-50 inference

Hypothesis: Can we run object detection + classification in pipeline?
Pipeline: YOLO detects objects → ResNet classifies each detected object
"""

import time
import numpy as np
from hailo_platform import (HEF, VDevice, HailoStreamInterface,
                            InputVStreamParams, OutputVStreamParams,
                            InferVStreams, ConfigureParams)

def benchmark_single_model(hef_path, model_name, duration=10):
    """Benchmark a single model"""
    print(f"\n{'='*60}")
    print(f"Benchmarking {model_name}")
    print(f"{'='*60}")

    hef = HEF(hef_path)

    with VDevice() as target:
        configure_params = ConfigureParams.create_from_hef(hef, interface=HailoStreamInterface.PCIe)
        network_group = target.configure(hef, configure_params)[0]
        network_group_params = network_group.create_params()

        input_vstreams_params = InputVStreamParams.make_from_network_group(network_group, quantized=False, format_type=HailoStreamInterface.PCIe)
        output_vstreams_params = OutputVStreamParams.make_from_network_group(network_group, quantized=False, format_type=HailoStreamInterface.PCIe)

        input_vstream_info = hef.get_input_vstream_infos()[0]
        output_vstream_info = hef.get_output_vstream_infos()[0]

        input_shape = input_vstream_info.shape
        print(f"Input shape: {input_shape}")
        print(f"Output shape: {output_vstream_info.shape}")

        # Generate random input data
        input_data = np.random.randint(0, 255, input_shape, dtype=np.uint8)

        with InferVStreams(network_group, input_vstreams_params, output_vstreams_params) as infer_pipeline:
            # Warmup
            print("Warming up...")
            for _ in range(10):
                infer_pipeline.infer({input_vstream_info.name: input_data})

            # Benchmark
            print(f"Running benchmark for {duration} seconds...")
            start = time.time()
            frames = 0

            while time.time() - start < duration:
                output = infer_pipeline.infer({input_vstream_info.name: input_data})
                frames += 1

            elapsed = time.time() - start
            fps = frames / elapsed
            latency_ms = (elapsed / frames) * 1000

            print(f"\n{'='*60}")
            print(f"Results for {model_name}:")
            print(f"  Frames processed: {frames}")
            print(f"  Duration: {elapsed:.2f}s")
            print(f"  FPS: {fps:.2f}")
            print(f"  Latency: {latency_ms:.2f}ms")
            print(f"{'='*60}\n")

            return fps, latency_ms

def benchmark_pipeline(yolo_hef, resnet_hef, duration=10):
    """
    Benchmark pipeline: YOLO detection → ResNet classification

    Note: This is a SEQUENTIAL pipeline test, not truly parallel
    Hailo-8 only supports 1 network at a time on single device
    """
    print(f"\n{'='*60}")
    print(f"PIPELINE TEST: YOLO → ResNet Sequential")
    print(f"{'='*60}")

    yolo_fps, yolo_latency = benchmark_single_model(yolo_hef, "YOLOv5s", duration=5)
    resnet_fps, resnet_latency = benchmark_single_model(resnet_hef, "ResNet-50", duration=5)

    # Theoretical pipeline FPS (bottlenecked by slowest stage)
    pipeline_fps = min(yolo_fps, resnet_fps)
    pipeline_latency = yolo_latency + resnet_latency

    print(f"\n{'='*60}")
    print(f"PIPELINE ANALYSIS:")
    print(f"  YOLOv5s:   {yolo_fps:.2f} FPS, {yolo_latency:.2f}ms")
    print(f"  ResNet-50: {resnet_fps:.2f} FPS, {resnet_latency:.2f}ms")
    print(f"  Pipeline (theoretical): {pipeline_fps:.2f} FPS")
    print(f"  Pipeline latency: {pipeline_latency:.2f}ms")
    print(f"{'='*60}\n")

def main():
    """Run all experiments"""
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     OCTAVIA MULTI-MODEL PIPELINE EXPERIMENTS             ║
    ║     Hailo-8 AI Accelerator on Raspberry Pi 5             ║
    ╚══════════════════════════════════════════════════════════╝
    """)

    yolo_hef = "/home/pi/yolov5s.hef"
    resnet_hef = "/home/pi/resnet_v1_50.hef"

    try:
        # Experiment 1: YOLOv5s standalone
        yolo_fps, yolo_latency = benchmark_single_model(yolo_hef, "YOLOv5s", duration=15)

        # Experiment 2: ResNet-50 standalone
        resnet_fps, resnet_latency = benchmark_single_model(resnet_hef, "ResNet-50", duration=15)

        # Experiment 3: Pipeline analysis
        benchmark_pipeline(yolo_hef, resnet_hef, duration=10)

        print("\n✅ All experiments completed!")
        print(f"\nSummary:")
        print(f"  YOLOv5s: {yolo_fps:.2f} FPS ({yolo_latency:.2f}ms latency)")
        print(f"  ResNet-50: {resnet_fps:.2f} FPS ({resnet_latency:.2f}ms latency)")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
