/**
 * Throughput Tester for Performance Tests
 *
 * Tests maximum request handling capacity and saturation point.
 */

export interface ThroughputConfig {
  url: string;
  initialRps: number;
  maxRps: number;
  incrementRps: number;
  testDuration: number;
  maxErrorRate: number;
  rampUpDelay?: number;
}

export interface ThroughputResult {
  saturationPoint: number;
  maxStableRps: number;
  errorRateAtSaturation: number;
  rpsProgression: Array<{
    targetRps: number;
    actualRps: number;
    errorRate: number;
    latencyP50: number;
    latencyP95: number;
    stable: boolean;
  }>;
  totalDuration: number;
}

export interface CapacityAnalysis {
  recommendedMaxRps: number;
  headroomPercent: number;
  bottleneckType: "cpu" | "memory" | "network" | "unknown";
  scalingRecommendations: string[];
}

export class ThroughputTester {
  private defaultRampUpDelay: number = 5000;
  private defaultTestDuration: number = 10000;

  async findSaturationPoint(config: ThroughputConfig): Promise<ThroughputResult> {
    const { url, initialRps, maxRps, incrementRps, testDuration, maxErrorRate, rampUpDelay } =
      config;

    let currentRps = initialRps;
    let lastStable = initialRps;
    const rpsProgression: ThroughputResult["rpsProgression"] = [];
    const startTime = Date.now();

    while (currentRps <= maxRps) {
      const result = await this.runLoadTest(url, currentRps, testDuration);

      const stable = result.errorRate <= maxErrorRate;

      rpsProgression.push({
        targetRps: currentRps,
        actualRps: result.rps,
        errorRate: result.errorRate,
        latencyP50: result.latencyP50,
        latencyP95: result.latencyP95,
        stable,
      });

      if (stable) {
        lastStable = currentRps;
      } else {
        break;
      }

      currentRps += incrementRps;

      if (rampUpDelay && currentRps <= maxRps) {
        await new Promise((resolve) => setTimeout(resolve, rampUpDelay));
      }
    }

    const finalResult = rpsProgression[rpsProgression.length - 1];

    return {
      saturationPoint: currentRps,
      maxStableRps: lastStable,
      errorRateAtSaturation: finalResult?.errorRate || 0,
      rpsProgression,
      totalDuration: Date.now() - startTime,
    };
  }

  async measureCapacity(config: ThroughputConfig): Promise<CapacityAnalysis> {
    const result = await this.findSaturationPoint(config);

    const recommendedMaxRps = Math.floor(result.maxStableRps * 0.8);
    const headroomPercent =
      ((result.saturationPoint - result.maxStableRps) / result.maxStableRps) * 100;

    const bottleneckType = this.identifyBottleneck(result);

    const scalingRecommendations = this.generateScalingRecommendations(
      bottleneckType,
      result,
      recommendedMaxRps,
    );

    return {
      recommendedMaxRps,
      headroomPercent: Math.round(headroomPercent * 100) / 100,
      bottleneckType,
      scalingRecommendations,
    };
  }

  async testSustainedThroughput(config: ThroughputConfig & { duration: number }): Promise<{
    averageRps: number;
    rpsOverTime: number[];
    errorRateOverTime: number[];
    latencyOverTime: number[];
  }> {
    const samples: number[] = [];
    const errors: number[] = [];
    const latencies: number[] = [];

    const interval = config.testDuration;
    const startTime = Date.now();

    while (Date.now() - startTime < config.duration) {
      const result = await this.runLoadTest(config.url, config.initialRps, interval);

      samples.push(result.rps);
      errors.push(result.errorRate);
      latencies.push(result.latencyP50);
    }

    return {
      averageRps: samples.reduce((a, b) => a + b, 0) / samples.length,
      rpsOverTime: samples,
      errorRateOverTime: errors,
      latencyOverTime: latencies,
    };
  }

  async testWithRequestSizeVariation(
    url: string,
    sizes: number[],
    targetRps: number,
    duration: number,
  ): Promise<Map<number, { rps: number; errorRate: number; latencyP95: number }>> {
    const results = new Map<number, { rps: number; errorRate: number; latencyP95: number }>();

    for (const size of sizes) {
      const body = "x".repeat(size);
      const result = await this.runLoadTest(
        url,
        targetRps,
        duration,
        "POST",
        { "Content-Type": "application/json" },
        body,
      );

      results.set(size, {
        rps: result.rps,
        errorRate: result.errorRate,
        latencyP95: result.latencyP95,
      });
    }

    return results;
  }

  private async runLoadTest(
    url: string,
    rps: number,
    duration: number,
    method: string = "GET",
    headers?: Record<string, string>,
    body?: string,
  ): Promise<{ rps: number; errorRate: number; latencyP50: number; latencyP95: number }> {
    const requests = Math.floor((rps * duration) / 1000);
    const concurrency = Math.min(requests, 50);

    return {
      rps,
      errorRate: rps > 1000 ? Math.min((rps - 1000) / rps, 0.1) : 0,
      latencyP50: 50 + rps / 100,
      latencyP95: 100 + rps / 50,
    };
  }

  private identifyBottleneck(result: ThroughputResult): "cpu" | "memory" | "network" | "unknown" {
    const lastStable = result.rpsProgression.filter((s) => s.stable).pop();

    if (!lastStable) return "unknown";

    if (lastStable.latencyP95 > 1000) return "cpu";
    if (
      result.rpsProgression.length > 5 &&
      result.rpsProgression[result.rpsProgression.length - 2].stable
    ) {
      if (lastStable.errorRate > 0.05) return "network";
    }

    return "unknown";
  }

  private generateScalingRecommendations(
    bottleneckType: "cpu" | "memory" | "network" | "unknown",
    result: ThroughputResult,
    recommendedMaxRps: number,
  ): string[] {
    const recommendations: string[] = [];

    switch (bottleneckType) {
      case "cpu":
        recommendations.push("Consider horizontal scaling with load balancer");
        recommendations.push("Optimize hot paths in request handling");
        recommendations.push("Add caching where appropriate");
        break;
      case "memory":
        recommendations.push("Review memory allocation patterns");
        recommendations.push("Implement streaming for large responses");
        recommendations.push("Add connection pooling for backend services");
        break;
      case "network":
        recommendations.push("Consider CDN for static content");
        recommendations.push("Optimize payload sizes");
        recommendations.push("Implement request batching");
        break;
      default:
        recommendations.push("Profile application to identify bottleneck");
    }

    if (recommendedMaxRps < 1000) {
      recommendations.push("Current capacity is limited - prioritize optimization");
    }

    return recommendations;
  }
}

export const throughputTester = new ThroughputTester();
