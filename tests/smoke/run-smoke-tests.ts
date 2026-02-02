#!/usr/bin/env node
/**
 * Smoke Test Runner
 *
 * Runs all smoke tests and reports results.
 */

import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SMOKE_TEST_DIR = join(__dirname, "..", "..", "tests", "smoke");

async function runSmokeTests(): Promise<void> {
  console.log("Running Goblin Smoke Tests...\n");

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const childProcess = spawn("bun", ["test", SMOKE_TEST_DIR, "--reporter=verbose"], {
      cwd: process.cwd(),
      env: { ...process.env, NO_COLOR: "0" },
    });

    childProcess.stdout?.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    childProcess.stderr?.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    childProcess.on("error", (error) => {
      reject(error);
    });

    childProcess.on("exit", (code) => {
      const duration = Date.now() - startTime;
      console.log(`\n\nSmoke tests completed in ${(duration / 1000).toFixed(2)}s`);

      if (code === 0) {
        console.log("✅ All smoke tests passed!");
        resolve();
      } else {
        console.log(`❌ Smoke tests failed with exit code ${code}`);
        process.exit(code);
      }
    });
  });
}

runSmokeTests().catch((error) => {
  console.error("Error running smoke tests:", error);
  process.exit(1);
});
