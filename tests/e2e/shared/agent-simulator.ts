/**
 * Agent Simulator for E2E Testing
 *
 * Simulates LLM agent workflows with multi-turn conversations,
 * tool selection, context management, and complex workflows.
 */

export type AgentState = "idle" | "waiting_for_tool" | "processing" | "done" | "error";

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface WorkflowStep {
  type:
    | "user-message"
    | "tool-selection"
    | "result-processing"
    | "context-update"
    | "prompt-request";
  message?: string;
  tool?: string;
  args?: Record<string, unknown>;
  expectation?: string;
  data?: Record<string, unknown>;
  prompt?: string;
  promptArgs?: Record<string, string>;
}

export interface AgentWorkflow {
  name: string;
  steps: WorkflowStep[];
  expectedTools: string[];
  expectedOutcome: "success" | "partial" | "failure";
}

export interface WorkflowResult {
  workflow: string;
  success: boolean;
  toolsUsed: string[];
  messages: AgentMessage[];
  contextChanges: number;
  errors: string[];
  duration: number;
}

export interface AgentSimulatorConfig {
  maxTurns: number;
  timeout: number;
  verbose: boolean;
}

/**
 * Simulates LLM agent behavior for testing meta-tools and workflows
 */
export class AgentSimulator {
  private state: AgentState = "idle";
  private conversation: AgentMessage[] = [];
  private toolsUsed: string[] = [];
  private context: Map<string, unknown> = new Map();
  private contextChanges: number = 0;
  private errors: string[] = [];
  private startTime: number = 0;

  constructor(
    private config: AgentSimulatorConfig = { maxTurns: 20, timeout: 60000, verbose: false },
  ) {}

  /**
   * Get available tools (simulated meta-tools)
   */
  getAvailableTools(): string[] {
    return [
      "catalog_tools",
      "describe_tool",
      "search_tools",
      "catalog_prompts",
      "describe_prompt",
      "search_prompts",
      "catalog_resources",
      "describe_resource",
      "search_resources",
      "health",
    ];
  }

  /**
   * Simulate a complete agent workflow
   */
  async simulateWorkflow(workflow: AgentWorkflow): Promise<WorkflowResult> {
    this.startTime = Date.now();
    this.state = "processing";
    this.conversation = [];
    this.toolsUsed = [];
    this.context = new Map();
    this.contextChanges = 0;
    this.errors = [];

    for (const step of workflow.steps) {
      if (Date.now() - this.startTime > this.config.timeout) {
        this.errors.push("Workflow timeout exceeded");
        break;
      }

      await this.executeStep(step);
    }

    const duration = Date.now() - this.startTime;
    const success = this.evaluateOutcome(workflow.expectedOutcome);

    this.state = success ? "done" : "error";

    return {
      workflow: workflow.name,
      success,
      toolsUsed: this.toolsUsed,
      messages: this.conversation,
      contextChanges: this.contextChanges,
      errors: this.errors,
      duration,
    };
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep): Promise<void> {
    switch (step.type) {
      case "user-message":
        await this.sendUserMessage(step.message || "");
        break;
      case "tool-selection":
        await this.selectTool(step.tool || "", step.args || {});
        break;
      case "result-processing":
        await this.processResult(step.expectation || "");
        break;
      case "context-update":
        await this.updateContext(step.data || {});
        break;
      case "prompt-request":
        await this.requestPrompt(step.prompt || "", step.promptArgs || {});
        break;
    }
  }

