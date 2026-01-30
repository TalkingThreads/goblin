/**
 * Registry types
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

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
  /**
   * Internal unique ID (usually serverId_toolName)
   */
  id: string;

  /**
   * Original tool definition from backend
   */
  def: Tool;

  /**
   * ID of the server providing this tool
   */
  serverId: string;
}
