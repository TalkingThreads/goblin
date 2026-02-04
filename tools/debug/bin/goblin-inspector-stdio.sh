#!/bin/bash
# Goblin Inspector - STDIO Transport
# Connects MCP Inspector to Goblin via STDIO transport
#
# Usage: ./goblin-inspector-stdio.sh [--goblin-args "..."] [--inspector-args "..."]
#
# Environment variables:
#   GOBLIN_PATH     - Path to Goblin dist/index.js (default: ./dist/index.js)
#   INSPECTOR_PORT  - Inspector UI port (default: 6274)
#   MCP_INSPECTOR_TOKEN - Auth token (auto-generated if not set)

set -e

# Configuration
GOBLIN_PATH="${GOBLIN_PATH:-./dist/index.js}"
INSPECTOR_PORT="${INSPECTOR_PORT:-6274}"
INSPECTOR_PROXY_PORT="${INSPECTOR_PROXY_PORT:-6277}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate auth token
generate_token() {
    if [ -n "$MCP_INSPECTOR_TOKEN" ]; then
        echo "$MCP_INSPECTOR_TOKEN"
    else
        # Generate random token
        if command -v openssl &> /dev/null; then
            openssl rand -hex 32
        elif command -v python3 &> /dev/null; then
            python3 -c "import secrets; print(secrets.token_hex(32))"
        elif command -v python &> /dev/null; then
            python -c "import uuid; print(uuid.uuid4().hex + uuid.uuid4().hex)"
        else
            # Fallback: use date + random
            echo "$(date +%s)$$RANDOM" | md5sum | head -c 32
        fi
    fi
}

# Check if Goblin exists
check_goblin() {
    if [ ! -f "$GOBLIN_PATH" ]; then
        echo_error "Goblin not found at: $GOBLIN_PATH"
        echo_info "Please run 'bun run build' first"
        exit 1
    fi
    echo_success "Found Goblin at: $GOBLIN_PATH"
}

# Parse arguments
parse_args() {
    GOBLIN_ARGS=""
    INSPECTOR_ARGS=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --goblin-args)
                GOBLIN_ARGS="$2"
                shift 2
                ;;
            --inspector-args)
                INSPECTOR_ARGS="$2"
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
Goblin Inspector - STDIO Transport

Connects MCP Inspector to Goblin via STDIO transport for interactive debugging.

Usage: $(basename "$0") [OPTIONS]

Options:
  --goblin-args "..."    Arguments to pass to Goblin
  --inspector-args "..." Arguments to pass to Inspector
  --help, -h             Show this help

Environment variables:
  GOBLIN_PATH            Path to Goblin dist/index.js
  INSPECTOR_PORT         Inspector UI port (default: 6274)
  MCP_INSPECTOR_TOKEN    Auth token (auto-generated if not set)

Examples:
  $(basename "$0")
  $(basename "$0") --goblin-args "--config /path/to/config.json"
  $(basename "$0") --inspector-args "--method tools/list"

EOF
}

# Main
main() {
    parse_args "$@"
    check_goblin

    TOKEN=$(generate_token)

    echo_info "Starting Goblin Inspector (STDIO mode)"
    echo_info "======================================="
    echo ""
    echo -e "  Goblin:    ${GREEN}$GOBLIN_PATH${NC}"
    echo -e "  Token:     ${YELLOW}$TOKEN${NC}"
    echo -e "  UI:        ${BLUE}http://localhost:$INSPECTOR_PORT${NC}"
    echo ""

    # Build command
    CMD="npx @modelcontextprotocol/inspector"

    if [ -n "$GOBLIN_ARGS" ]; then
        CMD="$CMD -- $GOBLIN_PATH $GOBLIN_ARGS"
    else
        CMD="$CMD $GOBLIN_PATH"
    fi

    echo_info "Command: $CMD"
    echo ""
    echo -e "${GREEN}Opening browser...${NC}"
    echo ""
    echo "1. If browser doesn't open, navigate to:"
    echo "   http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN"
    echo ""
    echo "2. Press Ctrl+C to stop"
    echo ""

    # Set environment and run
    export MCP_PROXY_AUTH_TOKEN="$TOKEN"
    export CLIENT_PORT="$INSPECTOR_PORT"
    export SERVER_PORT="$INSPECTOR_PROXY_PORT"

    # Open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN" &
    elif command -v open &> /dev/null; then
        open "http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN" &
    fi

    # Run Inspector
    eval "$CMD"
}

main "$@"
