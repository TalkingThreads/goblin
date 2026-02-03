/**
 * Smoke Test Configuration
 *
 * This file defines the configuration for the smoke test suite.
 */

export const smokeConfig = {
  /**
   * Test timeout settings
   */
  timeouts: {
    /** Individual test timeout in milliseconds (10s) */
    test: 10000,
    /** Total suite execution timeout in milliseconds (120s) */
    suite: 120000,
  },

  /**
   * Parallel execution settings
   */
  parallel: {
    /** Enable parallel execution */
    enabled: true,
    /** Number of worker threads (undefined uses Bun default) */
    workers: undefined as number | undefined,
  },

  /**
   * Retries configuration
   */
  retries: {
    /** Number of times to retry failed tests */
    attempts: 2,
  },

  /**
   * Reporting settings
   */
  reporting: {
    /** Main reporter for stdout */
    reporter: "verbose",
    /** Directory for test results/artifacts */
    outputDir: "test-results/smoke",
    /** JUnit XML output path relative to outputDir */
    junitFile: "junit.xml",
    /** JSON summary output path relative to outputDir */
    jsonFile: "summary.json",
  },
};

export type SmokeConfig = typeof smokeConfig;
