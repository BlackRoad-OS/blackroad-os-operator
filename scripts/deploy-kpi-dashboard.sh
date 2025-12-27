#!/bin/bash
# BlackRoad OS - KPI Dashboard Deployment Script
# Collects metrics and deploys to Cloudflare Pages
# Author: Alexa Amundson
# Version: 1.0.0

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DASHBOARD_DIR="$PROJECT_ROOT/pages/kpi-dashboard"
METRICS_SOURCE="$PROJECT_ROOT/metrics/data/latest.json"
METRICS_DEST="$DASHBOARD_DIR/metrics/data/latest.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║      🚀 BLACKROAD KPI DASHBOARD DEPLOYMENT 🚀                   ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Collect latest metrics
echo -e "${YELLOW}[1/5] Collecting KPI metrics...${NC}"
cd "$PROJECT_ROOT"
python3 scripts/collect-kpi-data.py
echo -e "${GREEN}✓ Metrics collected${NC}"
echo ""

# Step 2: Copy metrics to dashboard directory
echo -e "${YELLOW}[2/5] Copying metrics to dashboard...${NC}"
mkdir -p "$(dirname "$METRICS_DEST")"
cp "$METRICS_SOURCE" "$METRICS_DEST"
echo -e "${GREEN}✓ Metrics copied to $METRICS_DEST${NC}"
echo ""

# Step 3: Verify dashboard files exist
echo -e "${YELLOW}[3/5] Verifying dashboard files...${NC}"
if [ ! -f "$DASHBOARD_DIR/index.html" ]; then
    echo "Error: index.html not found in $DASHBOARD_DIR"
    exit 1
fi

if [ ! -f "$METRICS_DEST" ]; then
    echo "Error: latest.json not found in $METRICS_DEST"
    exit 1
fi

echo -e "${GREEN}✓ Dashboard files verified${NC}"
echo ""

# Step 4: Choose deployment method
echo -e "${YELLOW}[4/5] Deployment method:${NC}"
echo "  1. Cloudflare Pages (wrangler)"
echo "  2. Local test server"
echo "  3. GitHub commit (auto-deploy)"
echo ""
read -p "Select option [1-3]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo ""
        echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"

        # Check if wrangler is installed
        if ! command -v wrangler &> /dev/null; then
            echo "Error: wrangler CLI not found"
            echo "Install: npm install -g wrangler"
            exit 1
        fi

        # Deploy
        cd "$DASHBOARD_DIR"
        wrangler pages deploy . --project-name=kpi-blackroad

        echo -e "${GREEN}✓ Deployed to Cloudflare Pages${NC}"
        echo ""
        echo "🌐 View at: https://kpi-blackroad.pages.dev"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}Starting local test server...${NC}"
        cd "$DASHBOARD_DIR"
        echo "🌐 Dashboard: http://localhost:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        python3 -m http.server 8000
        ;;

    3)
        echo ""
        echo -e "${YELLOW}Committing to GitHub...${NC}"

        cd "$PROJECT_ROOT"

        # Add files
        git add metrics/data/
        git add pages/kpi-dashboard/metrics/data/

        # Create commit
        COMMIT_DATE=$(date +"%Y-%m-%d %H:%M")
        git commit -m "📊 KPI Dashboard Update - $COMMIT_DATE

Updates:
- Fresh metrics collection
- Dashboard data synchronized
- Verification hash updated

Auto-deployed via deploy-kpi-dashboard.sh
"

        echo ""
        read -p "Push to GitHub? (y/n): " PUSH_CONFIRM

        if [ "$PUSH_CONFIRM" = "y" ]; then
            git push origin main
            echo -e "${GREEN}✓ Pushed to GitHub${NC}"
            echo ""
            echo "GitHub Actions will auto-deploy if configured"
        else
            echo "Commit created but not pushed"
        fi
        ;;

    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEPLOYMENT COMPLETE                           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  • Visit your dashboard"
echo "  • Verify metrics are correct"
echo "  • Set up custom domain (kpi.blackroad.io)"
echo "  • Configure automated daily updates"
echo ""
