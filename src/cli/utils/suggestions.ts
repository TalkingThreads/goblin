/**
 * CLI Command Suggestions
 *
 * Provides helpful suggestions for misspelled commands using Levenshtein distance.
 */

export const SUGGESTION_THRESHOLD = 3;
export const MAX_SUGGESTIONS = 3;

export interface Suggestion {
  command: string;
  distance: number;
  confidence: "high" | "medium" | "low";
}

export const KNOWN_COMMANDS = [
  "start",
  "stdio",
  "status",
  "health",
  "stop",
  "tools",
  "servers",
  "config",
  "logs",
  "version",
  "help",
  "servers add",
  "servers remove",
  "servers enable",
  "servers disable",
  "tools list",
  "tools invoke",
  "tools describe",
  "config validate",
  "config show",
  "config reload",
  "resources",
  "prompts",
  "slashes",
  "slashes list",
  "slashes show",
  "slashes exec",
] as const;

export type KnownCommand = (typeof KNOWN_COMMANDS)[number];

/**
 * Calculate the Levenshtein distance between two strings
 *
 * @param a - First string
 * @param b - Second string
 * @returns The minimum number of single-character edits required
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLength = a.length;
  const bLength = b.length;

  if (aLength === 0) {
    return bLength;
  }

  if (bLength === 0) {
    return aLength;
  }

  const matrix: number[][] = Array.from({ length: bLength + 1 }, (_, i) => [i]);

  for (let j = 0; j <= aLength; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= bLength; i++) {
    for (let j = 1; j <= aLength; j++) {
      const charB = b.charAt(i - 1);
      const charA = a.charAt(j - 1);
      if (charB === charA) {
        matrix[i]![j] = matrix[i - 1]?.[j - 1]!;
      } else {
        const substitution = matrix[i - 1]?.[j - 1]! + 1;
        const insertion = matrix[i]?.[j - 1]! + 1;
        const deletion = matrix[i - 1]?.[j]! + 1;
        matrix[i]![j] = Math.min(substitution, insertion, deletion);
      }
    }
  }

  return matrix[bLength]?.[aLength]!;
}

/**
 * Get command suggestions for a given input
 *
 * @param input - The misspelled command
 * @returns Array of suggestions sorted by distance
 */
export function getCommandSuggestions(input: string): Suggestion[] {
  const normalizedInput = input.toLowerCase();

  if (normalizedInput.length === 0) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  for (const command of KNOWN_COMMANDS) {
    const normalizedCommand = command.toLowerCase();
    const distance = levenshteinDistance(normalizedInput, normalizedCommand);

    if (distance > 0 && distance <= SUGGESTION_THRESHOLD) {
      let confidence: "high" | "medium" | "low";

      if (distance <= 1) {
        confidence = "high";
      } else if (distance <= 2) {
        confidence = "medium";
      } else {
        confidence = "low";
      }

      suggestions.push({
        command,
        distance,
        confidence,
      });
    }
  }

  suggestions.sort((a, b) => a.distance - b.distance);

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

/**
 * Format the suggestion message for display
 *
 * @param _input - The original input that wasn't recognized (unused, for future use)
 * @param suggestions - Array of suggestions
 * @returns Formatted message string
 */
export function formatSuggestionMessage(_input: string, suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return "";
  }

  const firstSuggestion = suggestions[0]!;
  if (suggestions.length === 1) {
    return `\nDid you mean 'goblin ${firstSuggestion.command}'?`;
  }

  let message = "\nDid you mean one of these?\n";

  for (const suggestion of suggestions) {
    message += `  - goblin ${suggestion.command}\n`;
  }

  return message;
}

/**
 * Handle unknown command error with suggestions
 *
 * @param unknownCommand - The command that wasn't recognized
 */
export function handleUnknownCommand(unknownCommand: string): void {
  const suggestions = getCommandSuggestions(unknownCommand);

  console.error(`error: unknown command '${unknownCommand}'`);

  if (suggestions.length > 0) {
    const message = formatSuggestionMessage(unknownCommand, suggestions);
    console.error(message);
  }

  console.error("\nRun 'goblin --help' to see available commands.");
}
