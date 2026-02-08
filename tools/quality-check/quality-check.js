#!/usr/bin/env node
/**
 * Quality check and monitoring utility
 * Consolidates all quality gate operations
 */

import { execSync } from "node:child_process";

function runQualityChecks() {
  console.log("🔍 Running quality checks...");

  // TypeScript check - fail on any errors
  try {
    execSync("bun run typecheck", { stdio: "inherit" });
    console.log("✅ TypeScript check passed");
  } catch {
    console.log("❌ TypeScript errors found!");
    process.exit(1);
  }

  // Biome lint check on source files only
  try {
    execSync("bun run biome check src/", { stdio: "inherit" });
    console.log("✅ Lint check passed");
  } catch {
    console.log("❌ Lint errors found in source files!");
    process.exit(1);
  }

  console.log("\n✅ All quality checks passed!");
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case "check":
  case undefined:
    runQualityChecks();
    break;

  default:
    console.log(`
🚀 Proactive Quality System v1.0.0

Usage:
  npm run quality:check    # Run full quality checks
  npm run quality:fix      # Auto-fix common issues

Available commands:
  check     - Run typecheck and lint
  fix       - Run auto-fix for simple issues

Examples:
  npm run quality:check    # Check before committing
  npm run quality:fix      # Auto-fix before committing
    `);
    process.exit(0);
}

// Export for use as a module
export { runQualityChecks };
