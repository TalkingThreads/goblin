#!/bin/bash
# Goblin Inspector - SSE Transport
# Connects MCP Inspector to Goblin via SSE (Server-Sent Events) transport
#
# Usage: ./goblin-inspector-sse.sh [--port <port>] [--url <url>]
#
# Environment variables:
#   GOBLIN_URL      - Goblin SSE URL (default: http://localhost:3000)
#   INSPECTOR_PORT  - Inspector UI port (default: 6274)
#   MCP_INSPECTOR_TOKEN - Auth token (auto-generated if not set)

set -e

# Configuration
GOBLIN_URL="${GOBLIN_URL:-http://localhost:3000}"
INSPECTOR_PORT="${INSPECTOR_PORT:-6274}"
INSPECTOR_PROXY_PORT="${INSPECTOR_PROXY_PORT:-6277}"

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

generate_token() {
    if [ -n "$MCP_INSPECTOR_TOKEN" ]; then
        echo "$MCP_INSPECTOR_TOKEN"
    elif command -v openssl &> /dev/null; then
        openssl rand -hex 32
    elif command -v python3 &> /dev/null; then
        python3 -c "import secrets; print(secrets.token_hex(32))"
    else
        echo "$(date +%s)$$RANDOM" | md5sum | head -c 32
    fi
}

check_goblin_sse() {
    # SSE endpoint is typically /events
    SSE_URL="$GOBLIN_URL/events"
    if curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" "$SSE_URL" 2>/dev/null | grep -q "200\|404\|500"; then
        echo_success "Goblin SSE endpoint responding at: $SSE_URL"
        return 0
    else
        echo_warn "Could not verify SSE endpoint: $SSE_URL"
        echo_info "Make sure Goblin is running in SSE mode"
        echo_info "Trying anyway..."
        return 0
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --port)
                GOBLIN_URL="http://localhost:$2"
                shift 2
                ;;
            --url)
                GOBLIN_URL="$2"
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
Goblin Inspector - SSE Transport

Connects MCP Inspector to Goblin via SSE (Server-Sent Events) transport.

Usage: $(basename "$0") [OPTIONS]

Options:
  --port <port>      Goblin HTTP port (default: 3000)
  --url <url>         Full Goblin URL
  --help, -h          Show this help

Environment variables:
  GOBLIN_URL         Goblin URL (default: http://localhost:3000)
  INSPECTOR_PORT     Inspector UI port (default: 6274)
  MCP_INSPECTOR_TOKEN Auth token (auto-generated if not set)

Examples:
  $(basename "$0")
  $(basename "$0") --port 8080
  $(basename "$0") --url http://goblin.example.com:3000

EOF
}

main() {
    parse_args "$@"
    check_goblin_sse

    TOKEN=$(generate_token)
    SSE_URL="$GOBLIN_URL/events"

    echo_info "Starting Goblin Inspector (SSE mode)"
    echo_info "====================================="
    echo ""
    echo -e "  Goblin SSE: ${GREEN}$SSE_URL${NC}"
    echo -e "  Token:      ${YELLOW}$TOKEN${NC}"
    echo -e "  UI:         ${BLUE}http://localhost:$INSPECTOR_PORT${NC}"
    echo ""

    # For SSE transport, we use the Inspector's SSE mode
    CMD="npx @modelcontextprotocol/inspector"
    CMD="$CMD --transport sse"
    CMD="$CMD --serverUrl $SSE_URL"

    echo_info "Command: $CMD"
    echo ""
    echo -e "${GREEN}Opening browser...${NC}"
    echo ""
    echo "1. If browser doesn't open, navigate to:"
    echo "   http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN"
    echo ""
    echo "2. Press Ctrl+C to stop"
    echo ""

    export MCP_PROXY_AUTH_TOKEN="$TOKEN"
    export CLIENT_PORT="$INSPECTOR_PORT"
    export SERVER_PORT="$INSPECTOR_PROXY_PORT"

    # Open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN" &
    elif command -v open &> /dev/null; then
        open "http://localhost:$INSPECTOR_PORT/?MCP_PROXY_AUTH_TOKEN=$TOKEN" &
    fi

    eval "$CMD"
}

main "$@"
