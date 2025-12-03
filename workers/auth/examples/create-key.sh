#!/bin/bash
# Example: Create a new API key
# Usage: ./create-key.sh <admin_key> <user_id> [tier]

ADMIN_KEY="${1:-your_admin_key}"
USER_ID="${2:-user_123}"
TIER="${3:-pro}"
WORKER_URL="${WORKER_URL:-https://blackroad-auth.alexa.workers.dev}"

echo "Creating API key for user: $USER_ID (tier: $TIER)"
echo "Using admin key: ${ADMIN_KEY:0:10}..."
echo ""

curl -X POST "$WORKER_URL/keys/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"tier\": \"$TIER\",
    \"name\": \"API Key for $USER_ID\",
    \"description\": \"Created via script\",
    \"scopes\": [\"read\", \"write\"],
    \"allowed_origins\": [\"https://app.blackroad.io\", \"http://localhost:3000\"]
  }" | jq .

echo ""
echo "IMPORTANT: Save the api_key value - it will not be shown again!"
