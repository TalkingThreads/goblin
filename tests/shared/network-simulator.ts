/**
 * Network Simulator
 *
 * Simulates network conditions for testing retry logic,
 * circuit breaking, and other resilience patterns.
 */

export interface NetworkSimulatorConfig {
  latency?: number;
  latencyVariance?: number;
  errorRate?: number;
  errorCodes?: number[];
  bandwidth?: number; // bytes per second
  dropRate?: number;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export class NetworkSimulator {
  private config: Required<NetworkSimulatorConfig>;
  private requestCount = 0;
  private errorCount = 0;
  private totalLatency = 0;
  private droppedCount = 0;

  constructor(config: NetworkSimulatorConfig = {}) {
    this.config = {
      latency: config.latency || 0,
      latencyVariance: config.latencyVariance || 0,
      errorRate: config.errorRate || 0,
      errorCodes: config.errorCodes || [500, 502, 503, 504],
      bandwidth: config.bandwidth || 0,
      dropRate: config.dropRate || 0,
    };
  }

  /**
   * Set fixed latency for all operations
   */
  setLatency(ms: number): void {
    this.config.latency = ms;
    this.config.latencyVariance = 0;
  }

  /**
   * Set latency with variance
   */
  setLatencyWithVariance(baseMs: number, varianceMs: number): void {
    this.config.latency = baseMs;
    this.config.latencyVariance = varianceMs;
  }

  /**
   * Set error rate (0-1)
   */
  setErrorRate(rate: number): void {
    this.config.errorRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set error codes to throw
   */
  setErrorCodes(codes: number[]): void {
    this.config.errorCodes = codes;
  }

  /**
   * Set bandwidth limit (0 = unlimited)
   */
  setBandwidth(bytesPerSecond: number): void {
    this.config.bandwidth = bytesPerSecond;
  }

  /**
   * Set packet drop rate (0-1)
   */
  setDropRate(rate: number): void {
    this.config.dropRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    if (this.config.latencyVariance > 0) {
      const min = this.config.latency - this.config.latencyVariance;
      const max = this.config.latency + this.config.latencyVariance;
      return Math.max(0, min + Math.random() * (max - min));
    }
    return this.config.latency;
  }

  /**
   * Get current error rate
   */
  getErrorRate(): number {
    return this.config.errorRate;
  }

  /**
   * Check if request should be dropped
   */
  shouldDrop(): boolean {
    return Math.random() < this.config.dropRate;
  }

  /**
   * Get a random error
   */
  private getRandomError(): NetworkError {
    const statusCode =
      this.config.errorCodes[Math.floor(Math.random() * this.config.errorCodes.length)];
    const messages: Record<number, string> = {
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
    };

    return new NetworkError(messages[statusCode] || "Network Error", "NETWORK_ERROR", statusCode);
  }

  /**
   * Execute an operation with simulated network conditions
   */
  async wrap<T>(operation: () => Promise<T>): Promise<T> {
    this.requestCount++;

    // Check if request should be dropped
    if (this.shouldDrop()) {
      this.droppedCount++;
      throw new NetworkError("Connection dropped", "CONNECTION_DROPPED");
    }

    // Check if request should error
    if (this.config.errorRate > 0 && Math.random() < this.config.errorRate) {
      this.errorCount++;
      throw this.getRandomError();
    }

    // Simulate latency
    const latency = this.getLatency();
    if (latency > 0) {
      await this.delay(latency);
      this.totalLatency += latency;
    }

    // Execute the operation
    return operation();
  }

  /**
   * Execute with retry logic
   */
  async wrapWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      backoffMs?: number;
      backoffMultiplier?: number;
      maxBackoffMs?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {},
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const backoffMs = options.backoffMs || 100;
    const backoffMultiplier = options.backoffMultiplier || 2;
    const maxBackoffMs = options.maxBackoffMs || 5000;

    let lastError: Error | null = null;
    let currentBackoff = backoffMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.wrap(operation);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          if (options.onRetry) {
            options.onRetry(attempt + 1, lastError);
          }

          // Wait before retrying
          await this.delay(currentBackoff);

          // Increase backoff for next attempt
          currentBackoff = Math.min(currentBackoff * backoffMultiplier, maxBackoffMs);
        }
      }
    }

    throw lastError;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRequests: number;
    errors: number;
    dropped: number;
    averageLatency: number;
    errorRate: number;
  } {
    return {
      totalRequests: this.requestCount,
      errors: this.errorCount,
      dropped: this.droppedCount,
      averageLatency: this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalLatency = 0;
    this.droppedCount = 0;
  }

  /**
   * Reset everything to defaults
   */
  reset(): void {
    this.config = {
      latency: 0,
      latencyVariance: 0,
      errorRate: 0,
      errorCodes: [500, 502, 503, 504],
      bandwidth: 0,
      dropRate: 0,
    };
    this.resetStats();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a network simulator with specific configuration
 */
export function createNetworkSimulator(config: NetworkSimulatorConfig = {}): NetworkSimulator {
  return new NetworkSimulator(config);
}

/**
 * Create a slow network simulator
 */
export function createSlowNetwork(latencyMs: number = 500): NetworkSimulator {
  return new NetworkSimulator({ latency: latencyMs });
}

/**
 * Create a flaky network simulator
 */
export function createFlakyNetwork(errorRate: number = 0.1): NetworkSimulator {
  return new NetworkSimulator({ errorRate });
}

/**
 * Create a very unreliable network simulator
 */
export function createUnreliableNetwork(): NetworkSimulator {
  return new NetworkSimulator({
    latency: 100,
    latencyVariance: 50,
    errorRate: 0.2,
    dropRate: 0.05,
  });
}
