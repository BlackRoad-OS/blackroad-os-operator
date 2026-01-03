#!/bin/bash
# RAPID MODEL SWITCHING TEST
# How fast can octavia switch between YOLOv5s and ResNet-50?
# This tests model loading overhead and Hailo-8 reinitialization speed

echo "═══════════════════════════════════════════════════════════"
echo "  RAPID MODEL SWITCHING TEST - octavia Hailo-8"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Testing: 10 rapid switches between YOLOv5s and ResNet-50"
echo "Duration: 5 seconds per model = 50 seconds total"
echo ""

MODELS=("yolov5s.hef" "resnet_v1_50.hef")
TOTAL_SWITCHES=10
RUN_TIME=5

echo "Starting rapid switching test..."
echo ""

for i in $(seq 1 $TOTAL_SWITCHES); do
    MODEL_INDEX=$((($i - 1) % 2))
    MODEL=${MODELS[$MODEL_INDEX]}
    MODEL_NAME=$(basename $MODEL .hef)

    echo "────────────────────────────────────────────────────────────"
    echo "Switch #$i/10: $MODEL_NAME"
    echo "────────────────────────────────────────────────────────────"

    # Get temp before
    TEMP_BEFORE=$(vcgencmd measure_temp | grep -o "[0-9]*\.[0-9]*")
    echo "Temperature before: ${TEMP_BEFORE}°C"

    # Run benchmark
    START_TIME=$(date +%s.%N)
    hailortcli benchmark $MODEL --time-to-run $RUN_TIME --power-mode performance 2>&1 | \
        grep -E "FPS|Power|Latency" | head -6
    END_TIME=$(date +%s.%N)

    # Get temp after
    TEMP_AFTER=$(vcgencmd measure_temp | grep -o "[0-9]*\.[0-9]*")
    echo "Temperature after: ${TEMP_AFTER}°C"

    # Calculate elapsed time
    ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)
    echo "Total time (including model load): ${ELAPSED}s"
    echo ""

    # Brief pause to observe temperature
    sleep 1
done

echo "═══════════════════════════════════════════════════════════"
echo "  RAPID SWITCHING TEST COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Final temperature:"
vcgencmd measure_temp
echo ""
echo "System load:"
uptime
