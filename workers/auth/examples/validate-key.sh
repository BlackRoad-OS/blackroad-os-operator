#!/bin/bash
# Example: Validate an API key
# Usage: ./validate-key.sh <api_key>

API_KEY="${1:-br_your_api_key}"
WORKER_URL="${WORKER_URL:-https://blackroad-auth.alexa.workers.dev}"

echo "Validating API key: ${API_KEY:0:15}..."
echo ""

curl -X GET "$WORKER_URL/keys/validate" \
  -H "X-API-Key: $API_KEY" | jq .
