#!/bin/bash
# BlackRoad OS - Resume Page Deployment Script
# Deploys resume.blackroad.io to Cloudflare Pages
# Author: Alexa Amundson
# Version: 1.0.0

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESUME_DIR="$PROJECT_ROOT/pages/resume"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║      📄 RESUME.BLACKROAD.IO DEPLOYMENT 📄                       ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Verify files exist
echo -e "${YELLOW}[1/4] Verifying resume files...${NC}"
if [ ! -f "$RESUME_DIR/index.html" ]; then
    echo "Error: index.html not found in $RESUME_DIR"
    exit 1
fi
echo -e "${GREEN}✓ Resume files verified${NC}"
echo ""

# Step 2: Choose deployment method
echo -e "${YELLOW}[2/4] Deployment method:${NC}"
echo "  1. Cloudflare Pages (wrangler)"
echo "  2. Local preview"
echo "  3. GitHub commit (auto-deploy)"
echo ""
read -p "Select option [1-3]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo ""
        echo -e "${YELLOW}[3/4] Deploying to Cloudflare Pages...${NC}"

        # Check if wrangler is installed
        if ! command -v wrangler &> /dev/null; then
            echo "Error: wrangler CLI not found"
            echo "Install: npm install -g wrangler"
            exit 1
        fi

        # Deploy
        cd "$RESUME_DIR"
        wrangler pages deploy . --project-name=resume-blackroad

        echo -e "${GREEN}✓ Deployed to Cloudflare Pages${NC}"
        echo ""
        echo "🌐 Live at: https://resume-blackroad.pages.dev"
        echo ""
        echo -e "${YELLOW}[4/4] Custom Domain Setup:${NC}"
        echo "1. Go to Cloudflare Dashboard > Workers & Pages"
        echo "2. Select 'resume-blackroad' project"
        echo "3. Go to Custom Domains tab"
        echo "4. Add: resume.blackroad.io"
        echo "5. Cloudflare will auto-configure DNS"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}[3/4] Starting local preview server...${NC}"
        cd "$RESUME_DIR"
        echo "🌐 Resume: http://localhost:8000"
        echo "📱 Test on mobile: http://[your-ip]:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        python3 -m http.server 8000
        ;;

    3)
        echo ""
        echo -e "${YELLOW}[3/4] Committing to GitHub...${NC}"

        cd "$PROJECT_ROOT"

        # Add files
        git add pages/resume/

        # Create commit
        COMMIT_DATE=$(date +"%Y-%m-%d %H:%M")
        git commit -m "📄 Resume Page Update - $COMMIT_DATE

Created interactive resume at resume.blackroad.io:
- Beautiful gradient header with BlackRoad branding
- Verified metrics (1.38M LOC, $26.8M sales)
- Print-optimized PDF export
- JSON-LD structured data for SEO
- Mobile responsive design

Ready for Cloudflare Pages deployment.
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

        echo -e "${YELLOW}[4/4] Manual Cloudflare Deployment:${NC}"
        echo "Run: cd pages/resume && wrangler pages deploy . --project-name=resume-blackroad"
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
echo "  • Visit resume.blackroad.io (after DNS propagates)"
echo "  • Test PDF export functionality"
echo "  • Share link: https://resume.blackroad.io"
echo "  • Update LinkedIn with resume URL"
echo ""
