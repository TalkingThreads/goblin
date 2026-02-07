#!/bin/bash
# Smart Test Selection Script
# Runs only tests affected by changed files

set -e

# Default to running all tests
RUN_ALL=false
TEST_PATTERN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      RUN_ALL=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--all]"
      exit 1
      ;;
  esac
done

# Get changed files
if [ "$RUN_ALL" = true ]; then
  echo "🧪 Running all tests (forced with --all)"
  bun test
  exit 0
fi

# Try to get changed files from git
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only origin/main...HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  Could not determine changed files, running all tests"
  bun test
  exit 0
fi

echo "📁 Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  /'
echo ""

# Map changed files to test patterns
if echo "$CHANGED_FILES" | grep -q "^src/config/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/config|tests/integration/hot-reload"
fi

if echo "$CHANGED_FILES" | grep -q "^src/gateway/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/gateway|tests/integration/e2e|tests/smoke/discovery"
fi

if echo "$CHANGED_FILES" | grep -q "^src/transport/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/transport|tests/integration/transport"
fi

if echo "$CHANGED_FILES" | grep -q "^src/resources/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/resources|tests/integration/resources"
fi

if echo "$CHANGED_FILES" | grep -q "^src/prompts/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/prompts|tests/integration/multi-server"
fi

if echo "$CHANGED_FILES" | grep -q "^src/cli/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/cli|tests/smoke/cli|tests/e2e/cli-tui"
fi

if echo "$CHANGED_FILES" | grep -q "^src/tui/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/tui|tests/e2e/cli-tui"
fi

if echo "$CHANGED_FILES" | grep -q "^src/observability/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/observability"
fi

if echo "$CHANGED_FILES" | grep -q "package.json\|bun.lock"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/|tests/smoke/"
fi

# Remove leading | if present
TEST_PATTERN=$(echo "$TEST_PATTERN" | sed 's/^|//')

if [ -z "$TEST_PATTERN" ]; then
  echo "⚠️  No test mapping found for changed files"
  echo "   Running unit tests as fallback"
  bun test tests/unit/
else
  echo "🧪 Running affected tests:"
  echo "$TEST_PATTERN" | tr '|' '\n' | sed 's/^/  /'
  echo ""
  
  # Convert pattern to filter and run tests
  bun test --filter "$TEST_PATTERN"
fi
