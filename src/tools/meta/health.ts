import { z } from "zod";
import { defineMetaTool } from "./types.js";

/**
 * Get gateway and server health status
 */
export const health = defineMetaTool({
  name: "health",
  description: "Get gateway and server health status",
  parameters: z.object({}),
  execute: async (_args, { config, registry }) => {
    // We can get server list from config or registry
    // Registry tracks connected servers.
    // Ideally we'd ping them, but for MVP we report configured vs connected.

    const configuredServers = config.servers;
    const connectedTools = registry.listTools();

    // Derive server status from presence of tools (naive check)
    // A better way would be if Registry tracked connection status explicitly.
    // For now, we list configured servers.

    const serverStatus = configuredServers.map((s) => {
      const hasTools = connectedTools.some((t) => t.serverId === s.name);
      return {
        id: s.name,
        status: hasTools ? "connected" : s.enabled ? "connecting/empty" : "disabled",
        transport: s.transport,
      };
    });

    return {
      status: "ok",
      servers: serverStatus,
      gateway: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  },
});
