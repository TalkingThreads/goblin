/**
 * Slash Command Router
 * Handles slash command execution with conflict resolution
 */

import type { Registry } from "../gateway/registry.js";
import type { Router } from "../gateway/router.js";

export interface SlashCommandRequest {
  arguments?: Record<string, string>;
}

export interface SlashCommandResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
}

export interface SlashCommandInfo {
  id: string;
  name: string;
  serverId: string;
  description: string;
  arguments: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
}

export interface SlashConflictInfo {
  command: string;
  servers: string[];
  suggestions: string[];
}

export class SlashCommandRouter {
  constructor(
    private registry: Registry,
    private router: Router,
  ) {}

  async executeCommand(
    command: string,
    serverId?: string,
    args?: Record<string, string>,
  ): Promise<SlashCommandResponse> {
    const resolved = this.resolveCommand(command, serverId);
    const conflicts = this.detectConflicts(command);

    if (!resolved) {
      if (serverId) {
        throw new SlashCommandNotFoundError(command, serverId);
      }
      throw new SlashCommandConflictError(command, conflicts);
    }

    if (!serverId && conflicts) {
      throw new SlashCommandConflictError(command, conflicts);
    }

    try {
      const result = await this.router.getPrompt(resolved.name, args || {});
      const content = result["content"];
      return {
        content: content as SlashCommandResponse["content"],
      };
    } catch (error) {
      throw new SlashCommandExecutionError(command, error);
    }
  }

  resolveCommand(command: string, serverId?: string): { name: string; serverId: string } | null {
    const allPrompts = this.registry.getAllPrompts();

    if (serverId) {
      const prefixedId = `${serverId}_${command}`;
      const prompt = allPrompts.find((p) => p.id === prefixedId);
      if (prompt) {
        return { name: prompt.def.name, serverId };
      }
      return null;
    }

    const prompt = allPrompts.find((p) => p.def.name === command);
    if (prompt) {
      return { name: prompt.def.name, serverId: prompt.serverId };
    }

    return null;
  }

  detectConflicts(command: string): SlashConflictInfo | null {
    const allPrompts = this.registry.getAllPrompts();
    const matching = allPrompts.filter(
      (p) => p.def.name === command || p.id === `${p.serverId}_${command}`,
    );

    if (matching.length <= 1) {
      return null;
    }

    const servers = matching.map((p) => p.serverId);
    const suggestions = matching.map((p) => `/${p.serverId}_${command}`);

    return {
      command,
      servers,
      suggestions,
    };
  }

  listCommands(): SlashCommandInfo[] {
    const prompts = this.registry.getAllPrompts();
    return prompts.map((p) => ({
      id: p.id,
      name: p.def.name,
      serverId: p.serverId,
      description: p.def.description || "",
      arguments: (p.def.arguments || []).map((arg) => ({
        name: arg.name,
        required: arg.required || false,
        description: arg.description || "",
      })),
    }));
  }

  listConflicts(): SlashConflictInfo[] {
    const prompts = this.registry.getAllPrompts();
    const nameGroups = new Map<string, typeof prompts>();

    for (const prompt of prompts) {
      const group = nameGroups.get(prompt.def.name) || [];
      group.push(prompt);
      nameGroups.set(prompt.def.name, group);
    }

    const conflicts: SlashConflictInfo[] = [];

    for (const [, group] of nameGroups) {
      if (group.length > 1) {
        const first = group[0];
        if (first) {
          conflicts.push({
            command: first.def.name,
            servers: group.map((p) => p.serverId),
            suggestions: group.map((p) => `/${p.serverId}_${first.def.name}`),
          });
        }
      }
    }

    return conflicts;
  }
}

export class SlashCommandNotFoundError extends Error {
  constructor(command: string, serverId?: string) {
    const message = serverId
      ? `Slash command /${command} not found on server ${serverId}`
      : `Slash command /${command} not found`;
    super(message);
    this.name = "SlashCommandNotFoundError";
  }
}

export class SlashCommandConflictError extends Error {
  constructor(command: string, conflict: SlashConflictInfo | null) {
    const servers = conflict?.servers.join(", ") || "unknown";
    const suggestions = conflict?.suggestions.join(", ") || "";
    super(`Slash command /${command} is ambiguous (available on: ${servers}). Use: ${suggestions}`);
    this.name = "SlashCommandConflictError";
    this.conflict = conflict || undefined;
  }

  conflict?: SlashConflictInfo;
}

export class SlashCommandExecutionError extends Error {
  constructor(command: string, cause: unknown) {
    super(`Failed to execute slash command /${command}: ${cause}`);
    this.name = "SlashCommandExecutionError";
    this.cause = cause;
  }

  cause: unknown;
}
