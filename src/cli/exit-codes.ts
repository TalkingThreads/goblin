/**
 * CLI Exit Codes
 *
 * Standardized exit codes for CLI error handling following Unix conventions.
 */

/**
 * Standard exit codes for CLI commands
 */
export enum ExitCode {
  /** Success */
  SUCCESS = 0,
  /** General error */
  GENERAL_ERROR = 1,
  /** Invalid arguments */
  INVALID_ARGUMENTS = 2,
  /** Configuration error */
  CONFIG_ERROR = 3,
  /** Connection error */
  CONNECTION_ERROR = 4,
  /** Permission denied */
  PERMISSION_DENIED = 5,
  /** Operation timeout */
  TIMEOUT = 6,
  /** Resource not found */
  NOT_FOUND = 7,
  /** Validation error */
  VALIDATION_ERROR = 8,
}

/**
 * Exit the process with a specific exit code and optional error message
 *
 * @param code - The exit code to use
 * @param message - Optional error message to print to stderr
 * @returns never - This function never returns (process exits)
 */
export function exitWithCode(code: ExitCode, message?: string): never {
  if (message) {
    console.error(message);
  }
  process.exit(code);
}

/**
 * Get a human-readable description for an exit code
 *
 * @param code - The exit code
 * @returns Description of the exit code
 */
export function getExitCodeDescription(code: ExitCode): string {
  const descriptions: Record<ExitCode, string> = {
    [ExitCode.SUCCESS]: "Success",
    [ExitCode.GENERAL_ERROR]: "General error",
    [ExitCode.INVALID_ARGUMENTS]: "Invalid arguments",
    [ExitCode.CONFIG_ERROR]: "Configuration error",
    [ExitCode.CONNECTION_ERROR]: "Connection error",
    [ExitCode.PERMISSION_DENIED]: "Permission denied",
    [ExitCode.TIMEOUT]: "Operation timeout",
    [ExitCode.NOT_FOUND]: "Resource not found",
    [ExitCode.VALIDATION_ERROR]: "Validation error",
  };

  return descriptions[code] ?? "Unknown error";
}
