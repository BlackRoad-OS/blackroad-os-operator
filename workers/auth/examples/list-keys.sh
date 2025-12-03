#!/bin/bash
# Example: List API keys for a user
# Usage: ./list-keys.sh <admin_key> <user_id>

ADMIN_KEY="${1:-your_admin_key}"
USER_ID="${2:-user_123}"
WORKER_URL="${WORKER_URL:-https://blackroad-auth.alexa.workers.dev}"

echo "Listing API keys for user: $USER_ID"
echo ""

curl -X GET "$WORKER_URL/keys/list?user_id=$USER_ID" \
  -H "Authorization: Bearer $ADMIN_KEY" | jq .
