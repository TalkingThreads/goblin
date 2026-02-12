/**
 * CLI types and interfaces
 */

/**
 * Global CLI context containing parsed global flags
 */
export interface CliContext {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;
  /**
   * Output in JSON format
   */
  json?: boolean;
  /**
   * Custom config file path
   */
  configPath?: string;
}
