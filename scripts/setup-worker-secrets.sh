#!/bin/bash
# BlackRoad Worker Secrets Setup
# Run this script to set API tokens for infrastructure workers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKERS_DIR="$(dirname "$SCRIPT_DIR")/workers"

echo "BlackRoad Worker Secrets Setup"
echo "==============================="
echo ""

# Function to set a secret
set_secret() {
    local worker=$1
    local secret_name=$2
    local prompt=$3

    echo "Setting $secret_name for $worker..."
    echo -n "$prompt: "
    read -s token
    echo ""

    if [ -n "$token" ]; then
        cd "$WORKERS_DIR/$worker"
        echo "$token" | wrangler secret put "$secret_name"
        echo "✓ $secret_name set for $worker"
    else
        echo "✗ Skipped (empty input)"
    fi
    echo ""
}

# DNS Manager - needs Cloudflare API Token with Zone:DNS:Edit
echo "1. Cloudflare DNS Manager Worker"
echo "   Requires: Cloudflare API Token with Zone:DNS:Edit permissions"
echo "   Create at: https://dash.cloudflare.com/profile/api-tokens"
echo ""
set_secret "cloudflare-dns" "CF_API_TOKEN" "Enter Cloudflare API Token"

# DigitalOcean Manager - needs DO API Token
echo "2. DigitalOcean Manager Worker"
echo "   Requires: DigitalOcean API Token with read/write"
echo "   Create at: https://cloud.digitalocean.com/account/api/tokens"
echo ""
set_secret "digitalocean-manager" "DO_API_TOKEN" "Enter DigitalOcean API Token"

# Also set BLACKROAD_ZONE_ID for DNS Manager
echo "3. Setting BLACKROAD_ZONE_ID (blackroad.io zone)"
cd "$WORKERS_DIR/cloudflare-dns"
echo "13293825c2b0491085cbece9fc02e401" | wrangler secret put BLACKROAD_ZONE_ID
echo "✓ BLACKROAD_ZONE_ID set"

echo ""
echo "Setup complete!"
echo ""
echo "Test the workers:"
echo "  curl https://blackroad-dns-manager.amundsonalexa.workers.dev/records"
echo "  curl https://blackroad-do-manager.amundsonalexa.workers.dev/droplets"
