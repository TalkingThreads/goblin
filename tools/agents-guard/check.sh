#!/bin/bash
# Agent Compliance Check Script
# Validates that AI agents follow quality requirements

set -e

ERRORS=0

echo "🔍 Running agent compliance checks..."

# Check 1: CHANGELOG.md updated (if source files changed)
echo "📋 Checking CHANGELOG.md..."
CHANGED_FILES=$(git diff --cached --name-only HEAD 2>/dev/null || git diff --name-only HEAD)
SOURCE_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^(src/|tests/|package\.json)' || true)

if [ -n "$SOURCE_CHANGES" ]; then
    if echo "$CHANGED_FILES" | grep -q "CHANGELOG.md"; then
        echo "  ✅ CHANGELOG.md updated"
    else
        echo "  ❌ CHANGELOG.md NOT updated (source files changed)"
        echo "     Changed source files:"
        echo "$SOURCE_CHANGES" | sed 's/^/       /'
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ⏭️  No source changes, skipping CHANGELOG check"
fi

# Check 2: No skipped tests in new/modified test files
echo "🧪 Checking for skipped tests..."
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E '\.test\.(ts|tsx|js|jsx)$' || true)
if [ -n "$TEST_FILES" ]; then
    SKIPPED_TESTS=$(grep -l "\.skip\|\.todo" $TEST_FILES 2>/dev/null || true)
    if [ -n "$SKIPPED_TESTS" ]; then
        echo "  ⚠️  Found skipped/todo tests in:"
        echo "$SKIPPED_TESTS" | sed 's/^/       /'
        echo "     Ensure these are intentional and documented"
    else
        echo "  ✅ No skipped tests found"
    fi
else
    echo "  ⏭️  No test files changed"
fi

# Check 3: Lint was run (check for uncommitted lint fixes)
echo "🔍 Checking lint status..."
LINT_ERRORS=$(bun run lint 2>&1 | grep -c "error:" || true)
if [ "$LINT_ERRORS" -gt 0 ]; then
    echo "  ❌ Lint errors found: $LINT_ERRORS"
    echo "     Run 'bun run lint:fix' to auto-fix issues"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ No lint errors"
fi

# Check 4: TypeScript compiles
echo "📘 Checking TypeScript..."
if bun run typecheck 2>&1 | grep -q "error TS"; then
    echo "  ❌ TypeScript errors found"
    echo "     Run 'bun run typecheck' for details"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ TypeScript compilation successful"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All compliance checks passed!"
    exit 0
else
    echo "❌ Compliance check failed with $ERRORS error(s)"
    echo ""
    echo "Fix the issues above before committing."
    echo "To bypass (not recommended): git commit --no-verify"
    exit 1
fi
