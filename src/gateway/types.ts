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
