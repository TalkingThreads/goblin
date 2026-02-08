/**
 * Memory Tests - Stability
 *
 * Tests memory stability during extended operations.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type MemoryConfig, memoryMonitor } from "../shared/memory-monitor.js";
import { isFastMode, loadConfig } from "../shared/test-config.js";
import { checkServerHealth, startTestServer, stopTestServer } from "../shared/test-server.js";

const config = loadConfig();
let serverAvailable = false;

describe("Performance Memory Tests - Stability", () => {
  beforeAll(async () => {
    const health = await checkServerHealth(config.gatewayUrl);
    if (!health.healthy) {
      try {
        await startTestServer({ gatewayUrl: config.gatewayUrl });
        serverAvailable = true;
      } catch {
        console.log("Skipping memory tests - server not available");
      }
    } else {
      serverAvailable = true;
    }
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe("1 Hour Memory Stability @quick", () => {
    it.skipIf(!serverAvailable)(
      "should show no memory growth over 5 minutes",
      async () => {
        const duration = isFastMode() ? 10000 : 300000; // 10s in fast mode, 5min otherwise
        const samples = isFastMode() ? 5 : 10;
        const interval = isFastMode() ? 2000 : 30000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 2,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("1 hour memory stability @quick:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          10,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 10%`,
        );
      },
      isFastMode() ? 30000 : 600000,
    );
  });

  describe("1 Hour Memory Stability @full", () => {
    it.skipIf(!serverAvailable)(
      "should show no memory growth over 30 minutes",
      async () => {
        const duration = 1800000; // 30 minutes
        const samples = 60;
        const interval = 30000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 3,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("1 hour memory stability @full:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          10,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 10%`,
        );
      },
      2000000,
    );
  });

  describe("1 Hour Memory Stability @extended", () => {
    it.skipIf(!serverAvailable)(
      "should show no memory growth over 1 hour",
      async () => {
        const duration = 3600000; // 1 hour
        const samples = 120;
        const interval = 30000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 3,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("1 hour memory stability @extended:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          10,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 10%`,
        );
      },
      4000000,
    );
  });

  describe("8 Hour Memory Stability @quick", () => {
    it.skipIf(!serverAvailable)(
      "should remain stable over 10 minutes",
      async () => {
        const duration = isFastMode() ? 10000 : 600000; // 10s in fast mode, 10min otherwise
        const samples = isFastMode() ? 5 : 20;
        const interval = isFastMode() ? 2000 : 30000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 2,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("8 hour memory stability @quick:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          20,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 20%`,
        );
      },
      isFastMode() ? 30000 : 700000,
    );
  });

  describe("8 Hour Memory Stability @full", () => {
    it.skipIf(!serverAvailable)(
      "should remain stable over 1 hour",
      async () => {
        const duration = 3600000; // 1 hour
        const samples = 120;
        const interval = 30000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 5,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("8 hour memory stability @full:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          20,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 20%`,
        );
      },
      4000000,
    );
  });

  describe("8 Hour Memory Stability @extended", () => {
    it.skipIf(!serverAvailable)(
      "should remain stable over 8 hours",
      async () => {
        const duration = 28800000; // 8 hours
        const samples = 480;
        const interval = 60000;

        const memConfig: MemoryConfig = {
          intervalMs: interval,
          sampleCount: samples,
          warmupSamples: 5,
        };

        const result = await memoryMonitor.monitor(duration, memConfig);

        console.log("8 hour memory stability @extended:", {
          initialMb: (result.initialSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          peakMb: (result.peakSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          finalMb: (result.finalSnapshot.heapUsed / 1024 / 1024).toFixed(2),
          growthPercent: `${result.growthPercent.toFixed(2)}%`,
        });

        expect(result.growthPercent).toBeLessThan(
          20,
          `Memory growth ${result.growthPercent.toFixed(2)}% should be < 20%`,
        );
      },
      30000000,
    );
  });

  describe("Memory After Idle Period", () => {
    it.skipIf(!serverAvailable)("should not leak memory when idle", async () => {
      const beforeIdle = memoryMonitor.takeSnapshot();

      await new Promise((resolve) => setTimeout(resolve, isFastMode() ? 5000 : 30000));

      const afterIdle = memoryMonitor.takeSnapshot();
      const growth = ((afterIdle.heapUsed - beforeIdle.heapUsed) / beforeIdle.heapUsed) * 100;

      console.log("Memory after idle period:", {
        beforeMb: (beforeIdle.heapUsed / 1024 / 1024).toFixed(2),
        afterMb: (afterIdle.heapUsed / 1024 / 1024).toFixed(2),
        growth: `${growth.toFixed(2)}%`,
      });

      expect(growth).toBeLessThan(5, `Idle memory growth ${growth.toFixed(2)}% should be < 5%`);
    });
  });
});
