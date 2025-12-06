#!/usr/bin/env bash
# BlackRoad Network Health Check
# Run from any machine with curl access
# Shows ✅ ⚠️ ❌ 🪧 for each service

set -euo pipefail

TIMEOUT=5

# Colors (if terminal supports them)
if [[ -t 1 ]]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    GRAY='\033[0;90m'
    NC='\033[0m'
else
    GREEN='' YELLOW='' RED='' GRAY='' NC=''
fi

echo "════════════════════════════════════════════════════════"
echo "         BlackRoad OS - Network Health Check"
echo "════════════════════════════════════════════════════════"
echo "Time: $(date)"
echo ""

# Track counts
HEALTHY=0
DEGRADED=0
DOWN=0
UNKNOWN=0

check_http() {
    local name="$1"
    local url="$2"
    local expected="${3:-200}"

    local status_code
    status_code=$(curl -k -s -o /dev/null -m "$TIMEOUT" -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [[ "$status_code" == "$expected" ]]; then
        echo -e "✅ ${GREEN}$name${NC} → $url (${status_code})"
        ((HEALTHY++))
    elif [[ "$status_code" == "000" ]]; then
        echo -e "❌ ${RED}$name${NC} → $url (timeout/unreachable)"
        ((DOWN++))
    elif [[ "$status_code" =~ ^[45] ]]; then
        echo -e "⚠️  ${YELLOW}$name${NC} → $url (HTTP $status_code)"
        ((DEGRADED++))
    else
        echo -e "🪧 ${GRAY}$name${NC} → $url (HTTP $status_code)"
        ((UNKNOWN++))
    fi
}

echo "─────────────── Cloudflare Workers ───────────────"
check_http "router" "https://blackroad-router.amundsonalexa.workers.dev/"
check_http "api-gateway" "https://blackroad-api-gateway.amundsonalexa.workers.dev/"
check_http "cece" "https://cece.amundsonalexa.workers.dev/health"
check_http "identity" "https://blackroad-identity.amundsonalexa.workers.dev/"
check_http "billing" "https://blackroad-billing.amundsonalexa.workers.dev/"
check_http "status" "https://blackroad-status.amundsonalexa.workers.dev/"
check_http "intercept" "https://blackroad-intercept.amundsonalexa.workers.dev/"
check_http "cipher" "https://blackroad-cipher.amundsonalexa.workers.dev/"
check_http "sovereignty" "https://blackroad-sovereignty.amundsonalexa.workers.dev/"
check_http "logs" "https://blackroad-logs.amundsonalexa.workers.dev/"
check_http "telemetry" "https://blackroad-telemetry.amundsonalexa.workers.dev/"
check_http "dns-manager" "https://blackroad-dns-manager.amundsonalexa.workers.dev/"
check_http "do-manager" "https://blackroad-do-manager.amundsonalexa.workers.dev/"

echo ""
echo "─────────────── Domain Routers ───────────────"
check_http "blackroadai" "https://blackroadai-router.amundsonalexa.workers.dev/"
check_http "lucidia-earth" "https://lucidia-earth-router.amundsonalexa.workers.dev/"
check_http "lucidia-studio" "https://lucidia-studio-router.amundsonalexa.workers.dev/"
check_http "blackroadquantum" "https://blackroadquantum-router.amundsonalexa.workers.dev/"
check_http "blackroad-network" "https://blackroad-network-router.amundsonalexa.workers.dev/"
check_http "blackroad-systems" "https://blackroad-systems-router.amundsonalexa.workers.dev/"

echo ""
echo "─────────────── Stripe Workers ───────────────"
check_http "stripe-checkout" "https://blackroad-stripe-checkout.amundsonalexa.workers.dev/"
check_http "stripe-webhooks" "https://blackroad-stripe-webhooks.amundsonalexa.workers.dev/"
check_http "stripe-billing" "https://blackroad-stripe-billing.amundsonalexa.workers.dev/"

echo ""
echo "─────────────── Railway Services ───────────────"
check_http "operator" "https://blackroad-cece-operator-production.up.railway.app/health"
check_http "operator-agents" "https://blackroad-cece-operator-production.up.railway.app/agents"

echo ""
echo "─────────────── Web Domains ───────────────"
check_http "blackroad.io" "https://blackroad.io"
check_http "api.blackroad.io" "https://api.blackroad.io"
check_http "docs.blackroad.io" "https://docs.blackroad.io"
check_http "dashboard.blackroad.io" "https://dashboard.blackroad.io"
check_http "blackroadai.com" "https://blackroadai.com"
check_http "lucidia.earth" "https://lucidia.earth"
check_http "lucidia.studio" "https://lucidia.studio"
check_http "blackroad.systems" "https://blackroad.systems"
check_http "blackroad.network" "https://blackroad.network"

echo ""
echo "─────────────── Infrastructure ───────────────"
# DigitalOcean Codex
if ping -c 1 -W 2 159.65.43.12 >/dev/null 2>&1; then
    echo -e "✅ ${GREEN}codex-infinity${NC} → 159.65.43.12 (ping OK)"
    ((HEALTHY++))
else
    echo -e "❌ ${RED}codex-infinity${NC} → 159.65.43.12 (unreachable)"
    ((DOWN++))
fi

# Raspberry Pi (local network only)
if ping -c 1 -W 2 192.168.4.49 >/dev/null 2>&1; then
    echo -e "✅ ${GREEN}pi-mesh${NC} → 192.168.4.49 (ping OK)"
    ((HEALTHY++))
else
    echo -e "🪧 ${GRAY}pi-mesh${NC} → 192.168.4.49 (local network only)"
    ((UNKNOWN++))
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "                      SUMMARY"
echo "════════════════════════════════════════════════════════"
TOTAL=$((HEALTHY + DEGRADED + DOWN + UNKNOWN))
echo -e "✅ Healthy:  $HEALTHY"
echo -e "⚠️  Degraded: $DEGRADED"
echo -e "❌ Down:     $DOWN"
echo -e "🪧 Unknown:  $UNKNOWN"
echo ""
echo "Total: $TOTAL services checked"

# Exit code based on status
if [[ $DOWN -gt 0 ]]; then
    exit 2
elif [[ $DEGRADED -gt 0 ]]; then
    exit 1
else
    exit 0
fi
