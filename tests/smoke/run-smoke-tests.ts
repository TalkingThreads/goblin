#!/usr/bin/env node
/**
 * Smoke Test Runner
 *
 * Runs all smoke tests and reports results.
 */

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { smokeConfig } from "./smoke.config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..");
const SMOKE_TEST_DIR = join(__dirname, "..");
const RESULTS_DIR = join(ROOT_DIR, smokeConfig.reporting.outputDir);
const XML_PATH = join(RESULTS_DIR, smokeConfig.reporting.junitFile);
const JSON_PATH = join(RESULTS_DIR, smokeConfig.reporting.jsonFile);

interface TestSummary {
  timestamp: string;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  success: boolean;
}

async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if ((error as any).code !== "EEXIST") {
      throw error;
    }
  }
}

async function parseJUnitXml(
  xmlPath: string,
): Promise<{ total: number; failures: number; skipped: number; time: number }> {
  try {
    const content = await readFile(xmlPath, "utf-8");
    const match = content.match(
      /<testsuites[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*skipped="(\d+)"[^>]*time="([\d.]+)"/,
    );

    if (match) {
      return {
        total: parseInt(match[1] ?? "0", 10),
        failures: parseInt(match[2] ?? "0", 10),
        skipped: parseInt(match[3] ?? "0", 10),
        time: parseFloat(match[4] ?? "0"),
      };
    }
  } catch {
    // If file doesn't exist or is invalid, return zeros
  }

  return { total: 0, failures: 0, skipped: 0, time: 0 };
}

async function runSmokeTests(): Promise<void> {
  console.log("Running Goblin Smoke Tests...\n");
  await ensureDirectoryExists(RESULTS_DIR);

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const args = ["test", SMOKE_TEST_DIR];

    // Apply configuration from smoke.config.ts
    args.push(`--reporter=${smokeConfig.reporting.reporter}`);
    args.push("--timeout", smokeConfig.timeouts.test.toString());

    // Add JUnit reporter
    args.push("--reporter=junit");
    args.push("--reporter-outfile", XML_PATH);

    if (smokeConfig.parallel.enabled === false) {
      args.push("--test-concurrency", "1");
    } else if (smokeConfig.parallel.workers !== undefined) {
      args.push("--test-concurrency", String(smokeConfig.parallel.workers));
    }

    const childProcess = spawn("bun", args, {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        NO_COLOR: "0",
        SMOKE_TEST_RETRIES: smokeConfig.retries.attempts.toString(),
      },
    });

    // Handle suite timeout
    const suiteTimeout = setTimeout(() => {
      childProcess.kill();
      console.log(`\n❌ Smoke test suite timed out after ${smokeConfig.timeouts.suite / 1000}s`);
      process.exit(1);
    }, smokeConfig.timeouts.suite);

    childProcess.stdout?.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    childProcess.stderr?.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    childProcess.on("error", (error) => {
      clearTimeout(suiteTimeout);
      reject(error);
    });

    childProcess.on("exit", async (code) => {
      clearTimeout(suiteTimeout);
      const durationMs = Date.now() - startTime;

      const stats = await parseJUnitXml(XML_PATH);

      const summary: TestSummary = {
        timestamp: new Date().toISOString(),
        duration: durationMs,
        total: stats.total,
        passed: stats.total - stats.failures - stats.skipped,
        failed: stats.failures,
        skipped: stats.skipped,
        success: code === 0,
      };

      await writeFile(JSON_PATH, JSON.stringify(summary, null, 2));

      console.log(`\n\nSmoke tests completed in ${(durationMs / 1000).toFixed(2)}s`);
      console.log(`Results saved to: ${RESULTS_DIR}`);

      if (code === 0) {
        console.log("✅ All smoke tests passed!");
        resolve();
      } else {
        console.log(`❌ Smoke tests failed with ${stats.failures} failures`);
        process.exit(code ?? 1);
      }
    });
  });
}

runSmokeTests().catch((error) => {
  console.error("Error running smoke tests:", error);
  process.exit(1);
});
