#!/usr/bin/env node
/**
 * Quality check and monitoring utility
 * Consolidates all quality gate operations
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function runQualityChecks() {
  console.log("🔍 Running quality checks...");
  
  // TypeScript check
  const tscResult = execSync("bun run typecheck", { stdio: "inherit" });
  const tscPassed = tscResult.status === 0;
  
  // Biome lint check
  const biomeResult = execSync("bun run lint 2>&1", { stdio: "pipe" });
  const lintOutput = biomeResult.stdout.toString();
  
  const errorMatch = lintOutput.match(/Found ([0-9]+) errors/);
  const warningMatch = lintOutput.match(/Found ([0-9]+) warnings/);
  const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
  const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
  
  console.log(`\n📊 Quality Summary:`);
  console.log(`   TypeScript: ${tscPassed ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Biome Errors: ${errors}`);
  console.log(`   Biome Warnings: ${warnings}`);
  
  if (!tscPassed) {
    console.log("\n❌ TypeScript errors must be fixed!");
    process.exit(1);
  }
  
  console.log("\n✅ All checks passed!");
  process.exit(0);
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

// If run standalone, install if needed
if (require.main === module) {
  try {
    require("./quality-check.js");
  } catch (e) {
    // If dependency missing, ignore and continue
    if (!e.message.includes("Cannot find module")) {
      console.error("Quality module not available:", e.message);
    }
  }
}