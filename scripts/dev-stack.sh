#!/usr/bin/env bash
#
# dev-stack.sh
# Start the BlackRoad OS development stack for Epics 1-3
#
# Governance:
#   amundson: 0.1.0
#   governor: alice.governor.v1
#   operator: alexa.operator.v1
#
# Usage:
#   ./scripts/dev-stack.sh          # Start all services
#   ./scripts/dev-stack.sh up       # Start all services
#   ./scripts/dev-stack.sh down     # Stop all services
#   ./scripts/dev-stack.sh logs     # Tail all logs
#   ./scripts/dev-stack.sh status   # Check service status
#   ./scripts/dev-stack.sh migrate  # Run database migrations

set -euo pipefail

# ============================================
# CONFIGURATION
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment
export BR_ENV="${BR_ENV:-dev}"
export LOG_LEVEL="${LOG_LEVEL:-debug}"

# Ports
export OPERATOR_PORT="${OPERATOR_PORT:-8000}"
export GOV_API_PORT="${GOV_API_PORT:-8001}"
export WEB_APP_PORT="${WEB_APP_PORT:-3000}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Database (local or Railway)
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-$POSTGRES_PORT}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGDATABASE="${PGDATABASE:-blackroad_dev}"
export DATABASE_URL="${DATABASE_URL:-postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE}"
export LEDGER_DB_URL="${LEDGER_DB_URL:-$DATABASE_URL}"

# Service URLs (local)
export GOV_API_URL="${GOV_API_URL:-http://localhost:$GOV_API_PORT}"
export GOV_API_INTERNAL_URL="${GOV_API_INTERNAL_URL:-http://localhost:$GOV_API_PORT}"
export OPERATOR_URL="${OPERATOR_URL:-http://localhost:$OPERATOR_PORT}"

# LLM (optional - for chat features)
export OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
export LLM_MODEL="${LLM_MODEL:-llama3.2}"
export RAG_API_URL="${RAG_API_URL:-http://localhost:8080}"

# CORS
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000,http://localhost:8000}"

# Policy engine
export POLICY_STORE_PATH="${POLICY_STORE_PATH:-$PROJECT_ROOT/config}"
export CATALOG_PATH="${CATALOG_PATH:-$PROJECT_ROOT/agent-catalog/agents.yaml}"
export LANGUAGE_VERSION="0.1.0"

# ============================================
# COLORS
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# COMMANDS
# ============================================

check_dependencies() {
    log_info "Checking dependencies..."

    local missing=()

    command -v python3 >/dev/null 2>&1 || missing+=("python3")
    command -v pip >/dev/null 2>&1 || missing+=("pip")
    command -v psql >/dev/null 2>&1 || log_warn "psql not found (optional for migrations)"
    command -v railway >/dev/null 2>&1 || log_warn "railway CLI not found (optional for cloud deploy)"

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi

    log_success "All required dependencies found"
}

check_postgres() {
    log_info "Checking PostgreSQL connection..."

    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; then
        log_success "PostgreSQL is running at $PGHOST:$PGPORT"
        return 0
    else
        log_warn "PostgreSQL not available at $PGHOST:$PGPORT"
        log_info "You can start it with: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15"
        return 1
    fi
}

start_postgres_docker() {
    log_info "Starting PostgreSQL via Docker..."

    if docker ps --format '{{.Names}}' | grep -q 'blackroad-postgres'; then
        log_info "PostgreSQL container already running"
        return 0
    fi

    docker run -d \
        --name blackroad-postgres \
        -p "${POSTGRES_PORT}:5432" \
        -e POSTGRES_USER="$PGUSER" \
        -e POSTGRES_PASSWORD="$PGPASSWORD" \
        -e POSTGRES_DB="$PGDATABASE" \
        -v blackroad-postgres-data:/var/lib/postgresql/data \
        postgres:15

    log_info "Waiting for PostgreSQL to start..."
    sleep 3

    log_success "PostgreSQL started"
}