  /**
   * Simulate user message
   */
  private async sendUserMessage(message: string): Promise<void> {
    this.conversation.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });
    this.state = "waiting_for_tool";
  }

  /**
   * Simulate tool selection and execution
   */
  private async selectTool(toolName: string, _args: Record<string, unknown>): Promise<void> {
    this.toolsUsed.push(toolName);
    this.conversation.push({
      role: "assistant",
      content: `Using tool: ${toolName}`,
      timestamp: new Date(),
    });
    this.state = "processing";
  }

  /**
   * Simulate result processing
   */
  private async processResult(expectation: string): Promise<void> {
    this.conversation.push({
      role: "assistant",
      content: `Result processed: ${expectation}`,
      timestamp: new Date(),
    });
  }

  /**
   * Update context with new data
   */
  private async updateContext(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      this.context.set(key, value);
    }
    this.contextChanges++;
  }

  /**
   * Request and use a prompt
   */
  private async requestPrompt(promptName: string, _args: Record<string, string>): Promise<void> {
    this.toolsUsed.push(`prompt:${promptName}`);
    this.conversation.push({
      role: "assistant",
      content: `Requested prompt: ${promptName}`,
      timestamp: new Date(),
    });
  }

  /**
   * Evaluate if workflow met expected outcome
   */
  private evaluateOutcome(expected: "success" | "partial" | "failure"): boolean {
    switch (expected) {
      case "success":
        return this.errors.length === 0;
      case "partial":
        return this.errors.length <= this.toolsUsed.length * 0.2;
      case "failure":
        return this.errors.length > 0;
      default:
        return true;
    }
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Get context value
   */
  getContext(key: string): unknown {
    return this.context.get(key);
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = new Map();
    this.contextChanges++;
  }

  /**
   * Reset simulator
   */
  reset(): void {
    this.state = "idle";
    this.conversation = [];
    this.toolsUsed = [];
    this.context = new Map();
    this.contextChanges = 0;
    this.errors = [];
  }
}

/**
 * Predefined workflows for testing
 */
export const TestWorkflows = {
  singleToolCall: (): AgentWorkflow => ({
    name: "single-tool-call",
    steps: [
      { type: "user-message", message: "List all available tools" },
      { type: "tool-selection", tool: "catalog_tools" },
      { type: "result-processing", expectation: "Tool list returned" },
    ],
    expectedTools: ["catalog_tools"],
    expectedOutcome: "success",
  }),

  multiTurnConversation: (): AgentWorkflow => ({
    name: "multi-turn-conversation",
    steps: [
      { type: "user-message", message: "What tools are available?" },
      { type: "tool-selection", tool: "catalog_tools" },
      { type: "result-processing", expectation: "Tool catalog received" },
      { type: "user-message", message: "Search for file tools" },
      { type: "tool-selection", tool: "search_tools", args: { query: "file" } },
      { type: "result-processing", expectation: "File tools found" },
    ],
    expectedTools: ["catalog_tools", "search_tools"],
    expectedOutcome: "success",
  }),

  contextCarryOver: (): AgentWorkflow => ({
    name: "context-carry-over",
    steps: [
      { type: "user-message", message: "List resources" },
      { type: "tool-selection", tool: "catalog_resources" },
      { type: "context-update", data: { resourceCount: 5 } },
      { type: "user-message", message: "Show me more details about the first resource" },
      { type: "tool-selection", tool: "describe_resource", args: { uri: "resource://1" } },
    ],
    expectedTools: ["catalog_resources", "describe_resource"],
    expectedOutcome: "success",
  }),

  toolNotFound: (): AgentWorkflow => ({
    name: "tool-not-found",
    steps: [
      { type: "user-message", message: "Use a nonexistent tool" },
      { type: "tool-selection", tool: "nonexistent_tool" },
      { type: "result-processing", expectation: "Error handled gracefully" },
    ],
    expectedTools: ["nonexistent_tool"],
    expectedOutcome: "partial",
  }),

  promptWorkflow: (): AgentWorkflow => ({
    name: "prompt-workflow",
    steps: [
      { type: "user-message", message: "What prompts are available?" },
      { type: "tool-selection", tool: "catalog_prompts" },
      { type: "user-message", message: "Get the summarize-prompt" },
      { type: "tool-selection", tool: "describe_prompt", args: { name: "summarize-prompt" } },
      { type: "prompt-request", prompt: "summarize-prompt", promptArgs: { text: "Test content" } },
    ],
    expectedTools: ["catalog_prompts", "describe_prompt"],
    expectedOutcome: "success",
  }),
};
