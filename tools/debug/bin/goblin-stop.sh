#!/bin/bash
# Goblin Stop
# Stop all Goblin processes gracefully
#
# Usage: ./goblin-stop.sh [--force]
#
# Environment variables:
#   GOBLIN_PID_FILE - Path to PID file (optional)

set -e

# Configuration
FORCE="${FORCE:-false}"
GRACEFUL_TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[OK]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Find Goblin processes
find_goblin_pids() {
    pgrep -f "goblin" 2>/dev/null || echo ""
}

# Send SIGTERM to process
send_sigterm() {
    local pid=$1
    echo_info "Sending SIGTERM to PID $pid..."
    kill -TERM "$pid" 2>/dev/null
}

# Send SIGKILL to process
send_sigkill() {
    local pid=$1
    echo_warn "Sending SIGKILL to PID $pid..."
    kill -KILL "$pid" 2>/dev/null
}

# Check if process is still running
is_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

# Wait for process to exit
wait_for_exit() {
    local pid=$1
    local count=0
    local max=$GRACEFUL_TIMEOUT

    while is_running "$pid" && [ $count -lt $max ]; do
        sleep 1
        ((count++))
        echo_info "Waiting for PID $pid to exit... ($count/${max}s)"
    done

    if is_running "$pid"; then
        return 1
    fi
    return 0
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                FORCE="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Goblin Stop

Stop all Goblin processes gracefully.

Usage: $(basename "$0") [OPTIONS]

Options:
  --force, -f    Force kill processes (send SIGKILL)
  --help, -h     Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --force

EOF
}

# Main
main() {
    parse_args "$@"

    echo_info "Stopping Goblin processes..."
    echo ""

    local pids=$(find_goblin_pids)

    if [ -z "$pids" ]; then
        echo_success "No Goblin processes found"
        exit 0
    fi

    local pid_count=$(echo "$pids" | wc -w)
    echo_info "Found $pid_count Goblin process(es): $pids"
    echo ""

    # Try graceful shutdown first
    for pid in $pids; do
        send_sigterm "$pid"
    done

    # Wait for graceful shutdown
    local all_exited=true
    for pid in $pids; do
        if is_running "$pid"; then
            if ! wait_for_exit "$pid"; then
                if [ "$FORCE" = "true" ]; then
                    for pid in $pids; do
                        if is_running "$pid"; then
                            send_sigkill "$pid"
                        fi
                    done
                else
                    all_exited=false
                    echo_warn "Process $pid did not exit gracefully"
                fi
            fi
        fi
    done

    echo ""

    # Verify all processes are stopped
    local remaining=$(find_goblin_pids)
    if [ -z "$remaining" ]; then
        echo_success "All Goblin processes stopped"
    else
        echo_error "Some processes still running: $remaining"
        echo_info "Use --force to force kill"
        exit 1
    fi
}

main "$@"
