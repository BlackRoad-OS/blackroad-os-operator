#!/usr/bin/env python3
"""
MULTI-MODEL PIPELINE - Run BOTH YOLOv5s AND ResNet-50 in sequence
Test if octavia can handle multiple models in a production pipeline

Goal: Test YOLO → ResNet sequential processing
"""

import subprocess
import time

print("🔥 MULTI-MODEL PIPELINE TEST")
print("Testing YOLO → ResNet sequential processing...")
print()

# Test 1: Run YOLO for 10 seconds
print("Stage 1: YOLOv5s Object Detection (10s)")
subprocess.run(['hailortcli', 'benchmark', '/mnt/nvme/models/yolov5s.hef', 
                '--time-to-run', '10', '--power-mode', 'performance'])

time.sleep(2)

# Test 2: Run ResNet for 10 seconds  
print("\nStage 2: ResNet-50 Classification (10s)")
subprocess.run(['hailortcli', 'benchmark', '/mnt/nvme/models/resnet_v1_50.hef',
                '--time-to-run', '10', '--power-mode', 'performance'])

print("\n✅ Multi-model pipeline test complete!")
