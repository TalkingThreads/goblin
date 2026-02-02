/**
 * Error Injector for E2E Testing
 *
 * Injects errors for testing error handling and recovery scenarios.
 */

export interface ErrorRule {
  name: string;
  condition: () => boolean;
  error: Error;
  probability: number;
  once?: boolean;
}

export interface ErrorInjectorConfig {
  maxErrors: number;
  enabled: boolean;
}

/**
 * Injects errors based on configurable rules
 */
export class ErrorInjector {
  private rules: ErrorRule[] = [];
  private errorCount: number = 0;
  private triggeredRules: Set<string> = new Set();

  constructor(private config: ErrorInjectorConfig = { maxErrors: 100, enabled: true }) {}

  /**
   * Add an error injection rule
   */
  addRule(rule: ErrorRule): void {
    this.rules.push(rule);
  }

  /**
   * Inject error if condition matches
   */
  async inject<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enabled || this.errorCount >= this.config.maxErrors) {
      return operation();
    }

    for (const rule of this.rules) {
      if (this.shouldTrigger(rule)) {
        this.errorCount++;
        this.triggeredRules.add(rule.name);

        if (rule.once) {
          this.rules = this.rules.filter((r) => r.name !== rule.name);
        }

        throw rule.error;
      }
    }

    return operation();
  }

  /**
   * Check if rule should trigger
   */
  private shouldTrigger(rule: ErrorRule): boolean {
    if (this.triggeredRules.has(rule.name) && rule.once) {
      return false;
    }
    if (Math.random() > rule.probability) {
      return false;
    }
    return rule.condition();
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Reset error injector
   */
  reset(): void {
    this.errorCount = 0;
    this.triggeredRules.clear();
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Get triggered rule names
   */
  getTriggeredRules(): string[] {
    return Array.from(this.triggeredRules);
  }
}

/**
 * Common error scenarios for testing
 */
export const ErrorScenarios = {
  /**
   * Simulate a tool not found error
   */
  toolNotFound: (toolName: string): ErrorRule => ({
    name: `tool-not-found-${toolName}`,
    condition: () => true,
    error: new Error(`Tool not found: ${toolName}`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a timeout error
   */
  timeout: (operation: string, ms: number = 5000): ErrorRule => ({
    name: `timeout-${operation}`,
    condition: () => true,
    error: new Error(`${operation} timed out after ${ms}ms`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a connection error
   */
  connectionLost: (server: string): ErrorRule => ({
    name: `connection-lost-${server}`,
    condition: () => true,
    error: new Error(`Connection to ${server} lost`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a validation error
   */
  validationError: (field: string, reason: string): ErrorRule => ({
    name: `validation-error-${field}`,
    condition: () => true,
    error: new Error(`Validation failed for ${field}: ${reason}`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a permission denied error
   */
  permissionDenied: (resource: string): ErrorRule => ({
    name: `permission-denied-${resource}`,
    condition: () => true,
    error: new Error(`Permission denied for ${resource}`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a rate limit error
   */
  rateLimited: (endpoint: string): ErrorRule => ({
    name: `rate-limited-${endpoint}`,
    condition: () => true,
    error: new Error(`Rate limit exceeded for ${endpoint}`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate a server error
   */
  serverError: (code: number, message: string): ErrorRule => ({
    name: `server-error-${code}`,
    condition: () => true,
    error: new Error(`Server error ${code}: ${message}`),
    probability: 1,
    once: true,
  }),

  /**
   * Simulate malformed data error
   */
  malformedData: (format: string): ErrorRule => ({
    name: `malformed-data-${format}`,
    condition: () => true,
    error: new Error(`Malformed ${format} data received`),
    probability: 1,
    once: true,
  }),
};
