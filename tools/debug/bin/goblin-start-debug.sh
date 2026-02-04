#!/bin/bash
# Goblin Start Debug
# Start Goblin with debug logging enabled
#
# Usage: ./goblin-start-debug.sh [--args "..."]
#
# Environment variables:
#   GOBLIN_PATH   - Path to Goblin entry point (default: ./dist/index.js)
#   LOG_LEVEL     - Log level (default: trace)
#   DEBUG_LOG     - Debug log file path (default: ./logs/debug.log)

set -e

# Configuration
GOBLIN_PATH="${GOBLIN_PATH:-./dist/index.js}"
LOG_LEVEL="${LOG_LEVEL:-trace}"
DEBUG_LOG="${DEBUG_LOG:-./logs/debug.log}"
CONFIG_PATH="${CONFIG_PATH:-}"

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

# Create log directory
mkdir -p "$(dirname "$DEBUG_LOG")"

# Check Goblin exists
check_goblin() {
    if [ ! -f "$GOBLIN_PATH" ]; then
        echo_error "Goblin not found at: $GOBLIN_PATH"
        echo_info "Please run 'bun run build' first"
        exit 1
    fi
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --args)
                GOBLIN_ARGS="$2"
                shift 2
                ;;
            --config)
                CONFIG_PATH="$2"
                shift 2
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
Goblin Start Debug

Start Goblin with debug logging enabled for troubleshooting.

Usage: $(basename "$0") [OPTIONS]

Options:
  --args "..."    Arguments to pass to Goblin
  --config <path> Path to config file
  --help, -h      Show this help

Environment variables:
  GOBLIN_PATH   Path to Goblin dist/index.js
  LOG_LEVEL     Log level (default: trace)
  DEBUG_LOG     Debug log file path (default: ./logs/debug.log)

Debug features enabled:
  - LOG_LEVEL=trace (maximum verbosity)
  - DEBUG=1 (enables debug logging)
  - Logs written to both console and $DEBUG_LOG

Examples:
  $(basename "$0")
  $(basename "$0") --config /path/to/config.json
  $(basename "$0") --args "--port 8080"

EOF
}

main() {
    parse_args "$@"
    check_goblin

    echo_info "Starting Goblin with debug logging"
    echo_info "=================================="
    echo ""
    echo -e "  Goblin:   $GOBLIN_PATH"
    echo -e "  Log:      $DEBUG_LOG"
    echo -e "  Level:    $LOG_LEVEL"
    echo ""

    # Build environment
    export LOG_LEVEL="$LOG_LEVEL"
    export DEBUG="1"
    export DEBUG_LOG="$DEBUG_LOG"

    # Add config if specified
    local cmd="bun run $GOBLIN_PATH"
    if [ -n "$CONFIG_PATH" ]; then
        export GOBLIN_CONFIG="$CONFIG_PATH"
        cmd="$cmd --config $CONFIG_PATH"
    fi
    if [ -n "$GOBLIN_ARGS" ]; then
        cmd="$cmd $GOBLIN_ARGS"
    fi

    echo_info "Command: $cmd"
    echo ""
    echo -e "${GREEN}Starting Goblin...${NC}"
    echo ""

    # Run Goblin
    eval "$cmd"
}

main "$@"
