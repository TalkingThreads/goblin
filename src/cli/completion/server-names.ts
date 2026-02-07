import type { CompletionOptions, CompletionResult } from "./fetcher.js";
import { fetchServerNames } from "./fetcher.js";

/**
 * Complete server names for CLI
 * Usage in shell scripts: goblin complete servers <partial>
 */
export async function completeServerNames(
  partial: string,
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  const result = await fetchServerNames(options);

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
 * Print server names for shell completion
 * Usage: eval "$(goblin complete servers)"
 */
export async function printServerNames(options: CompletionOptions = {}): Promise<void> {
  const result = await fetchServerNames(options);

  for (const name of result.items) {
    console.log(name);
  }

  if (result.source === "none" && result.error) {
    console.error(`# ${result.error}`);
  }
}
