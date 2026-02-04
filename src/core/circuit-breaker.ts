enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerConfig {
  serverId: string;
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly metrics: CircuitMetrics;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.metrics = { failures: 0, successes: 0 };
  }

  getState(): { state: string; failures: number; successes: number } {
    return {
      state: this.state,
      failures: this.metrics.failures,
      successes: this.metrics.successes,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.timeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        this.failureCount = 0;
      } else {
        throw new CircuitOpenError(`Circuit breaker for ${this.config.serverId} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.metrics.successes++;
    this.metrics.lastSuccess = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    }
  }

  private onFailure(): void {
    this.metrics.failures++;
    this.metrics.lastFailure = new Date();
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}
