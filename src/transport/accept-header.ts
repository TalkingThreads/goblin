/**
 * Accept Header Validation Utilities
 *
 * Per MCP spec, clients MUST include Accept header listing both
 * application/json and text/event-stream. However, many MCP clients
 * don't comply. This utility provides lenient validation for broader
 * client compatibility.
 */

export function isAcceptHeaderValid(accept: string | null): boolean {
  if (!accept) {
    return false;
  }

  const normalized = accept.toLowerCase().trim();

  if (normalized === "*/*" || normalized === "application/*") {
    return true;
  }

  const types = normalized.split(",").map((t) => t.trim());

  const hasJson = types.some((t) => t === "application/json" || t === "application/json;q=0");
  const hasEventStream = types.some(
    (t) => t === "text/event-stream" || t === "text/event-stream;q=0",
  );

  if (hasJson && hasEventStream) {
    return true;
  }

  if (hasJson) {
    return true;
  }

  return false;
}

export function isSseAcceptHeaderValid(accept: string | null): boolean {
  if (!accept) {
    return false;
  }

  const normalized = accept.toLowerCase().trim();

  if (
    normalized === "*/*" ||
    normalized === "text/event-stream" ||
    normalized === "text/event-stream, */*"
  ) {
    return true;
  }

  const types = normalized.split(",").map((t) => t.trim());

  const hasEventStream = types.some(
    (t) => t === "text/event-stream" || t === "text/event-stream;q=0",
  );

  if (hasEventStream) {
    return true;
  }

  return false;
}
