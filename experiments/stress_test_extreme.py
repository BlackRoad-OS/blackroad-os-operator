#!/usr/bin/env python3
"""
OCTAVIA EXTREME STRESS TEST
Push the Hailo-8 to its absolute limits!

Test scenarios:
1. Continuous 1-hour inference (thermal + stability)
2. Rapid model switching (YOLOv5s ↔ ResNet-50)
3. Maximum throughput test (how many inferences can we do?)
4. Memory stress (large batch processing)
5. Power analysis under extreme load
"""

import time
import subprocess
import sys
from datetime import datetime

def log(msg):
    """Log with timestamp"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    sys.stdout.flush()

def get_temperature():
    """Get Pi temperature"""
    try:
        result = subprocess.run(['vcgencmd', 'measure_temp'],
                              capture_output=True, text=True, timeout=5)
        temp_str = result.stdout.strip().replace("temp=", "").replace("'C", "")
        return float(temp_str)
    except:
        return None

def run_benchmark(model, duration, power_mode="performance"):
    """Run Hailo benchmark"""
    log(f"🔥 Running {model} for {duration}s in {power_mode} mode...")

    cmd = [
        'hailortcli', 'benchmark',
        f'{model}.hef',
        f'--time-to-run', str(duration),
        '--power-mode', power_mode
    ]

    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True)
    elapsed = time.time() - start

    # Parse results
    output = result.stdout
    fps = None
    power = None

    for line in output.split('\n'):
        if 'FPS' in line and 'hw_only' in line:
            try:
                fps = float(line.split('=')[1].strip())
            except:
                pass
        if 'Power' in line and 'average' in line:
            try:
                power = float(line.split('=')[1].strip().replace('W', ''))
            except:
                pass

    return {
        'model': model,
        'duration': duration,
        'power_mode': power_mode,
        'fps': fps,
        'power': power,
        'elapsed': elapsed
    }

def stress_test_1_hour():
    """Test 1: 1-hour continuous inference"""
    log("="*60)
    log("TEST 1: 1-HOUR CONTINUOUS INFERENCE")
    log("Testing thermal stability and long-term performance")
    log("="*60)

    model = 'yolov5s'
    duration = 3600  # 1 hour

    temps = []
    start_temp = get_temperature()
    log(f"Starting temperature: {start_temp}°C")

    # Run benchmark
    result = run_benchmark(model, duration, "performance")

    end_temp = get_temperature()
    log(f"Ending temperature: {end_temp}°C")
    log(f"Temperature increase: {end_temp - start_temp:.1f}°C")
    log(f"Average FPS: {result['fps']:.2f}")
    log(f"Average power: {result['power']:.2f}W")

    return result

def stress_test_rapid_switching():
    """Test 2: Rapid model switching"""
    log("="*60)
    log("TEST 2: RAPID MODEL SWITCHING")
    log("Testing model load/unload overhead")
    log("="*60)

    models = ['yolov5s', 'resnet_v1_50']
    results = []

    for i in range(10):
        model = models[i % 2]
        log(f"Switch {i+1}/10: {model}")
        result = run_benchmark(model, 5, "performance")
        results.append(result)
        temp = get_temperature()
        log(f"  FPS: {result['fps']:.2f}, Temp: {temp}°C")

    return results

def stress_test_maximum_throughput():
    """Test 3: Maximum throughput"""
    log("="*60)
    log("TEST 3: MAXIMUM THROUGHPUT")
    log("How many inferences in 5 minutes?")
    log("="*60)

    result = run_benchmark('yolov5s', 300, "ultra_performance")

    total_inferences = result['fps'] * 300
    log(f"Total inferences: {total_inferences:,.0f}")
    log(f"Average FPS: {result['fps']:.2f}")
    log(f"Power consumption: {result['power']:.2f}W")

    return result

def stress_test_dual_model_sequential():
    """Test 4: Sequential dual-model pipeline"""
    log("="*60)
    log("TEST 4: DUAL-MODEL SEQUENTIAL PIPELINE")
    log("Simulating YOLO detection → ResNet classification")
    log("="*60)

    # Run both models back-to-back
    yolo_result = run_benchmark('yolov5s', 30, "performance")
    resnet_result = run_benchmark('resnet_v1_50', 30, "performance")

    # Calculate theoretical pipeline throughput
    # Bottleneck is slower model
    pipeline_fps = min(yolo_result['fps'], resnet_result['fps'])
    pipeline_latency = (1000/yolo_result['fps']) + (1000/resnet_result['fps'])

    log(f"YOLOv5s: {yolo_result['fps']:.2f} FPS")
    log(f"ResNet-50: {resnet_result['fps']:.2f} FPS")
    log(f"Pipeline FPS (theoretical): {pipeline_fps:.2f}")
    log(f"Pipeline latency: {pipeline_latency:.2f}ms")

    return {
        'yolo': yolo_result,
        'resnet': resnet_result,
        'pipeline_fps': pipeline_fps,
        'pipeline_latency': pipeline_latency
    }

def stress_test_power_analysis():
    """Test 5: Comprehensive power analysis"""
    log("="*60)
    log("TEST 5: COMPREHENSIVE POWER ANALYSIS")
    log("Testing all power modes across both models")
    log("="*60)

    results = []

    for model in ['yolov5s', 'resnet_v1_50']:
        for mode in ['performance', 'ultra_performance']:
            log(f"Testing {model} in {mode} mode...")
            result = run_benchmark(model, 20, mode)
            results.append(result)

            efficiency = result['fps'] / result['power'] if result['power'] else 0
            log(f"  FPS: {result['fps']:.2f}")
            log(f"  Power: {result['power']:.2f}W")
            log(f"  Efficiency: {efficiency:.2f} FPS/W")

    return results

def main():
    """Run all stress tests"""
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║          OCTAVIA EXTREME STRESS TEST SUITE              ║
    ║       Hailo-8 AI Accelerator on Raspberry Pi 5          ║
    ║                                                          ║
    ║  WARNING: This will push hardware to absolute limits!   ║
    ╚══════════════════════════════════════════════════════════╝
    """)

    start_time = time.time()
    all_results = {}

    try:
        # Test 1: 1-hour continuous (SKIP for now - too long)
        # log("\n⏭️  SKIPPING 1-hour test (run separately)")

        # Test 2: Rapid switching
        log("\n🔄 Starting Test 2: Rapid Model Switching...")
        all_results['rapid_switching'] = stress_test_rapid_switching()

        # Test 3: Maximum throughput
        log("\n⚡ Starting Test 3: Maximum Throughput...")
        all_results['max_throughput'] = stress_test_maximum_throughput()

        # Test 4: Dual-model pipeline
        log("\n🔗 Starting Test 4: Dual-Model Pipeline...")
        all_results['dual_model'] = stress_test_dual_model_sequential()

        # Test 5: Power analysis
        log("\n🔋 Starting Test 5: Power Analysis...")
        all_results['power_analysis'] = stress_test_power_analysis()

    except KeyboardInterrupt:
        log("\n⚠️  Tests interrupted by user")
    except Exception as e:
        log(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # Final summary
    total_time = time.time() - start_time
    final_temp = get_temperature()

    log("\n" + "="*60)
    log("STRESS TEST COMPLETE")
    log("="*60)
    log(f"Total test duration: {total_time/60:.1f} minutes")
    log(f"Final temperature: {final_temp}°C")
    log(f"Tests completed: {len(all_results)}")
    log("="*60)

    log("\n✅ All stress tests complete!\n")

if __name__ == "__main__":
    main()
