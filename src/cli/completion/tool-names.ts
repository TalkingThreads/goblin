import type { CompletionOptions, CompletionResult } from "./fetcher.js";
import { fetchToolNames } from "./fetcher.js";

/**
 * Complete tool names for CLI
 * Usage in shell scripts: goblin complete tools <partial>
 */
export async function completeToolNames(
  partial: string,
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  const result = await fetchToolNames(options);

  if (partial) {
    const filtered = result.items.filter((name) =>
      name.toLowerCase().startsWith(partial.toLowerCase()),
    );
    return {
      ...result,
      items: filtered,
    };
  }

  return result;
}

/**
 * Print tool names for shell completion
 * Usage: eval "$(goblin complete tools)"
 */
export async function printToolNames(options: CompletionOptions = {}): Promise<void> {
  const result = await fetchToolNames(options);

  for (const name of result.items) {
    console.log(name);
  }

  if (result.source === "none" && result.error) {
    console.error(`# ${result.error}`);
  }
}
