import { CircuitBreaker, CircuitOpenError } from "./circuit-breaker.js";

interface BreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
}

export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: BreakerConfig;

  constructor(defaultConfig?: Partial<BreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: defaultConfig?.failureThreshold ?? 5,
      successThreshold: defaultConfig?.successThreshold ?? 3,
      timeoutMs: defaultConfig?.timeoutMs ?? 30000,
    };
  }

  getBreaker(serverId: string): CircuitBreaker {
    let breaker = this.breakers.get(serverId);
    if (!breaker) {
      breaker = new CircuitBreaker({
        serverId,
        ...this.defaultConfig,
      });
      this.breakers.set(serverId, breaker);
    }
    return breaker;
  }

  async execute<T>(serverId: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(serverId);
    return breaker.execute(fn);
  }

  getAllStats(): Record<string, { state: string; failures: number; successes: number }> {
    const stats: Record<string, { state: string; failures: number; successes: number }> = {};
    for (const [serverId, breaker] of this.breakers) {
      stats[serverId] = breaker.getState();
    }
    return stats;
  }

  reset(serverId?: string): void {
    if (serverId) {
      this.breakers.delete(serverId);
    } else {
      this.breakers.clear();
    }
  }
}

export { CircuitOpenError };
