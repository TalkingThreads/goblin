#!/bin/bash
# Goblin Health Check
# Comprehensive health diagnostics for Goblin MCP Gateway
#
# Usage: ./goblin-health.sh [--url <url>] [--json]
#
# Environment variables:
#   GOBLIN_URL   - Goblin URL (default: http://localhost:3000)
#   GOBLIN_PATH  - Path to Goblin dist/index.js (for process check)

set -e

# Configuration
GOBLIN_URL="${GOBLIN_URL:-http://localhost:3000}"
GOBLIN_PATH="${GOBLIN_PATH:-./dist/index.js}"
OUTPUT_JSON="${OUTPUT_JSON:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "  ${BLUE}•${NC} $1"
}

header() {
    echo ""
    echo -e "${CYAN}$1${NC}"
    echo "  ========================================="
}

json_start() {
    if [ "$OUTPUT_JSON" = "true" ]; then
        echo "{"
    fi
}

json_end() {
    if [ "$OUTPUT_JSON" = "true" ]; then
        echo "}"
    fi
}

json_field() {
    local key="$1"
    local value="$2"
    if [ "$OUTPUT_JSON" = "true" ]; then
        if [ -n "$PREV" ]; then
            echo "," >> /dev/null
        fi
        echo -n "  \"$key\": $value"
    fi
}

# Check if Goblin process is running
check_process() {
    header "Process Status"

    if pgrep -f "goblin" > /dev/null 2>&1; then
        local pids=$(pgrep -f "goblin" | tr '\n' ' ')
        info "Goblin process(es) found: $pids"
        pass "Process running"

        # Get process details
        for pid in $pids; do
            local ppid=$(ps -o ppid= -p $pid 2>/dev/null | tr -d ' ')
            local cpu=$(ps -o %cpu= -p $pid 2>/dev/null | tr -d ' ')
            local mem=$(ps -o %mem= -p $pid 2>/dev/null | tr -d ' ')
            local time=$(ps -o time= -p $pid 2>/dev/null | tr -d ' ')

            if [ -n "$cpu" ]; then
                info "  PID $pid: CPU=$cpu%, MEM=$mem%, TIME=$time"
            fi
        done
    else
        warn "No Goblin process found (normal if using HTTP transport)"
    fi
}

# Check HTTP endpoint
check_http() {
    header "HTTP Endpoint Check"

    local health_url="$GOBLIN_URL/health"
    local start_time=$(date +%s%3N)

    local response=$(curl -s --connect-timeout 5 -w "\n%{http_code}" "$health_url" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)
    local end_time=$(date +%s%3N)
    local latency=$((end_time - start_time))

    if [ "$http_code" = "200" ]; then
        pass "Health endpoint responding (${latency}ms)"
    else
        fail "Health endpoint returned HTTP $http_code"
        return
    fi

    # Parse health response
    if echo "$body" | grep -q "servers"; then
        local servers=$(echo "$body" | grep -o '"servers":[0-9]*' | grep -o '[0-9]*')
        info "Connected servers: $servers"
    fi

    if echo "$body" | grep -q "tools"; then
        local tools=$(echo "$body" | grep -o '"tools":[0-9]*' | grep -o '[0-9]*')
        info "Registered tools: $tools"
    fi
}

# Check specific endpoints
check_endpoints() {
    header "Endpoint Availability"

    local endpoints=(
        "/health"
        "/api/v1/tools"
        "/api/v1/servers"
    )

    for endpoint in "${endpoints[@]}"; do
        local start_time=$(date +%s%3N)
        local http_code=$(curl -s --connect-timeout 3 -o /dev/null -w "%{http_code}" "$GOBLIN_URL$endpoint" 2>/dev/null)
        local end_time=$(date +%s%3N)
        local latency=$((end_time - start_time))

        if [ "$http_code" = "200" ]; then
            pass "$endpoint (${latency}ms)"
        elif [ "$http_code" = "404" ]; then
            warn "$endpoint (404 - endpoint may not exist)"
        elif [ "$http_code" = "000" ]; then
            fail "$endpoint (connection failed)"
        else
            warn "$endpoint (HTTP $http_code)"
        fi
    done
}

# Check log file
check_logs() {
    header "Log File Check"

    local log_file="./logs/app.log"
    if [ -f "$log_file" ]; then
        local size=$(du -h "$log_file" | cut -f1)
        local lines=$(wc -l < "$log_file")
        info "Log file: $log_file"
        info "Size: $size, Lines: $lines"

        # Check for recent errors
        local errors=$(grep -c "error" "$log_file" 2>/dev/null || echo "0")
        if [ "$errors" -gt 0 ]; then
            warn "Found $errors error entries in log"
        else
            pass "No recent errors in log"
        fi
    else
        warn "Log file not found: $log_file"
    fi
}

# Check configuration
check_config() {
    header "Configuration Check"

    local config_paths=(
        "./goblin.json"
        "./config.json"
        "~/.config/goblin/config.json"
    )

    for path in "${config_paths[@]}"; do
        # Expand tilde
        local expanded_path="${path/#\~/$HOME}"
        if [ -f "$expanded_path" ]; then
            info "Config found: $expanded_path"
            pass "Configuration file present"
            return
        fi
    done

    warn "No configuration file found"
}

# Check dependencies
check_dependencies() {
    header "Dependencies"

    if command -v bun &> /dev/null; then
        pass "Bun is installed"
    else
        fail "Bun is not installed"
    fi

    if [ -f "package.json" ]; then
        pass "package.json found"
    else
        fail "package.json not found"
    fi

    if [ -d "node_modules" ] || [ -d "bun.lockb" ]; then
        pass "Dependencies installed"
    else
        warn "Dependencies may not be installed"
    fi
}

# Print summary
print_summary() {
    header "Summary"

    echo -e "  ${GREEN}Passed:${NC}  $PASSED"
    echo -e "  ${RED}Failed:${NC}  $FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}Goblin appears to be healthy!${NC}"
    else
        echo -e "${RED}Some checks failed. Review the output above.${NC}"
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
Goblin Health Check

Comprehensive health diagnostics for Goblin MCP Gateway.

Usage: $(basename "$0") [OPTIONS]

Options:
  --url <url>    Goblin URL (default: http://localhost:3000)
  --json         Output in JSON format
  --help, -h     Show this help

Environment variables:
  GOBLIN_URL     Goblin URL (default: http://localhost:3000)
  GOBLIN_PATH    Path to Goblin dist/index.js

Examples:
  $(basename "$0")
  $(basename "$0") --url http://goblin.local:3000
  $(basename "$0") --json | jq '.'

EOF
}

main() {
    parse_args "$@"

    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       Goblin Health Check              ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo -e "  Target: ${GREEN}$GOBLIN_URL${NC}"
    echo -e "  Time:   $(date)"

    check_process
    check_http
    check_endpoints
    check_logs
    check_config
    check_dependencies
    print_summary
}

main "$@"
