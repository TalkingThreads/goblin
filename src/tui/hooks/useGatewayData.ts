import { useCallback, useEffect, useRef, useState } from "react";
import type { GoblinGateway } from "../../core/gateway.js";
import type { PromptEntry, ResourceEntry, ToolCard } from "../../gateway/types.js";

/**
 * Server status information for TUI display
 */
export interface ServerStatus {
  id: string;
  name: string;
  transport: string;
  status: "online" | "offline";
  tools: number;
  enabled: boolean;
}

/**
 * Log entry for TUI display
 */
export interface LogEntry {
  timestamp: Date;
  message: string;
  level: "info" | "warn" | "error" | "debug";
}

/**
 * Gateway data state for TUI
 */
export interface GatewayData {
  servers: ServerStatus[];
  tools: ToolCard[];
  prompts: PromptEntry[];
  resources: ResourceEntry[];
  logs: LogEntry[];
  metrics: {
    connections: number;
    errors: number;
    totalRequests: number;
  };
}

/**
 * Hook to connect TUI to real gateway state
 * Provides reactive data updates from registry and transport pool
 */
export function useGatewayData(gateway: GoblinGateway | null): GatewayData {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [tools, setTools] = useState<ToolCard[]>([]);
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    connections: 0,
    errors: 0,
    totalRequests: 0,
  });

  const logsRef = useRef<LogEntry[]>([]);

  // Add log entry
  const addLog = useCallback((message: string, level: LogEntry["level"] = "info") => {
    const entry: LogEntry = {
      timestamp: new Date(),
      message,
      level,
    };
    logsRef.current = [...logsRef.current.slice(-50), entry]; // Keep last 50 logs
    setLogs(logsRef.current);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: addLog is memoized with useCallback
  useEffect(() => {
    if (!gateway) {
      addLog("Gateway not initialized", "warn");
      return;
    }

    addLog("Connected to Goblin Gateway", "info");

    // Initial data fetch
    const refreshData = () => {
      // Fetch servers from transport pool health
      const health = gateway.transportPool.getHealth();
      const serverStatuses: ServerStatus[] = health.map((h) => ({
        id: h.id,
        name: h.id,
        transport: "sse", // Could be enhanced to store transport type
        status: h.status === "connected" ? "online" : "offline",
        tools: 0, // Will be updated from registry
        enabled: true, // Default to enabled
      }));

      // Get tool count per server from registry
      const allTools = gateway.registry.listTools();
      for (const tool of allTools) {
        const serverStatus = serverStatuses.find((s) => s.name === tool.serverId);
        if (serverStatus) {
          serverStatus.tools++;
        }
      }

      // Add servers that might not be in transport pool yet
      const knownServerNames = new Set(serverStatuses.map((s) => s.name));
      for (const tool of allTools) {
        if (!knownServerNames.has(tool.serverId) && tool.serverId !== "goblin") {
          serverStatuses.push({
            id: tool.serverId,
            name: tool.serverId,
            transport: "unknown",
            status: "offline",
            tools: 1,
            enabled: true,
          });
          knownServerNames.add(tool.serverId);
        }
      }

      setServers(serverStatuses);
      setTools(allTools);
      setPrompts(gateway.registry.getAllPrompts());
      setResources(gateway.registry.getAllResources());

      addLog(
        `Updated: ${serverStatuses.length} servers, ${allTools.length} tools, ${gateway.registry.getAllPrompts().length} prompts, ${gateway.registry.getAllResources().length} resources`,
        "debug",
      );
    };

    // Initial fetch
    refreshData();

    // Subscribe to registry changes
    const handleChange = () => {
      addLog("Registry changed, refreshing data...", "debug");
      refreshData();
    };

    gateway.registry.on("change", handleChange);
    gateway.registry.on("tool-change", handleChange);
    gateway.registry.on("prompt-change", handleChange);
    gateway.registry.on("resource-change", handleChange);

    // Set up periodic refresh for metrics
    const metricsInterval = setInterval(() => {
      const health = gateway.transportPool.getHealth();
      const onlineCount = health.filter((h) => h.status === "connected").length;

      setMetrics({
        connections: onlineCount,
        errors: 0, // Could be fetched from metrics
        totalRequests: 0, // Could be fetched from metrics
      });
    }, 2000);

    return () => {
      gateway.registry.off("change", handleChange);
      gateway.registry.off("tool-change", handleChange);
      gateway.registry.off("prompt-change", handleChange);
      gateway.registry.off("resource-change", handleChange);
      clearInterval(metricsInterval);
    };
  }, [gateway]);

  return {
    servers,
    tools,
    prompts,
    resources,
    logs,
    metrics,
  };
}

/**
 * Hook to get filtered tools based on server and search
 */
export function useFilteredTools(
  tools: ToolCard[],
  filterServer: string | null,
  searchQuery: string,
): ToolCard[] {
  const [filtered, setFiltered] = useState<ToolCard[]>(tools);

  useEffect(() => {
    let result = tools;

    if (filterServer) {
      result = result.filter((t) => t.serverId === filterServer);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description?.toLowerCase().includes(query) ?? false),
      );
    }

    setFiltered(result);
  }, [tools, filterServer, searchQuery]);

  return filtered;
}

/**
 * Hook to get filtered prompts based on server and search
 */
export function useFilteredPrompts(
  prompts: PromptEntry[],
  filterServer: string | null,
  searchQuery: string,
): PromptEntry[] {
  const [filtered, setFiltered] = useState<PromptEntry[]>(prompts);

  useEffect(() => {
    let result = prompts;

    if (filterServer) {
      result = result.filter((p) => p.serverId === filterServer);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(query) || p.def.description?.toLowerCase().includes(query),
      );
    }

    setFiltered(result);
  }, [prompts, filterServer, searchQuery]);

  return filtered;
}

/**
 * Hook to get filtered resources based on server and MIME type
 */
export function useFilteredResources(
  resources: ResourceEntry[],
  filterServer: string | null,
  filterMimeType: string | null,
  searchQuery: string,
): ResourceEntry[] {
  const [filtered, setFiltered] = useState<ResourceEntry[]>(resources);

  useEffect(() => {
    let result = resources;

    if (filterServer) {
      result = result.filter((r) => r.serverId === filterServer);
    }

    if (filterMimeType) {
      result = result.filter((r) => r.def.mimeType === filterMimeType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.def.name?.toLowerCase().includes(query) ||
          r.def.description?.toLowerCase().includes(query) ||
          r.def.uri.toLowerCase().includes(query),
      );
    }

    setFiltered(result);
  }, [resources, filterServer, filterMimeType, searchQuery]);

  return filtered;
}
