import { initSessionLogging } from "./observability/init.js";

await initSessionLogging();

const { GoblinGateway } = await import("./core/gateway.js");
const { createLogger } = await import("./observability/logger.js");

const logger = createLogger("entry");

// Legacy entry point compatibility if needed, but CLI is preferred
if (import.meta.main) {
  // If run directly without CLI wrapper, execute default start
  const gateway = new GoblinGateway();
  gateway.start().catch((err) => {
    logger.error({ err }, "Fatal error");
    process.exit(1);
  });
}

export { GoblinGateway };
