#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const HOOKS_DIR = ".husky";
const PRE_COMMIT_PATH = join(HOOKS_DIR, "pre-commit");
const PRE_PUSH_PATH = join(HOOKS_DIR, "pre-push");

const PRE_COMMIT_CONTENT = `#!/usr/bin/env sh
# Husky pre-commit hook
# Runs lint-staged which executes Biome on staged files
# Also runs coverage check (non-blocking warning)

# Exit on any error, but we want to continue for warnings
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Change to the repository root (one level up from .husky)
cd "$SCRIPT_DIR/.."

# Run lint-staged to check only staged files
echo "🔍 Running pre-commit checks on staged files..."
npx lint-staged

echo "✅ Pre-commit checks passed!"

# Run coverage check (non-blocking)
echo "📊 Running coverage check..."
if bun run scripts/coverage-report/analyze.ts --quiet 2>&1; then
  echo "✅ Coverage check passed!"
else
  echo "⚠️  Coverage below threshold - commit allowed but please address coverage gaps"
fi
`;

const PRE_PUSH_CONTENT = `#!/usr/bin/env sh
# Husky pre-push hook
# Blocks push if coverage falls below blocking threshold

# Exit on any error
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Change to the repository root (one level up from .husky)
cd "$SCRIPT_DIR/.."

# Run coverage check
echo "📊 Running coverage check..."
if bun run scripts/coverage-report/analyze.ts --quiet 2>&1; then
  echo "✅ Coverage check passed! Push allowed."
else
  echo ""
  echo "❌ Push blocked: Coverage below blocking threshold!"
  echo ""
  echo "Please improve test coverage before pushing."
  echo "Run 'bun run coverage:analyze' to see detailed coverage report."
  echo ""
  exit 1
fi
`;

function installHooks(): void {
  console.log("Installing Goblin git hooks...");

  if (!existsSync(HOOKS_DIR)) {
    mkdirSync(HOOKS_DIR, { recursive: true });
  }

  if (existsSync(PRE_COMMIT_PATH)) {
    console.log(`\n⚠️  ${PRE_COMMIT_PATH} already exists.`);
    console.log("Overwrite pre-commit hook? (y/N): ");
  } else {
    writeFileSync(PRE_COMMIT_PATH, PRE_COMMIT_CONTENT, { mode: 0o755 });
    console.log(`✅ Installed ${PRE_COMMIT_PATH}`);
  }

  if (existsSync(PRE_PUSH_PATH)) {
    console.log(`\n⚠️  ${PRE_PUSH_PATH} already exists.`);
    console.log("Overwrite pre-push hook? (y/N): ");
  } else {
    writeFileSync(PRE_PUSH_PATH, PRE_PUSH_CONTENT, { mode: 0o755 });
    console.log(`✅ Installed ${PRE_PUSH_PATH}`);
  }

  console.log("\n✅ Git hooks installed successfully!");
  console.log("\nHooks will:");
  console.log("  - Warn on commit if coverage below 70% (non-blocking)");
  console.log("  - Block push if coverage below 60%");
  console.log("\nTo customize thresholds, edit coverage.config.json");
  console.log("\nNote: To overwrite existing hooks, delete them first or run with --force");
}

installHooks();
