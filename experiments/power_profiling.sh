#!/bin/bash
# POWER CONSUMPTION PROFILING
# Test all available power modes and models to find sweet spots

echo "═══════════════════════════════════════════════════════════"
echo "  POWER CONSUMPTION PROFILING - octavia Hailo-8"
echo "═══════════════════════════════════════════════════════════"
echo ""

MODELS=("yolov5s.hef" "resnet_v1_50.hef")
POWER_MODES=("performance" "ultra_performance")
TEST_DURATION=10

echo "Testing matrix:"
echo "  Models: YOLOv5s, ResNet-50"
echo "  Power modes: performance, ultra_performance"
echo "  Duration: ${TEST_DURATION}s per test"
echo "  Total tests: 4"
echo ""

# Results file
RESULTS_FILE="power_profile_results.txt"
echo "Power Profiling Results - $(date)" > $RESULTS_FILE
echo "═══════════════════════════════════════════════════════════" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

for MODEL in "${MODELS[@]}"; do
    MODEL_NAME=$(basename $MODEL .hef)

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Testing: $MODEL_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo "## $MODEL_NAME" >> $RESULTS_FILE
    echo "" >> $RESULTS_FILE

    for POWER_MODE in "${POWER_MODES[@]}"; do
        echo "─────────────────────────────────────────────────────────────"
        echo "  Mode: $POWER_MODE"
        echo "─────────────────────────────────────────────────────────────"

        # Get temp before
        TEMP_BEFORE=$(vcgencmd measure_temp | grep -o "[0-9]*\.[0-9]*")
        echo "  Temperature: ${TEMP_BEFORE}°C"

        # Run benchmark
        OUTPUT=$(hailortcli benchmark $MODEL \
            --time-to-run $TEST_DURATION \
            --power-mode $POWER_MODE \
            2>&1)

        # Parse results
        FPS=$(echo "$OUTPUT" | grep "FPS.*hw_only" | grep -o "[0-9]*\.[0-9]*" | head -1)
        FPS_STREAM=$(echo "$OUTPUT" | grep "FPS.*streaming" | grep -o "[0-9]*\.[0-9]*" | head -1)
        LATENCY=$(echo "$OUTPUT" | grep "Latency.*hw" | grep -o "[0-9]*\.[0-9]*" | head -1)
        POWER_AVG=$(echo "$OUTPUT" | grep "Power.*average" | grep -o "[0-9]*\.[0-9]*" | head -1)
        POWER_MAX=$(echo "$OUTPUT" | grep "Power.*max" | grep -o "[0-9]*\.[0-9]*" | head -1)

        # Get temp after
        TEMP_AFTER=$(vcgencmd measure_temp | grep -o "[0-9]*\.[0-9]*")

        # Calculate efficiency
        if [ ! -z "$FPS" ] && [ ! -z "$POWER_AVG" ]; then
            EFFICIENCY=$(echo "scale=2; $FPS / $POWER_AVG" | bc)
        else
            EFFICIENCY="N/A"
        fi

        # Display results
        echo "  Results:"
        echo "    FPS (hardware):      ${FPS:-N/A}"
        echo "    FPS (streaming):     ${FPS_STREAM:-N/A}"
        echo "    Latency:             ${LATENCY:-N/A} ms"
        echo "    Power (average):     ${POWER_AVG:-N/A} W"
        echo "    Power (max):         ${POWER_MAX:-N/A} W"
        echo "    Efficiency:          ${EFFICIENCY:-N/A} FPS/W"
        echo "    Temperature delta:   $(echo "$TEMP_AFTER - $TEMP_BEFORE" | bc)°C"
        echo "    Final temperature:   ${TEMP_AFTER}°C"
        echo ""

        # Write to results file
        echo "### $POWER_MODE" >> $RESULTS_FILE
        echo "- FPS (hardware): ${FPS:-N/A}" >> $RESULTS_FILE
        echo "- FPS (streaming): ${FPS_STREAM:-N/A}" >> $RESULTS_FILE
        echo "- Latency: ${LATENCY:-N/A} ms" >> $RESULTS_FILE
        echo "- Power (avg): ${POWER_AVG:-N/A} W" >> $RESULTS_FILE
        echo "- Power (max): ${POWER_MAX:-N/A} W" >> $RESULTS_FILE
        echo "- Efficiency: ${EFFICIENCY:-N/A} FPS/W" >> $RESULTS_FILE
        echo "- Temperature: ${TEMP_BEFORE}°C → ${TEMP_AFTER}°C" >> $RESULTS_FILE
        echo "" >> $RESULTS_FILE

        # Brief cooldown
        sleep 2
    done

    echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "  POWER PROFILING COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Summary table
echo "EFFICIENCY COMPARISON (FPS/Watt):"
echo "─────────────────────────────────────────────────────────────"
cat $RESULTS_FILE | grep -E "##|Efficiency" | sed 's/##//' | sed 's/- Efficiency://' | paste - - - -
echo ""

echo "Results saved to: $RESULTS_FILE"
echo ""

# Show best efficiency
echo "🏆 WINNER (Best Efficiency):"
BEST=$(cat $RESULTS_FILE | grep "Efficiency" | grep -o "[0-9]*\.[0-9]*" | sort -rn | head -1)
BEST_CONFIG=$(cat $RESULTS_FILE | grep -B 6 "Efficiency.*$BEST" | head -2 | tr '\n' ' ')
echo "  $BEST_CONFIG: $BEST FPS/W"
echo ""

echo "Final system status:"
vcgencmd measure_temp
uptime
