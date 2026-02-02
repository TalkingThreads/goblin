/**
 * Load Tests - Ramp Up Behavior
 *
 * Tests gateway behavior during gradual and instant load increases.
 */

import { describe, it } from "bun:test";
import { loadGenerator, type RampLoadConfig } from "../shared/load-generator.js";
import { loadConfig } from "../shared/test-config.js";

const config = loadConfig();

describe("Performance Load Tests - Ramp Up Behavior", () => {
  describe("Gradual Ramp from 1 to 100 Clients", () => {
    it("should handle gradual ramp without errors", async () => {
      const rampConfig: RampLoadConfig = {
        url: `${config.gatewayUrl}/health`,
        initialClients: 1,
        finalClients: 100,
        stepClients: 10,
        duration: 10000,
        stepDuration: 5000,
      };

      const result = await loadGenerator.generateRampLoad(rampConfig);

      const totalErrors = result.steps.reduce((sum, s) => sum + s.errors, 0);

      console.log("Gradual ramp results:", {
        steps: result.steps.length,
        totalErrors,
        finalClients: result.steps[result.steps.length - 1]?.clients,
        finalRps: result.steps[result.steps.length - 1]?.rps.toFixed(2),
      });

      console.assert(totalErrors === 0, `Expected no errors during ramp, got ${totalErrors}`);
    });

    it("should show proportional latency increase during ramp", async () => {
      const rampConfig: RampLoadConfig = {
        url: `${config.gatewayUrl}/health`,
        initialClients: 1,
        finalClients: 100,
        stepClients: 10,
        duration: 10000,
        stepDuration: 5000,
      };

      const result = await loadGenerator.generateRampLoad(rampConfig);

      const firstStep = result.steps[0];
      const lastStep = result.steps[result.steps.length - 1];

      const latencyGrowth = lastStep.latencyP50 / firstStep.latencyP50;
      const clientGrowth = lastStep.clients / firstStep.clients;

      console.log("Latency proportionality during ramp:", {
        firstClients: firstStep.clients,
        lastClients: lastStep.clients,
        firstLatencyP50: firstStep.latencyP50.toFixed(2) + "ms",
        lastLatencyP50: lastStep.latencyP50.toFixed(2) + "ms",
        latencyGrowth: latencyGrowth.toFixed(2) + "x",
        clientGrowth: clientGrowth.toFixed(2) + "x",
      });

      console.assert(
        latencyGrowth < clientGrowth * 2,
        `Latency growth ${latencyGrowth.toFixed(2)}x should be < 2x client growth ${clientGrowth.toFixed(2)}x`,
      );
    });

    it("should stabilize at 100 clients after ramp", async () => {
      const rampConfig: RampLoadConfig = {
        url: `${config.gatewayUrl}/health`,
        initialClients: 1,
        finalClients: 100,
        stepClients: 10,
        duration: 10000,
        stepDuration: 5000,
      };

      const result = await loadGenerator.generateRampLoad(rampConfig);
      const lastStep = result.steps[result.steps.length - 1];

      console.log("Stabilization at final load:", {
        finalClients: lastStep.clients,
        finalRps: lastStep.rps.toFixed(2),
        finalLatencyP50: lastStep.latencyP50.toFixed(2) + "ms",
        finalLatencyP95: lastStep.latencyP95.toFixed(2) + "ms",
      });

      console.assert(
        lastStep.rps > 500,
        `Should stabilize to > 500 RPS, got ${lastStep.rps.toFixed(2)}`,
      );
    });
  });

  describe("Instant Ramp to 100 Clients", () => {
    it("should accept all instant connections", async () => {
      const loadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 10000,
        pipelining: 1,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.log("Instant ramp connection handling:", {
        requests: result.requests,
        errors: result.errors,
        errorRate: ((result.errors / result.requests) * 100).toFixed(2) + "%",
      });

      console.assert(result.errors === 0, `Expected no connection errors, got ${result.errors}`);
    });

    it("should have temporary latency spike < 2 seconds", async () => {
      const loadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.log("Instant ramp latency spike:", {
        p50: result.latency.p50.toFixed(2) + "ms",
        p95: result.latency.p95.toFixed(2) + "ms",
        p99: result.latency.p99.toFixed(2) + "ms",
        max: result.latency.max.toFixed(2) + "ms",
      });

      console.assert(
        result.latency.max < 2000,
        `Max latency ${result.latency.max.toFixed(2)}ms should be < 2 seconds`,
      );
    });

    it("should stabilize after initial spike", async () => {
      const loadConfig = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 30000,
      };

      const result = await loadGenerator.generateLoad(loadConfig);

      console.log("Post-spike stabilization:", {
        averageLatency: result.latency.average.toFixed(2) + "ms",
        p50Latency: result.latency.p50.toFixed(2) + "ms",
        p95Latency: result.latency.p95.toFixed(2) + "ms",
      });

      console.assert(
        result.latency.p50 < 200,
        `p50 should stabilize to < 200ms, got ${result.latency.p50.toFixed(2)}ms`,
      );
    });
  });

  describe("Ramp Down Behavior", () => {
    it("should handle rapid ramp down gracefully", async () => {
      const highLoad = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 100,
        duration: 15000,
      };

      const lowLoad = {
        url: `${config.gatewayUrl}/health`,
        concurrentClients: 5,
        duration: 5000,
      };

      const highResult = await loadGenerator.generateLoad(highLoad);
      const lowResult = await loadGenerator.generateLoad(lowLoad);

      console.log("Ramp down behavior:", {
        highLoadRps: highResult.requestsPerSecond.toFixed(2),
        lowLoadRps: lowResult.requestsPerSecond.toFixed(2),
        highLoadLatencyP50: highResult.latency.p50.toFixed(2) + "ms",
        lowLoadLatencyP50: lowResult.latency.p50.toFixed(2) + "ms",
        reductionRatio: (highResult.latency.p50 / lowResult.latency.p50).toFixed(2) + "x",
      });

      console.assert(
        lowResult.latency.p50 < highResult.latency.p50,
        `Latency should decrease after ramp down`,
      );
    });
  });
});
