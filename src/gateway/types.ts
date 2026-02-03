/**
 * Registry types
 */

import type { Prompt, Resource, ResourceTemplate, Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Minimal tool metadata for listing
 */
export interface ToolCard {
  name: string;
  description?: string;
  serverId: string;
}

/**
 * Internal storage for a tool
 */
export interface ToolEntry {
  id: string; // namespaced
  def: Tool;
  serverId: string;
}

/**
 * Internal storage for a prompt
 */
export interface PromptEntry {
  id: string; // namespaced
  def: Prompt;
  serverId: string;
}

/**
 * Internal storage for a resource
 */
export interface ResourceEntry {
  // Resources don't have IDs like tools, they have URIs.
  // We store them by URI.
  // BUT multiple servers might expose same URI? Unlikely for "read", but for "templates" maybe.
  // We should map URI -> Server?
  // Or just store the list.

  // For `resources/list`, we return a list.
  // For `resources/read`, we need to route by URI.

  // We can store Resource definitions.
  def: Resource;
  serverId: string;
}

/**
 * Internal storage for a resource template
 */
export interface ResourceTemplateEntry {
  def: ResourceTemplate;
  serverId: string;
}

/**
 * Namespaced URI format: mcp://{serverId}/{originalUri}
 * This prevents collisions when multiple servers expose the same URI
 */
export const RESOURCE_URI_SCHEME = "mcp";

/**
 * Create a namespaced URI from server ID and original URI
 * @param serverId - The server ID
 * @param rawUri - The original URI (e.g., "file:///path/to/file.txt")
 * @returns Namespaced URI (e.g., "mcp://filesystem/file%3A%2F%2F%2Fpath%2Fto%2Ffile.txt")
 */
export function namespaceUri(serverId: string, rawUri: string): string {
  // URL-encode the original URI to handle special characters
  const encodedUri = encodeURIComponent(rawUri);
  return `${RESOURCE_URI_SCHEME}://${serverId}/${encodedUri}`;
}

/**
 * Parse a namespaced URI into server ID and original URI
 * @param namespacedUri - The namespaced URI
 * @returns Object with serverId and rawUri, or null if invalid format
 */
export function parseNamespacedUri(
  namespacedUri: string,
): { serverId: string; rawUri: string } | null {
  try {
    const pattern = `^${RESOURCE_URI_SCHEME}://([^/]+)/(.+)$`;
    const match = namespacedUri.match(new RegExp(pattern));
    if (!match || match.length < 3) {
      return null;
    }
    // biome-ignore lint/style/noNonNullAssertion: Length check above guarantees these exist
    const serverId = match[1]!;
    // biome-ignore lint/style/noNonNullAssertion: Length check above guarantees these exist
    const rawUri = decodeURIComponent(match[2]!);
    return { serverId, rawUri };
  } catch {
    return null;
  }
}

/**
 * Check if a URI is namespaced
 * @param uri - The URI to check
 * @returns true if the URI is namespaced
 */
export function isNamespacedUri(uri: string): boolean {
  return uri.startsWith(`${RESOURCE_URI_SCHEME}://`);
}

/**
 * Extract server ID from a namespaced URI
 * @param namespacedUri - The namespaced URI
 * @returns The server ID, or null if invalid format
 */
export function getServerIdFromUri(namespacedUri: string): string | null {
  const parsed = parseNamespacedUri(namespacedUri);
  return parsed?.serverId ?? null;
}
