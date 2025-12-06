#!/bin/bash
# Test deployment workflow locally before pushing to GitHub
#
# Usage:
#   ./scripts/test-deploy-local.sh workers api-gateway
#   ./scripts/test-deploy-local.sh pages dashboard
#   ./scripts/test-deploy-local.sh all

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify environment
check_prereqs() {
    info "Checking prerequisites..."

    if ! command_exists node; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node --version)"

    if ! command_exists npm; then
        error "npm is not installed"
        exit 1
    fi
    success "npm $(npm --version)"

    if ! command_exists wrangler; then
        warn "Wrangler CLI not installed globally"
        info "Installing wrangler..."
        npm install -g wrangler
    fi
    success "wrangler $(wrangler --version)"

    echo ""
}

# Test worker deployment
test_worker() {
    local worker=$1
    local worker_path="workers/$worker"

    if [ ! -d "$worker_path" ]; then
        error "Worker not found: $worker_path"
        return 1
    fi

    info "Testing worker: $worker"

    # Check for wrangler.toml
    if [ ! -f "$worker_path/wrangler.toml" ]; then
        error "Missing wrangler.toml in $worker_path"
        return 1
    fi
    success "Found wrangler.toml"

    # Install dependencies
    if [ -f "$worker_path/package.json" ]; then
        info "Installing dependencies..."
        (cd "$worker_path" && npm install --silent)
        success "Dependencies installed"
    fi

    # Build if build script exists
    if [ -f "$worker_path/package.json" ] && grep -q '"build"' "$worker_path/package.json"; then
        info "Building worker..."
        (cd "$worker_path" && npm run build)
        success "Build successful"
    fi

    # Dry-run deploy
    info "Testing deployment (dry-run)..."
    if (cd "$worker_path" && wrangler deploy --dry-run 2>&1); then
        success "Worker '$worker' is ready to deploy"
        return 0
    else
        error "Worker '$worker' failed dry-run deployment"
        return 1
    fi
}

# Test page deployment
test_page() {
    local page=$1
    local page_path="pages/$page"

    if [ ! -d "$page_path" ]; then
        error "Page not found: $page_path"
        return 1
    fi

    info "Testing page: $page"

    # Install dependencies
    if [ -f "$page_path/package.json" ]; then
        info "Installing dependencies..."
        (cd "$page_path" && npm install --silent)
        success "Dependencies installed"
    else
        warn "No package.json found, skipping dependencies"
    fi

    # Build if build script exists
    if [ -f "$page_path/package.json" ] && grep -q '"build"' "$page_path/package.json"; then
        info "Building page..."
        if (cd "$page_path" && npm run build); then
            success "Build successful"
        else
            error "Build failed"
            return 1
        fi
    fi

    # Check for output directory
    local output_dir=""
    for dir in dist build out .next public; do
        if [ -d "$page_path/$dir" ]; then
            output_dir=$dir
            break
        fi
    done

    if [ -n "$output_dir" ]; then
        success "Found output directory: $output_dir"
        local file_count=$(find "$page_path/$output_dir" -type f | wc -l | tr -d ' ')
        info "Output contains $file_count files"
        return 0
    else
        warn "No standard output directory found (dist/build/out/.next/public)"
        return 0
    fi
}

# Test all workers
test_all_workers() {
    info "Testing all workers..."
    echo ""

    local failed=0
    for worker_dir in workers/*/; do
        if [ -d "$worker_dir" ]; then
            worker=$(basename "$worker_dir")
            if ! test_worker "$worker"; then
                ((failed++))
            fi
            echo ""
        fi
    done

    if [ $failed -eq 0 ]; then
        success "All workers passed tests"
    else
        error "$failed worker(s) failed tests"
        return 1
    fi
}

# Test all pages
test_all_pages() {
    info "Testing all pages..."
    echo ""

    local failed=0
    for page_dir in pages/*/; do
        if [ -d "$page_dir" ]; then
            page=$(basename "$page_dir")
            if ! test_page "$page"; then
                ((failed++))
            fi
            echo ""
        fi
    done

    if [ $failed -eq 0 ]; then
        success "All pages passed tests"
    else
        error "$failed page(s) failed tests"
        return 1
    fi
}

# Main script
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  BlackRoad OS Deployment Tester              ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prereqs

    if [ $# -eq 0 ]; then
        error "Usage: $0 {workers|pages|all} [name]"
        error "Examples:"
        error "  $0 workers api-gateway"
        error "  $0 pages dashboard"
        error "  $0 all"
        exit 1
    fi

    local target=$1
    local name=$2

    case $target in
        workers)
            if [ -z "$name" ]; then
                test_all_workers
            else
                test_worker "$name"
            fi
            ;;
        pages)
            if [ -z "$name" ]; then
                test_all_pages
            else
                test_page "$name"
            fi
            ;;
        all)
            test_all_workers
            echo ""
            test_all_pages
            ;;
        *)
            error "Unknown target: $target"
            error "Use: workers, pages, or all"
            exit 1
            ;;
    esac

    echo ""
    success "Testing complete!"
}

main "$@"
