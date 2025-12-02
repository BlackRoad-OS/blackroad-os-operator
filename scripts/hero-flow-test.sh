#!/bin/bash
# =============================================================================
# Hero Flow #1 - Operator Engine Test
# =============================================================================
#
# Tests the canonical /chat endpoint on the BlackRoad OS Operator.
# Flow: User -> Operator -> GPT-OSS Model (Ollama) -> Response
#
# Usage:
#   ./scripts/hero-flow-test.sh
#   ./scripts/hero-flow-test.sh "Your custom message here"
#
# =============================================================================

set -e

OPERATOR_URL="${OPERATOR_URL:-https://blackroad-os-operator-production-8d28.up.railway.app}"
MESSAGE="${1:-Hello Cece! What can you help me with today?}"

echo "=============================================="
echo " HERO FLOW #1 - Operator Engine -> GPT-OSS"
echo "=============================================="
echo ""
echo "Endpoint: POST ${OPERATOR_URL}/chat"
echo "Message:  ${MESSAGE}"
echo ""
echo "Sending request..."
echo ""

# Make the request and capture response + status code
HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${OPERATOR_URL}/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"${MESSAGE}\"}")

# Extract status code (last line) and body (everything else)
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tail -n 1)
HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')

echo "----------------------------------------------"
echo "Status: ${HTTP_STATUS}"
echo "----------------------------------------------"

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "Response:"
  echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
  echo ""
  echo "----------------------------------------------"
  echo "PASS - Hero Flow #1 working!"
  echo "----------------------------------------------"

  # Extract and show trace info
  RESPONSE_TIME=$(echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('trace',{}).get('response_time_ms','N/A'))" 2>/dev/null || echo "N/A")
  USED_RAG=$(echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('trace',{}).get('used_rag','N/A'))" 2>/dev/null || echo "N/A")
  echo "Response time: ${RESPONSE_TIME}ms"
  echo "Used RAG: ${USED_RAG}"
  echo ""
else
  echo ""
  echo "Response:"
  echo "$HTTP_BODY"
  echo ""
  echo "----------------------------------------------"
  echo "FAIL - Check operator logs"
  echo "----------------------------------------------"
  exit 1
fi