run_migrations() {
    log_info "Running database migrations..."

    if [ ! -f "$PROJECT_ROOT/migrations/001_ledger_events_v1.sql" ]; then
        log_warn "No migrations found"
        return 0
    fi

    for migration in "$PROJECT_ROOT/migrations"/*.sql; do
        log_info "Applying: $(basename "$migration")"
        psql "$DATABASE_URL" -f "$migration" 2>/dev/null || {
            log_warn "Migration may have already been applied: $(basename "$migration")"
        }
    done

    log_success "Migrations complete"
}

start_operator() {
    log_info "Starting Operator (port $OPERATOR_PORT)..."

    cd "$PROJECT_ROOT"

    # Install dependencies if needed
    if [ ! -d ".venv" ] && [ ! -f "requirements.txt.installed" ]; then
        log_info "Installing Python dependencies..."
        pip install -r requirements.txt -q
        touch requirements.txt.installed
    fi

    # Start with uvicorn
    PORT="$OPERATOR_PORT" \
    uvicorn br_operator.main:app \
        --host 0.0.0.0 \
        --port "$OPERATOR_PORT" \
        --reload \
        &

    OPERATOR_PID=$!
    echo "$OPERATOR_PID" > "$PROJECT_ROOT/.operator.pid"

    log_success "Operator started (PID: $OPERATOR_PID)"
}

stop_operator() {
    if [ -f "$PROJECT_ROOT/.operator.pid" ]; then
        local pid=$(cat "$PROJECT_ROOT/.operator.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            log_success "Operator stopped"
        fi
        rm -f "$PROJECT_ROOT/.operator.pid"
    fi
}

show_status() {
    echo ""
    echo "============================================"
    echo " BlackRoad OS Dev Stack Status"
    echo "============================================"
    echo ""
    echo "Environment: $BR_ENV"
    echo ""

    # Postgres
    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; then
        echo -e "PostgreSQL:  ${GREEN}RUNNING${NC} ($PGHOST:$PGPORT)"
    else
        echo -e "PostgreSQL:  ${RED}STOPPED${NC}"
    fi

    # Operator
    if curl -s "http://localhost:$OPERATOR_PORT/health" >/dev/null 2>&1; then
        echo -e "Operator:    ${GREEN}RUNNING${NC} (http://localhost:$OPERATOR_PORT)"

        # Check governance health
        local gov_health=$(curl -s "http://localhost:$OPERATOR_PORT/governance/health" 2>/dev/null)
        if [ -n "$gov_health" ]; then
            echo "  - Policy engine: $(echo "$gov_health" | grep -o '"policy_engine":"[^"]*"' | cut -d'"' -f4)"
            echo "  - Ledger service: $(echo "$gov_health" | grep -o '"ledger_service":"[^"]*"' | cut -d'"' -f4)"
        fi
    else
        echo -e "Operator:    ${RED}STOPPED${NC}"
    fi

    echo ""
    echo "============================================"
    echo " Service URLs"
    echo "============================================"
    echo ""
    echo "Operator:        http://localhost:$OPERATOR_PORT"
    echo "  - Health:      http://localhost:$OPERATOR_PORT/health"
    echo "  - Governance:  http://localhost:$OPERATOR_PORT/governance/health"
    echo "  - Policy:      POST http://localhost:$OPERATOR_PORT/policy/evaluate"
    echo "  - Ledger:      POST http://localhost:$OPERATOR_PORT/ledger/event"
    echo "  - Agents:      http://localhost:$OPERATOR_PORT/agents"
    echo "  - Chat:        POST http://localhost:$OPERATOR_PORT/chat"
    echo ""
}

show_env() {
    echo ""
    echo "============================================"
    echo " Environment Variables"
    echo "============================================"
    echo ""
    echo "BR_ENV=$BR_ENV"
    echo "LOG_LEVEL=$LOG_LEVEL"
    echo ""
    echo "# Database"
    echo "DATABASE_URL=$DATABASE_URL"
    echo "LEDGER_DB_URL=$LEDGER_DB_URL"
    echo ""
    echo "# Ports"
    echo "OPERATOR_PORT=$OPERATOR_PORT"
    echo "GOV_API_PORT=$GOV_API_PORT"
    echo "WEB_APP_PORT=$WEB_APP_PORT"
    echo ""
    echo "# Governance"
    echo "GOV_API_URL=$GOV_API_URL"
    echo "POLICY_STORE_PATH=$POLICY_STORE_PATH"
    echo "LANGUAGE_VERSION=$LANGUAGE_VERSION"
    echo ""
    echo "# LLM (optional)"
    echo "OLLAMA_BASE_URL=$OLLAMA_BASE_URL"
    echo "LLM_MODEL=$LLM_MODEL"
    echo ""
}

up() {
    check_dependencies

    log_info "Starting BlackRoad OS dev stack..."
    echo ""

    # Start Postgres if not running
    if ! check_postgres; then
        if command -v docker >/dev/null 2>&1; then
            start_postgres_docker
        else
            log_error "PostgreSQL not running and Docker not available"
            log_info "Please start PostgreSQL manually or install Docker"
            exit 1
        fi
    fi

    # Run migrations
    run_migrations

    # Start operator
    start_operator

    # Wait for startup
    sleep 2

    show_status

    log_success "Dev stack is ready!"
    echo ""
    log_info "Press Ctrl+C to stop, or run: ./scripts/dev-stack.sh down"

    # Wait for Ctrl+C
    wait
}

down() {
    log_info "Stopping BlackRoad OS dev stack..."

    stop_operator

    # Optionally stop Postgres container
    if docker ps --format '{{.Names}}' | grep -q 'blackroad-postgres'; then
        read -p "Stop PostgreSQL container? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker stop blackroad-postgres
            log_success "PostgreSQL stopped"
        fi
    fi

    log_success "Dev stack stopped"
}

logs() {
    if [ -f "$PROJECT_ROOT/.operator.pid" ]; then
        local pid=$(cat "$PROJECT_ROOT/.operator.pid")
        log_info "Following operator logs (PID: $pid)..."
        log_info "Press Ctrl+C to stop"
        tail -f /dev/null  # uvicorn outputs to stdout, this is a placeholder
    else
        log_warn "Operator not running"
    fi
}

# ============================================
# RAILWAY HELPERS
# ============================================

railway_deploy() {
    if ! command -v railway >/dev/null 2>&1; then
        log_error "Railway CLI not installed"
        log_info "Install with: npm install -g @railway/cli"
        exit 1
    fi

    log_info "Deploying to Railway..."
    railway up
    log_success "Deployed!"
}

railway_logs() {
    railway logs -f
}

railway_shell() {
    railway shell
}

railway_link() {
    log_info "Linking to Railway project..."
    railway link
}

# ============================================
# MAIN
# ============================================

case "${1:-up}" in
    up|start)
        up
        ;;
    down|stop)
        down
        ;;
    restart)
        down
        up
        ;;
    status)
        show_status
        ;;
    logs)
        logs
        ;;
    env)
        show_env
        ;;
    migrate)
        check_postgres && run_migrations
        ;;
    # Railway commands
    deploy)
        railway_deploy
        ;;
    railway-logs)
        railway_logs
        ;;
    railway-shell)
        railway_shell
        ;;
    railway-link)
        railway_link
        ;;
    help|--help|-h)
        echo "BlackRoad OS Dev Stack"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  up, start    Start all services (default)"
        echo "  down, stop   Stop all services"
        echo "  restart      Restart all services"
        echo "  status       Show service status"
        echo "  logs         Tail service logs"
        echo "  env          Show environment variables"
        echo "  migrate      Run database migrations"
        echo ""
        echo "Railway:"
        echo "  deploy       Deploy to Railway"
        echo "  railway-logs Follow Railway logs"
        echo "  railway-shell Open Railway shell"
        echo "  railway-link Link to Railway project"
        echo ""
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
