#!/bin/bash

# =====================================================
# YenFlowers Development Startup Script
# Starts backend (FastAPI) and frontend (Vite) servers
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=5173

# PID files for tracking processes
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

# =====================================================
# Functions
# =====================================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}🌸 YenFlowers Development Server${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

check_docker_port() {
    local port=$1
    if command -v docker &> /dev/null; then
        local container_id=$(docker ps --format "{{.ID}} {{.Ports}}" | grep ":$port->" | awk '{print $1}')
        if [ -n "$container_id" ]; then
            echo "$container_id"
        fi
    fi
}

kill_process_on_port() {
    local port=$1
    
    # Check for Docker container first
    local container_id=$(check_docker_port $port)
    if [ -n "$container_id" ]; then
        local container_name=$(docker inspect --format '{{.Name}}' $container_id | sed 's/\///')
        log_warning "Port $port is being used by Docker container: $container_name ($container_id)"
        log_info "Stopping container..."
        docker stop $container_id > /dev/null
        sleep 2
        return
    fi

    # Check for regular process
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
    if [ -n "$pids" ]; then
        log_warning "Killing existing process on port $port (PID: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

cleanup() {
    echo ""
    log_info "Shutting down servers..."
    
    # Kill backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$backend_pid" 2>/dev/null; then
            log_info "Stopping backend (PID: $backend_pid)..."
            kill "$backend_pid" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            log_info "Stopping frontend (PID: $frontend_pid)..."
            kill "$frontend_pid" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Cleanup any remaining processes on our ports
    kill_process_on_port $BACKEND_PORT
    kill_process_on_port $FRONTEND_PORT
    
    log_success "All servers stopped. Goodbye! 👋"
    exit 0
}

start_docker_services() {
    log_info "Starting Docker services (PostgreSQL, Redis, etc.)..."
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found. Skipping Docker services."
        log_warning "Make sure your database is running elsewhere."
        return
    fi
    
    cd "$PROJECT_ROOT"
    if [ -f "docker-compose.yml" ]; then
        docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || {
            log_warning "Could not start Docker services. Continuing anyway..."
        }
        log_success "Docker services started"
    else
        log_warning "No docker-compose.yml found. Skipping Docker services."
    fi
}

start_backend() {
    log_info "Starting backend server (FastAPI on port $BACKEND_PORT)..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_warning "Virtual environment not found. Creating one..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    
    # Check if port is in use
    if check_port $BACKEND_PORT; then
        log_warning "Port $BACKEND_PORT is in use."
        read -p "Kill existing process? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_process_on_port $BACKEND_PORT
        else
            log_error "Cannot start backend. Port $BACKEND_PORT is in use."
            return 1
        fi
    fi
    
    # Start uvicorn in the background
    uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
    local pid=$!
    echo $pid > "$BACKEND_PID_FILE"
    
    # Wait a moment and check if it's running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        log_success "Backend started (PID: $pid)"
        echo -e "         ${GREEN}→${NC} API Docs: ${CYAN}http://localhost:$BACKEND_PORT/docs${NC}"
        echo -e "         ${GREEN}→${NC} Health:   ${CYAN}http://localhost:$BACKEND_PORT/health${NC}"
    else
        log_error "Backend failed to start. Check the logs above."
        return 1
    fi
}

start_frontend() {
    log_info "Starting frontend server (Vite on port $FRONTEND_PORT)..."
    
    cd "$PROJECT_ROOT"
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    # Check if port is in use
    if check_port $FRONTEND_PORT; then
        log_warning "Port $FRONTEND_PORT is in use."
        read -p "Kill existing process? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_process_on_port $FRONTEND_PORT
        else
            log_error "Cannot start frontend. Port $FRONTEND_PORT is in use."
            return 1
        fi
    fi
    
    # Start Vite in the background
    npm run dev &
    local pid=$!
    echo $pid > "$FRONTEND_PID_FILE"
    
    # Wait a moment and check if it's running
    sleep 3
    if kill -0 $pid 2>/dev/null; then
        log_success "Frontend started (PID: $pid)"
        echo -e "         ${GREEN}→${NC} App:      ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    else
        log_error "Frontend failed to start. Check the logs above."
        return 1
    fi
}

show_status() {
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}🚀 Development servers are running!${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BOLD}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${BOLD}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${BOLD}API Docs:${NC}  http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# =====================================================
# Main Script
# =====================================================

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

print_banner

# Parse arguments
SKIP_DOCKER=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --backend)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend)
            FRONTEND_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-docker    Skip starting Docker services"
            echo "  --backend      Start only the backend server"
            echo "  --frontend     Start only the frontend server"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Start services
if [ "$SKIP_DOCKER" = false ] && [ "$FRONTEND_ONLY" = false ]; then
    start_docker_services
fi

if [ "$FRONTEND_ONLY" = false ]; then
    start_backend
fi

if [ "$BACKEND_ONLY" = false ]; then
    start_frontend
fi

show_status

# Keep the script running and wait for processes
wait
