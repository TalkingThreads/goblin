#!/bin/bash
# Goblin Logs
# View and filter Goblin logs
#
# Usage: ./goblin-logs.sh [--follow] [--level <level>] [--component <name>] [--json]
#
# Environment variables:
#   GOBLIN_LOG_PATH   - Path to log file (default: ./logs/app.log)

set -e

# Configuration
GOBLIN_LOG_PATH="${GOBLIN_LOG_PATH:-./logs/app.log}"
FOLLOW="${FOLLOW:-false}"
LEVEL="${LEVEL:-}"
COMPONENT="${COMPONENT:-}"
OUTPUT_JSON="${OUTPUT_JSON:-false}"
TAIL_LINES="${TAIL_LINES:-100}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Log level colors
declare -A LEVEL_COLORS=(
    ["trace"]="${CYAN}"
    ["debug"]="${BLUE}"
    ["info"]="${GREEN}"
    ["warn"]="${YELLOW}"
    ["error"]="${RED}"
    ["fatal"]="${RED}"
)

# Parse log line and format output
format_log() {
    local line="$1"

    # Extract timestamp (ISO format)
    local timestamp=$(echo "$line" | grep -oE '"time":"[^"]*"' | sed 's/"time":"//;s/"//' | head -1)
    if [ -z "$timestamp" ]; then
        timestamp=$(echo "$line" | grep -oE 'time":"[^"]*"' | sed 's/time":"//;s/"//' | head -1)
    fi

    # Extract level
    local level=$(echo "$line" | grep -oE '"level":"[^"]*"' | sed 's/"level":"//;s/"//' | head -1)
    if [ -z "$level" ]; then
        level=$(echo "$line" | grep -oE 'level":"[^"]*"' | sed 's/level":"//;s/"//' | head -1)
    fi
    level="${level,,}"

    # Extract component
    local component=$(echo "$line" | grep -oE '"component":"[^"]*"' | sed 's/"component":"//;s/"//' | head -1)
    if [ -z "$component" ]; then
        component=$(echo "$line" | grep -oE 'component":"[^"]*"' | sed 's/component":"//;s/"//' | head -1)
    fi

    # Extract message
    local message=$(echo "$line" | grep -oE '"msg":"[^"]*"' | sed 's/"msg":"//;s/"//' | head -1)
    if [ -z "$message" ]; then
        message=$(echo "$line" | grep -oE 'msg":"[^"]*"' | sed 's/msg":"//;s/"//' | head -1)
    fi

    # Skip empty lines
    if [ -z "$level" ] && [ -z "$message" ]; then
        return 1
    fi

    # Apply filters
    if [ -n "$LEVEL" ]; then
        local level_order="trace debug info warn error fatal"
        local level_index=$(echo "$level_order" | tr ' ' '\n' | grep -n "^${LEVEL}$" | cut -d: -f1)
        local current_index=$(echo "$level_order" | tr ' ' '\n' | grep -n "^${level}$" | cut -d: -f1)

        if [ -n "$level_index" ] && [ -n "$current_index" ]; then
            if [ "$current_index" -lt "$level_index" ]; then
                return 1
            fi
        fi
    fi

    if [ -n "$COMPONENT" ]; then
        if [ "$component" != "$COMPONENT" ]; then
            return 1
        fi
    fi

    # Format output
    local color="${LEVEL_COLORS[$level]:-$NC}"
    local timestamp_short=$(echo "$timestamp" | sed 's/T/ /;s/\.[0-9]*Z//')

    if [ "$OUTPUT_JSON" = "true" ]; then
        echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"component\":\"$component\",\"message\":\"$message\"}"
    else
        echo -e "[${timestamp_short}] ${color}${level^^}${NC} [${component:-?}] ${message}"
    fi
}

# Tail log file
tail_log() {
    if [ ! -f "$GOBLIN_LOG_PATH" ]; then
        echo_error "Log file not found: $GOBLIN_LOG_PATH"
        exit 1
    fi

    if [ "$FOLLOW" = "true" ]; then
        tail -n +1 -f "$GOBLIN_LOG_PATH" | while IFS= read -r line; do
            format_log "$line"
        done
    else
        tail -n "$TAIL_LINES" "$GOBLIN_LOG_PATH" | while IFS= read -r line; do
            format_log "$line"
        done
    fi
}

# Show recent logs
show_recent() {
    if [ ! -f "$GOBLIN_LOG_PATH" ]; then
        echo_error "Log file not found: $GOBLIN_LOG_PATH"
        exit 1
    fi

    echo_info "Showing last $TAIL_LINES lines of: $GOBLIN_LOG_PATH"
    echo ""

    tail -n "$TAIL_LINES" "$GOBLIN_LOG_PATH" | while IFS= read -r line; do
        format_log "$line"
    done
}

# Count logs by level
count_levels() {
    if [ ! -f "$GOBLIN_LOG_PATH" ]; then
        echo_error "Log file not found: $GOBLIN_LOG_PATH"
        exit 1
    fi

    echo_info "Log level distribution:"
    echo ""

    local counts=$(grep -oE '"level":"[^"]*"' "$GOBLIN_LOG_PATH" | sed 's/"level":"//;s/"//' | sort | uniq -c | sort -rn)

    echo "$counts" | while read count level; do
        local color="${LEVEL_COLORS[$level]:-$NC}"
        if [ "$level" ]; then
            echo -e "  ${color}$level${NC}: $count"
        fi
    done
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --follow|-f)
                FOLLOW="true"
                shift
                ;;
            --level)
                LEVEL="$2"
                shift 2
                ;;
            --component|-c)
                COMPONENT="$2"
                shift 2
                ;;
            --lines|-n)
                TAIL_LINES="$2"
                shift 2
                ;;
            --json)
                OUTPUT_JSON="true"
                shift
                ;;
            --count)
                MODE="count"
                shift
                ;;
            --path)
                GOBLIN_LOG_PATH="$2"
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
Goblin Logs

View and filter Goblin logs.

Usage: $(basename "$0") [OPTIONS]

Options:
  --follow, -f      Follow log output in real-time
  --level <level>  Filter by log level (trace, debug, info, warn, error, fatal)
  --component, -c  Filter by component name
  --lines, -n      Number of lines to show (default: 100)
  --count          Show log level distribution
  --path <path>    Path to log file (default: ./logs/app.log)
  --json           Output in JSON format
  --help, -h       Show this help

Environment variables:
  GOBLIN_LOG_PATH  Path to log file (default: ./logs/app.log)

Examples:
  $(basename "$0")
  $(basename "$0") --follow
  $(basename "$0") --level error
  $(basename "$0") --level warn --component gateway
  $(basename "$0") --count
  $(basename "$0") --json | jq '.'

EOF
}

main() {
    parse_args "$@"

    MODE="${MODE:-view}"

    if [ "$MODE" = "count" ]; then
        count_levels
    else
        show_recent
    fi
}

main "$@"
