/**
 * HTTP Client Utilities for Smoke Tests
 *
 * HTTP testing utilities for health endpoints and API testing.
 */

import { type IncomingMessage, request } from "node:http";

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  json: <T = unknown>() => T;
  duration: number;
}

export interface HttpClient {
  get(path: string): Promise<HttpResponse>;
  post(path: string, body?: unknown): Promise<HttpResponse>;
  put(path: string, body?: unknown): Promise<HttpResponse>;
  delete(path: string): Promise<HttpResponse>;
}

/**
 * Create HTTP client for testing
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  const makeRequest = async (
    method: string,
    path: string,
    body?: unknown,
  ): Promise<HttpResponse> => {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`HTTP request timed out after ${config.timeout ?? 5000}ms`));
      }, config.timeout ?? 5000);

      const url = new URL(path, config.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...config.headers,
        },
      };

      const req = request(options, (res: IncomingMessage) => {
        const headers: Record<string, string> = {};
        res.on("data", (chunk) => {
          bodyBuffer.push(chunk);
        });

        res.on("end", () => {
          clearTimeout(timeout);
          const duration = Date.now() - start;
          const body = Buffer.concat(bodyBuffer).toString();

          const response: HttpResponse = {
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers,
            body,
            json: <T = unknown>() => JSON.parse(body) as T,
            duration,
          };

          resolve(response);
        });
      });

      req.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      const bodyBuffer: Buffer[] = [];

      if (body !== undefined) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  };

  return {
    get: (path: string) => makeRequest("GET", path),
    post: (path: string, body?: unknown) => makeRequest("POST", path, body),
    put: (path: string, body?: unknown) => makeRequest("PUT", path, body),
    delete: (path: string) => makeRequest("DELETE", path),
  };
}

/**
 * Wait for HTTP endpoint to be available
 */
export async function waitForEndpoint(
  client: HttpClient,
  path: string,
  maxAttempts: number = 20,
  interval: number = 500,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await client.get(path);
      if (response.status >= 200 && response.status < 400) {
        return true;
      }
    } catch {
      // Endpoint not ready yet
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

/**
 * Assert HTTP response status
 */
export function assertStatus(response: HttpResponse, expectedStatus: number): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}: ${response.body}`,
    );
  }
}

/**
 * Assert HTTP response is successful (2xx)
 */
export function assertSuccess(response: HttpResponse): void {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Expected successful status (2xx) but got ${response.status}: ${response.body}`,
    );
  }
}

/**
 * Assert HTTP response contains expected JSON property
 */
export function assertJsonProperty<T>(
  response: HttpResponse,
  propertyPath: string,
  expectedValue?: T,
): T {
  const json = response.json<T>();

  if (propertyPath.includes(".")) {
    const parts = propertyPath.split(".");
    let current: unknown = json;

    for (const part of parts) {
      if (current === null || current === undefined) {
        throw new Error(`Property path "${propertyPath}" not found in response`);
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (expectedValue !== undefined && current !== expectedValue) {
      throw new Error(
        `Expected property "${propertyPath}" to be ${expectedValue} but got ${current}`,
      );
    }

    return current as T;
  }

  const value = (json as Record<string, T>)[propertyPath];

  if (expectedValue !== undefined && value !== expectedValue) {
    throw new Error(`Expected property "${propertyPath}" to be ${expectedValue} but got ${value}`);
  }

  return value;
}

/**
 * Assert HTTP response body matches expected pattern
 */
export function assertBodyMatches(response: HttpResponse, pattern: RegExp): void {
  if (!pattern.test(response.body)) {
    throw new Error(`Expected body to match ${pattern} but got: ${response.body}`);
  }
}

/**
 * Assert HTTP response time is within limit
 */
export function assertResponseTime(response: HttpResponse, maxMs: number): void {
  if (response.duration > maxMs) {
    throw new Error(
      `Expected response time to be under ${maxMs}ms but took ${response.duration}ms`,
    );
  }
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version?: string;
  uptime?: number;
  checks?: Record<string, unknown>;
}

/**
 * Parse health check response
 */
export function parseHealthCheck(response: HttpResponse): HealthCheckResult {
  const json = response.json<HealthCheckResult>();

  return {
    status: json.status ?? "unhealthy",
    timestamp: json.timestamp ?? new Date().toISOString(),
    version: json.version,
    uptime: json.uptime,
    checks: json.checks,
  };
}

/**
 * Assert health check is healthy
 */
export function assertHealthy(result: HealthCheckResult): void {
  if (result.status !== "healthy") {
    throw new Error(`Expected healthy status but got ${result.status}`);
  }
}

/**
 * Readiness check result interface
 */
export interface ReadinessCheckResult {
  ready: boolean;
  backends: Array<{
    id: string;
    status: "connected" | "disconnected" | "error";
    tools?: number;
  }>;
}

/**
 * Parse readiness check response
 */
export function parseReadinessCheck(response: HttpResponse): ReadinessCheckResult {
  return response.json<ReadinessCheckResult>();
}

/**
 * Assert readiness check is ready
 */
export function assertReady(result: ReadinessCheckResult): void {
  if (!result.ready) {
    throw new Error(
      `Expected ready status but backends not ready: ${JSON.stringify(result.backends)}`,
    );
  }
}

/**
 * Metrics result interface
 */
export interface MetricsResult {
  format: "prometheus";
  content: string;
}

/**
 * Parse metrics response
 */
export function parseMetrics(response: HttpResponse): MetricsResult {
  return {
    format: "prometheus",
    content: response.body,
  };
}

/**
 * Assert metrics contain expected metric name
 */
export function assertMetricsContain(result: MetricsResult, metricName: string): void {
  if (!result.content.includes(metricName)) {
    throw new Error(`Expected metrics to contain "${metricName}" but got: ${result.content}`);
  }
}

/**
 * Assert metrics are in Prometheus format
 */
export function assertValidPrometheusFormat(result: MetricsResult): void {
  // Basic Prometheus format validation
  const lines = result.content.split("\n");
  let hasMetrics = false;

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith("#") || line.trim().length === 0) {
      continue;
    }

    // Metrics should have format: metric_name{labels} value
    if (line.includes("{")) {
      // Metric with labels
      if (!line.includes("} ")) {
        throw new Error(`Invalid Prometheus format (missing value after labels): ${line}`);
      }
    } else if (line.includes(" ")) {
      // Simple metric
      const parts = line.split(" ");
      if (parts.length !== 2 || Number.isNaN(parseFloat(parts[1]))) {
        throw new Error(`Invalid Prometheus format: ${line}`);
      }
    } else {
      throw new Error(`Invalid Prometheus format: ${line}`);
    }

    hasMetrics = true;
  }

  if (!hasMetrics) {
    throw new Error("No metrics found in response");
  }
}
