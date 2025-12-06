#!/bin/bash
# Test script for Cece Operator memory system
# Usage: ./test_memory.sh [base_url]
# Example: ./test_memory.sh https://blackroad-cece-operator-production.up.railway.app

set -e

BASE_URL="${1:-http://localhost:8000}"
USER_ID="test-$(date +%s)"

echo "Testing Cece Operator Memory System"
echo "===================================="
echo "Base URL: $BASE_URL"
echo "Test User ID: $USER_ID"
echo ""

# Test 1: Check memory stats
echo "[1/6] Checking memory stats..."
curl -s "$BASE_URL/memory/stats" | jq '.'
echo ""

# Test 2: First message (establish context)
echo "[2/6] Sending first message..."
RESPONSE1=$(curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Hello! My name is Alex and my favorite color is purple.\",
    \"userId\": \"$USER_ID\"
  }")
echo "$RESPONSE1" | jq '.reply'
echo ""

# Test 3: Second message (test memory recall)
echo "[3/6] Sending second message (should remember context)..."
RESPONSE2=$(curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What is my name and favorite color?\",
    \"userId\": \"$USER_ID\"
  }")
echo "$RESPONSE2" | jq '.reply'
echo ""

# Test 4: Retrieve memory
echo "[4/6] Retrieving conversation history..."
curl -s "$BASE_URL/memory/$USER_ID" | jq '.turns | length' | xargs echo "Number of stored turns:"
curl -s "$BASE_URL/memory/$USER_ID" | jq '.turns[0]'
echo ""

# Test 5: Manual memory storage
echo "[5/6] Manually storing a conversation turn..."
curl -s -X POST "$BASE_URL/memory/store" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"user_message\": \"Manual test message\",
    \"assistant_reply\": \"Manual test reply\",
    \"metadata\": {\"test\": true}
  }" | jq '.'
echo ""

# Test 6: Clear memory
echo "[6/6] Clearing conversation history..."
curl -s -X DELETE "$BASE_URL/memory/$USER_ID" | jq '.'
echo ""

# Verify deletion
echo "Verifying deletion..."
TURNS=$(curl -s "$BASE_URL/memory/$USER_ID" | jq '.total_turns')
if [ "$TURNS" = "0" ]; then
  echo "✓ Memory successfully cleared"
else
  echo "✗ Memory not cleared (found $TURNS turns)"
fi
echo ""

echo "===================================="
echo "Memory system test complete!"
echo ""
echo "Note: If memory is disabled (MEMORY_ENABLED=false),"
echo "the turns will always be 0 and stored=false."
