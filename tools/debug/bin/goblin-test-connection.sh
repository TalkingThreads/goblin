#!/bin/bash
# Goblin Test Connection
# Test connectivity to Goblin MCP Gateway
#
# Usage: ./goblin-test-connection.sh [--url <url>] [--json]
#
# Environment variables:
#   GOBLIN_URL   - Goblin URL (default: http://localhost:3000)

set -e

# Configuration
GOBLIN_URL="${GOBLIN_URL:-http://localhost:3000}"
OUTPUT_JSON="${OUTPUT_JSON:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() {
    if [ "$OUTPUT_JSON" = "true" ]; then
        echo ",\"$1\": true"
    else
        echo -e "  ${GREEN}✓${NC} $1"
    fi
}

fail() {
    local msg="$1"
    if [ "$OUTPUT_JSON" = "true" ]; then
        echo ",\"$1\": false"
        echo ",\"${1}_error\": \"$msg\""
    else
        echo -e "  ${RED}✗${NC} $1: $msg"
    fi
}

info() {
    if [ "$OUTPUT_JSON" = "true" ]; then
        echo ",\"$1_info\": \"$2\""
    else
        echo -e "  ${BLUE}•${NC} $1: $2"
    fi
}

# Test TCP connectivity
test_tcp() {
    local host=$(echo "$GOBLIN_URL" | sed -E 's|https?://([^/:]+).*|\1|')
    local port=$(echo "$GOBLIN_URL" | sed -E 's|https?://[^:]+:([0-9]+).*|\1|')

    if [ -z "$port" ]; then
        port=80
    fi

    if command -v nc &> /dev/null; then
        if nc -z -w 3 "$host" "$port" 2>/dev/null; then
            pass "tcp_connect"
        else
            fail "tcp_connect" "Connection refused"
        fi
    else
        if curl -s --connect-timeout 3 "$GOBLIN_URL" > /dev/null 2>&1; then
            pass "tcp_connect"
        else
            fail "tcp_connect" "Cannot connect to $host:$port"
        fi
    fi
}

# Test HTTP endpoint
test_http() {
    local response=$(curl -s --connect-timeout 5 -w "\n%{http_code}" "$GOBLIN_URL/health" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        pass "http_health"
        info "health_response" "OK"
    else
        fail "http_health" "HTTP $http_code"
    fi
}

# Test tools endpoint
test_tools() {
    local response=$(curl -s --connect-timeout 5 -w "\n%{http_code}" "$GOBLIN_URL/api/v1/tools" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        pass "http_tools"
        local count=$(echo "$response" | head -n -1 | grep -o '"name"' | wc -l)
        info "tools_count" "$count"
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        pass "http_tools"
        info "tools_response" "Authentication required"
    else
        fail "http_tools" "HTTP $http_code"
    fi
}

# Test servers endpoint
test_servers() {
    local response=$(curl -s --connect-timeout 5 -w "\n%{http_code}" "$GOBLIN_URL/api/v1/servers" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        pass "http_servers"
        local count=$(echo "$response" | head -n -1 | grep -o '"name"' | wc -l)
        info "servers_count" "$count"
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        pass "http_servers"
        info "servers_response" "Authentication required"
    else
        fail "http_servers" "HTTP $http_code"
    fi
}

# Measure latency
measure_latency() {
    local start=$(date +%s%3N)
    curl -s --connect-timeout 5 "$GOBLIN_URL/health" > /dev/null 2>&1
    local end=$(date +%s%3N)
    local latency=$((end - start))

    if [ "$OUTPUT_JSON" = "true" ]; then
        echo ",\"latency_ms\": $latency"
    else
        echo -e "  ${BLUE}•${NC} Latency: ${latency}ms"
    fi
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --url)
                GOBLIN_URL="$2"
                shift 2
                ;;
            --json)
                OUTPUT_JSON="true"
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
Goblin Test Connection

Test connectivity to Goblin MCP Gateway.

Usage: $(basename "$0") [OPTIONS]

Options:
  --url <url>   Goblin URL (default: http://localhost:3000)
  --json        Output in JSON format
  --help, -h    Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --url http://goblin.local:3000
  $(basename "$0") --json

EOF
}

main() {
    parse_args "$@"

    if [ "$OUTPUT_JSON" = "true" ]; then
        echo -n "{\"url\": \"$GOBLIN_URL\", \"tests\": {"
    else
        echo ""
        echo -e "${BLUE}Testing Goblin connectivity: $GOBLIN_URL${NC}"
        echo "  ========================================="
        echo ""
    fi

    test_tcp
    test_http
    test_tools
    test_servers
    measure_latency

    if [ "$OUTPUT_JSON" = "true" ]; then
        echo "}}"
    else
        echo ""
    fi
}

main "$@"
