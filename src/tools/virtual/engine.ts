import type { Config, VirtualToolOp } from "../../config/index.js";
import type { Router } from "../../gateway/router.js";
import { createLogger } from "../../observability/logger.js";

const logger = createLogger("virtual-engine");

export interface ExecutionContext {
  results: Record<string, unknown>; // Map of tool/step results
}

/**
 * Execute a virtual tool
 */
export class VirtualToolEngine {
  constructor(
    private router: Router,
    private config: Config,
  ) {}

  /**
   * Execute a defined virtual tool
   */
  async execute(toolId: string, args: Record<string, unknown>): Promise<unknown> {
    const definition = this.config.virtualTools?.find((vt) => vt.id === toolId);
    if (!definition) {
      throw new Error(`Virtual tool definition not found: ${toolId}`);
    }

    const context: ExecutionContext = {
      results: { ...args }, // Seed results with input args
    };

    logger.info({ tool: toolId, steps: definition.ops.length }, "Starting virtual tool execution");

    try {
      // Sequential execution for MVP
      for (let i = 0; i < definition.ops.length; i++) {
        const op = definition.ops[i]!; // Checked by loop
        await this.executeOp(op, context, i);
      }

      // Return the result of the last operation
      const lastOpIndex = definition.ops.length - 1;
      const lastResult = context.results[`step_${lastOpIndex}`];

      // Or return full context? Usually we want the last output.
      return lastResult;
    } catch (error) {
      logger.error({ tool: toolId, error }, "Virtual tool execution failed");
      if (definition.stopOnError) {
        throw error;
      }
      return { error: String(error), partialResults: context.results };
    }
  }

  private async executeOp(
    op: VirtualToolOp,
    context: ExecutionContext,
    index: number,
  ): Promise<void> {
    // 1. Template arguments
    const toolArgs = this.templateArgs(op.args, context);

    // 2. Execute tool via Router
    logger.debug({ tool: op.tool, args: toolArgs }, "Executing step");
    const result = await this.router.callTool(op.tool, toolArgs);

    // 3. Store result
    // We assume result.content[0].text is JSON if it's a data tool,
    // but MCP returns mixed content.
    // For now, store the raw result object.
    context.results[`step_${index}`] = result;

    // Also try to parse if text
    if (result.content && result.content[0]?.type === "text") {
      try {
        const parsed = JSON.parse(result.content[0].text);
        context.results[`step_${index}_data`] = parsed;
      } catch {
        // Ignore if not JSON
      }
    }
  }

  /**
   * Simple variable substitution: ${variable}
   */
  private templateArgs(
    args: Record<string, unknown>,
    context: ExecutionContext,
  ): Record<string, unknown> {
    const templated: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
        const varName = value.slice(2, -1);
        // Resolve from context results
        // Support nested keys? e.g. step_0_data.id
        // Simple implementation:
        const resolved = this.resolveVariable(varName, context);
        templated[key] = resolved !== undefined ? resolved : value;
      } else {
        templated[key] = value;
      }
    }

    return templated;
  }

  private resolveVariable(path: string, context: ExecutionContext): unknown {
    const parts = path.split(".");
    let current: any = context.results;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }
}
