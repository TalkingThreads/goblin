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

    // Note: We don't have access to TransportPool here directly in MetaToolContext (yet).
    // We only have Registry, Config, Router.
    // However, Router has TransportPool.
    // But Router is not exposed in context until we updated it?
    // We updated Router to pass `this` to context.
    // But MetaToolContext definition in `src/tools/meta/types.ts` might need update to include TransportPool access via Router?
    // Router has `transportPool` as private property.
    // We can't access it.

    // Alternative: Registry could track connection status?
    // Or we assume if it's in Registry, it was connected at some point.

    // For MVP-6: We really want the live status from TransportPool.
    // Let's rely on Registry's view or just Config + inference.
    // Or... we updated `Router` to be passed in context.
    // If we make `transportPool` public in Router, we can access it.

    const configuredServers = config.servers;
    const connectedTools = registry.listTools();

    const serverStatus = configuredServers.map((s) => {
      const hasTools = connectedTools.some((t) => t.serverId === s.name);
      return {
        id: s.name,
        status: hasTools ? "connected" : s.enabled ? "connecting/empty" : "disabled",
        mode: s.mode,
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
