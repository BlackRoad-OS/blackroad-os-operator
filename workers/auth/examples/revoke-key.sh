#!/bin/bash
# Example: Revoke an API key
# Usage: ./revoke-key.sh <admin_key> <api_key> [reason]

ADMIN_KEY="${1:-your_admin_key}"
API_KEY="${2:-br_key_to_revoke}"
REASON="${3:-Admin revocation}"
WORKER_URL="${WORKER_URL:-https://blackroad-auth.alexa.workers.dev}"

echo "Revoking API key: ${API_KEY:0:15}..."
echo "Reason: $REASON"
echo ""

curl -X DELETE "$WORKER_URL/keys/revoke" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d "{
    \"api_key\": \"$API_KEY\",
    \"reason\": \"$REASON\"
  }" | jq .
