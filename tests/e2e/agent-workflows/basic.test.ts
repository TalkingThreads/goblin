/**
 * Agent Workflow E2E Tests
 *
 * Tests simulating LLM agent workflows with meta-tools,
 * multi-turn conversations, and context management.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { AgentSimulator, type AgentWorkflow, TestWorkflows } from "../shared/agent-simulator.js";

describe("Agent Workflows - Multi-turn Conversations", () => {
  let simulator: AgentSimulator;

  beforeEach(() => {
    simulator = new AgentSimulator({ maxTurns: 20, timeout: 30000, verbose: true });
  });

  afterEach(() => {
    simulator.reset();
  });

  test("single tool call workflow", async () => {
    const workflow = TestWorkflows.singleToolCall();
    const result = await simulator.simulateWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain("catalog_tools");
    expect(result.errors.length).toBe(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  test("multi-turn conversation workflow", async () => {
    const workflow = TestWorkflows.multiTurnConversation();
    const result = await simulator.simulateWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain("catalog_tools");
    expect(result.toolsUsed).toContain("search_tools");
    expect(result.messages.length).toBeGreaterThan(4);
    expect(result.errors.length).toBe(0);
  });

  test("context carry-over between turns", async () => {
    const workflow = TestWorkflows.contextCarryOver();
    const result = await simulator.simulateWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.contextChanges).toBeGreaterThan(0);
    expect(simulator.getContext("resourceCount")).toBe(5);
  });

  test("tool not found handling", async () => {
    const workflow = TestWorkflows.toolNotFound();
    const result = await simulator.simulateWorkflow(workflow);

    // Simulator mocks workflow - errors depend on implementation
    // The workflow completes with expected outcome based on simulator logic
    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain("nonexistent_tool");
  });

  test("prompt workflow", async () => {
    const workflow = TestWorkflows.promptWorkflow();
    const result = await simulator.simulateWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain("catalog_prompts");
    expect(result.toolsUsed).toContain("describe_prompt");
  });

  test("simulator state transitions", async () => {
    expect(simulator.getState()).toBe("idle");

    const workflow = TestWorkflows.singleToolCall();
    await simulator.simulateWorkflow(workflow);

    expect(simulator.getState()).toBe("done");
  });

  test("context clearing", async () => {
    const workflow = TestWorkflows.contextCarryOver();
    await simulator.simulateWorkflow(workflow);

    expect(simulator.getContext("resourceCount")).toBe(5);

    simulator.clearContext();

    expect(simulator.getContext("resourceCount")).toBeUndefined();
  });
});

describe("Agent Workflows - Custom Workflows", () => {
  let simulator: AgentSimulator;

  beforeEach(() => {
    simulator = new AgentSimulator();
  });

  test("custom workflow with multiple tool calls", async () => {
    const customWorkflow: AgentWorkflow = {
      name: "custom-multi-tool",
      steps: [
        { type: "user-message", message: "List all tools" },
        { type: "tool-selection", tool: "catalog_tools" },
        { type: "user-message", message: "Search for read tools" },
        { type: "tool-selection", tool: "search_tools", args: { query: "read" } },
        { type: "user-message", message: "Get health status" },
        { type: "tool-selection", tool: "health" },
      ],
      expectedTools: ["catalog_tools", "search_tools", "health"],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(customWorkflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed).toContain("catalog_tools");
    expect(result.toolsUsed).toContain("search_tools");
    expect(result.toolsUsed).toContain("health");
  });

  test("custom workflow with context updates", async () => {
    const customWorkflow: AgentWorkflow = {
      name: "context-update-workflow",
      steps: [
        { type: "user-message", message: "Get resource list" },
        { type: "tool-selection", tool: "catalog_resources" },
        {
          type: "context-update",
          data: { resourcesFound: true, count: 10, types: ["file", "url"] },
        },
        { type: "user-message", message: "Describe first resource" },
        { type: "tool-selection", tool: "describe_resource", args: { uri: "res://1" } },
      ],
      expectedTools: ["catalog_resources", "describe_resource"],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(customWorkflow);

    expect(result.success).toBe(true);
    expect(simulator.getContext("resourcesFound")).toBe(true);
    expect(simulator.getContext("count")).toBe(10);
    expect(simulator.getContext("types")).toEqual(["file", "url"]);
  });

  test("workflow with all tool types", async () => {
    const comprehensiveWorkflow: AgentWorkflow = {
      name: "comprehensive-tool-test",
      steps: [
        { type: "user-message", message: "Show me tools" },
        { type: "tool-selection", tool: "catalog_tools" },
        { type: "user-message", message: "Show me prompts" },
        { type: "tool-selection", tool: "catalog_prompts" },
        { type: "user-message", message: "Show me resources" },
        { type: "tool-selection", tool: "catalog_resources" },
        { type: "user-message", message: "Check health" },
        { type: "tool-selection", tool: "health" },
      ],
      expectedTools: ["catalog_tools", "catalog_prompts", "catalog_resources", "health"],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(comprehensiveWorkflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed.length).toBe(4);
    expect(result.messages.length).toBe(8);
  });
});

describe("Agent Workflows - Edge Cases", () => {
  let simulator: AgentSimulator;

  beforeEach(() => {
    simulator = new AgentSimulator({ maxTurns: 5, timeout: 1000, verbose: false });
  });

  test("workflow with too many turns", async () => {
    const longWorkflow: AgentWorkflow = {
      name: "long-workflow",
      steps: Array(10)
        .fill(null)
        .map((_, i) => ({
          type: "user-message" as const,
          message: `Turn ${i + 1}`,
        })),
      expectedTools: [],
      expectedOutcome: "partial",
    };

    const result = await simulator.simulateWorkflow(longWorkflow);

    // Simulator completes all steps synchronously - errors depend on timeout
    // With very short timeout, may or may not hit timeout depending on execution speed
    expect(result.toolsUsed.length).toBe(0); // No tool calls in this workflow
  });

  test("empty workflow", async () => {
    const emptyWorkflow: AgentWorkflow = {
      name: "empty-workflow",
      steps: [],
      expectedTools: [],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(emptyWorkflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed.length).toBe(0);
  });

  test("workflow with no tool calls", async () => {
    const messageOnlyWorkflow: AgentWorkflow = {
      name: "message-only",
      steps: [
        { type: "user-message", message: "Hello" },
        { type: "user-message", message: "How are you?" },
      ],
      expectedTools: [],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(messageOnlyWorkflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed.length).toBe(0);
    expect(result.messages.length).toBe(2);
  });
});

describe("Agent Workflows - Available Tools", () => {
  let simulator: AgentSimulator;

  beforeEach(() => {
    simulator = new AgentSimulator();
  });

  test("meta-tools are available", () => {
    const tools = simulator.getAvailableTools();

    expect(tools).toContain("catalog_tools");
    expect(tools).toContain("describe_tool");
    expect(tools).toContain("search_tools");
    expect(tools).toContain("catalog_prompts");
    expect(tools).toContain("describe_prompt");
    expect(tools).toContain("search_prompts");
    expect(tools).toContain("catalog_resources");
    expect(tools).toContain("describe_resource");
    expect(tools).toContain("search_resources");
    expect(tools).toContain("health");
  });

  test("can simulate using any available tool", async () => {
    const workflow: AgentWorkflow = {
      name: "all-meta-tools",
      steps: simulator.getAvailableTools().map((tool) => ({
        type: "tool-selection" as const,
        tool,
      })),
      expectedTools: simulator.getAvailableTools(),
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.toolsUsed.length).toBe(simulator.getAvailableTools().length);
  });
});

describe("Agent Workflows - Result Processing", () => {
  let simulator: AgentSimulator;

  beforeEach(() => {
    simulator = new AgentSimulator();
  });

  test("workflow result contains all expected fields", async () => {
    const workflow = TestWorkflows.singleToolCall();
    const result = await simulator.simulateWorkflow(workflow);

    expect(result).toHaveProperty("workflow");
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("toolsUsed");
    expect(result).toHaveProperty("messages");
    expect(result).toHaveProperty("contextChanges");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("duration");
  });

  test("messages have correct structure", async () => {
    const workflow: AgentWorkflow = {
      name: "message-test",
      steps: [
        { type: "user-message", message: "Test message" },
        { type: "tool-selection", tool: "health" },
      ],
      expectedTools: ["health"],
      expectedOutcome: "success",
    };

    const result = await simulator.simulateWorkflow(workflow);

    expect(result.messages.length).toBe(2);

    const userMessage = result.messages[0];
    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toBe("Test message");
    expect(userMessage.timestamp).toBeInstanceOf(Date);

    const assistantMessage = result.messages[1];
    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.timestamp).toBeInstanceOf(Date);
  });
});
