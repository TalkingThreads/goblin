#!/usr/bin/env node
/**
 * Quality System Installer
 * Sets up pre-commit hooks and quality monitoring
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HUSKY_DIR = ".husky";
const HOOKS = {
  "pre-commit": `#!/bin/sh
# Goblin Pre-commit Hook - Quality Gate
# Prevents bad code from being committed

echo "🔍 Running quality checks..."

# TypeScript check - fail on any errors
if ! bun run typecheck 2>&1; then
  echo "❌ TypeScript errors found!"
  exit 1
fi

# Biome check - fail on any errors
if bun run lint 2>&1 | grep -E "Found [0-9]+ errors"; then
  echo "❌ Lint errors found!"
  exit 1
fi

echo "✅ Quality checks passed!"
`,
  "pre-commit-auto-fix": `#!/bin/sh
# Auto-fix common quality issues pre-commit
echo "🔧 Auto-fixing common issues..."
bun run lint:fix
echo "✅ Auto-fixes applied"
`,
};

function installHusky() {
  console.log("📦 Checking Husky...");

  try {
    // Check if husky is installed
    execSync("bun ls husky", { stdio: "pipe" });
    console.log("✅ Husky already installed");
  } catch {
    console.log("📦 Husky not found, skipping npm install...");
    console.log(
      "   Note: If Husky isn't installed, run 'npm install --save-dev husky@^9.1.5' manually",
    );
  }
}

function setupHuskyDir() {
  console.log("🔧 Setting up Husky directory...");

  if (!existsSync(HUSKY_DIR)) {
    mkdirSync(HUSKY_DIR, { recursive: true });
  }

  // Initialize Husky
  try {
    execSync("npx husky install", { stdio: "inherit" });
    console.log("✅ Husky initialized");
  } catch (_e) {
    console.log("⚠️  Husky init failed, trying alternative...");
    execSync("npx husky .", { stdio: "inherit" });
  }
}

function createHooks() {
  console.log("🔧 Creating pre-commit hooks...");

  for (const [name, content] of Object.entries(HOOKS)) {
    const hookPath = join(HUSKY_DIR, name);
    writeFileSync(hookPath, content, { mode: 0o755 });
    console.log(`✅ Created ${hookPath}`);
  }
}

function addHuskyConfig() {
  console.log("🔧 Configuring Husky in package.json...");

  const pkgPath = "package.json";
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  // Add husky configuration
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["postinstall"] = "husky install";

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log("✅ Husky config added to package.json");
}

function verifyInstallation() {
  console.log("🔍 Verifying installation...");

  try {
    // Test quality check
    console.log("\n🧪 Testing quality check...");
    execSync("bun run typecheck", { stdio: "inherit" });
    console.log("✅ TypeScript check works");

    console.log("\n🧪 Testing lint...");
    execSync("bun run lint", { stdio: "inherit" });
    console.log("✅ Lint check works");

    return true;
  } catch (_e) {
    console.log("⚠️  Some checks failed, but installation is complete");
    return false;
  }
}

// Main installation
function install() {
  console.log("🚀 Proactive Quality System Installer v1.0.0\n");

  installHusky();
  addHuskyConfig();
  setupHuskyDir();
  createHooks();

  console.log("\n✅ Installation complete!");

  const verified = verifyInstallation();

  console.log("\n📋 Next Steps:");
  console.log("   • Pre-commit hooks are now active");
  console.log("   • TypeScript and lint checks run before each commit");
  console.log("   • Use 'npm run quality:fix' to auto-fix issues");
  console.log("   • Use 'git commit' normally - hooks run automatically");

  if (!verified) {
    console.log("\n⚠️  Some quality checks failed initially.");
    console.log("   Run 'npm run quality:check' to see issues.");
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case "install":
  case undefined:
    install();
    break;

  case "hooks":
    createHooks();
    break;

  case "verify":
    verifyInstallation();
    break;

  default:
    console.log(`
🚀 Proactive Quality System Installer

Usage:
  npm run quality:install    # Install and configure quality system
  npm run quality:install hooks   # Just create hooks
  npm run quality:install verify  # Test installation

Options:
  install   - Full installation (default)
  hooks     - Only create hooks
  verify    - Test that quality checks work
    `);
    process.exit(0);
}

// Run if called directly
const isMainModule = process.argv[1]?.endsWith("install.js");
if (isMainModule) {
  install();
}
