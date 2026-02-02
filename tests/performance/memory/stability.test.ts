/**
 * Memory Tests - Stability
 *
 * Tests memory stability during extended operations.
 */

import { after, before, describe, it } from "bun:test";
import { type MemoryConfig, memoryMonitor } from "../shared/memory-monitor.js";
import { loadConfig } from "../shared/test-config.js";

const config = loadConfig();

async function makeRequest(): Promise<void> {
  await fetch(`${config.gatewayUrl}/health`);
}

describe("Performance Memory Tests - Stability", () => {
  describe("1 Hour Memory Stability", () => {
    it("should show no memory growth over 1 hour", async () => {
      const memConfig: MemoryConfig = {
        intervalMs: 30000,
        sampleCount: 120,
        warmupSamples: 3,
      };

      const result = await memoryMonitor.monitor(3600000, memConfig);

      console.log("1 hour memory stability:", {
        initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        growthPercent: result.growthPercent.toFixed(2) + "%",
        growthRate: result.averageGrowthRate.toFixed(2) + " bytes/sec",
      });

      console.assert(
        result.growthPercent < 10,
        `Memory growth ${result.growthPercent.toFixed(2)}% should be < 10%`,
      );
    }, 370000);
  });

  describe("8 Hour Memory Stability", () => {
    it("should remain stable over 8 hours", async () => {
      const memConfig: MemoryConfig = {
        intervalMs: 60000,
        sampleCount: 480,
        warmupSamples: 5,
      };

      const result = await memoryMonitor.monitor(28800000, memConfig);

      console.log("8 hour memory stability:", {
        initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
        growthPercent: result.growthPercent.toFixed(2) + "%",
      });

      console.assert(
        result.growthPercent < 20,
        `Memory growth ${result.growthPercent.toFixed(2)}% should be < 20%`,
      );
    }, 300000);
  });

  describe("Memory After Idle Period", () => {
    it("should not leak memory when idle", async () => {
      const beforeIdle = memoryMonitor.takeSnapshot();

      await new Promise((resolve) => setTimeout(resolve, 30000));

      const afterIdle = memoryMonitor.takeSnapshot();
      const growth = ((afterIdle.heapUsed - beforeIdle.heapUsed) / beforeIdle.heapUsed) * 100;

      console.log("Memory after idle period:", {
        beforeMb: (beforeIdle.heapUsed / 1024 / 1024).toFixed(2),
        afterMb: (afterIdle.heapUsed / 1024 / 1024).toFixed(2),
        growth: growth.toFixed(2) + "%",
      });

      console.assert(growth < 5, `Idle memory growth ${growth.toFixed(2)}% should be < 5%`);
    });
  });
});
