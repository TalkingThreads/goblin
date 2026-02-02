/**
 * Performance Test Runner
 *
 * Runs all performance tests and reports results.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PERFORMANCE_DIR = join(import.meta.dir, "..");
const RESULTS_DIR = join(PERFORMANCE_DIR, "..", "..", "test-results", "performance");

interface PerformanceTestSummary {
  timestamp: string;
  duration: number;
  categories: {
    load: { total: number; passed: number; failed: number };
    memory: { total: number; passed: number; failed: number };
    latency: { total: number; passed: number; failed: number };
    throughput: { total: number; passed: number; failed: number };
    baseline: { total: number; passed: number; failed: number };
  };
  overall: {
    total: number;
    passed: number;
    failed: number;
    success: boolean;
  };
}

async function runPerformanceTests(): Promise<void> {
  console.log("Running Goblin Performance Tests...\n");
  await mkdir(RESULTS_DIR, { recursive: true });

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const childProcess = spawn("bun", ["test", PERFORMANCE_DIR, "--reporter=verbose"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NO_COLOR: "0",
        PERF_MODE: "true",
      },
    });

    childProcess.stdout?.on("data", (data) => {
      process.stdout.write(data.toString());
    });

    childProcess.stderr?.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    childProcess.on("error", reject);

    childProcess.on("exit", async (code) => {
      const durationMs = Date.now() - startTime;

      const summary: PerformanceTestSummary = {
        timestamp: new Date().toISOString(),
        duration: durationMs,
        categories: {
          load: { total: 0, passed: 0, failed: 0 },
          memory: { total: 0, passed: 0, failed: 0 },
          latency: { total: 0, passed: 0, failed: 0 },
          throughput: { total: 0, passed: 0, failed: 0 },
          baseline: { total: 0, passed: 0, failed: 0 },
        },
        overall: {
          total: 0,
          passed: 0,
          failed: 0,
          success: code === 0,
        },
      };

      await writeFile(join(RESULTS_DIR, "summary.json"), JSON.stringify(summary, null, 2));

      console.log(`\n\nPerformance tests completed in ${(durationMs / 1000).toFixed(2)}s`);
      console.log(`Results saved to: ${RESULTS_DIR}`);

      if (code === 0) {
        console.log("All performance tests passed!");
        resolve();
      } else {
        console.log(`Performance tests failed with exit code ${code}`);
        process.exit(code ?? 1);
      }
    });
  });
}

runPerformanceTests().catch((error) => {
  console.error("Error running performance tests:", error);
  process.exit(1);
});
