import { describe, expect, test } from "bun:test";
import { StreamableHttpServerTransport } from "../../../src/transport/http-server.js";

describe("StreamableHttpServerTransport", () => {
  test("should create transport with sessionIdGenerator", () => {
    const transport = new StreamableHttpServerTransport({
      sessionIdGenerator: () => "test-session-id",
    });

    expect(transport).toBeDefined();
  });

  test("should create transport without sessionIdGenerator (stateless mode)", () => {
    const transport = new StreamableHttpServerTransport({
      sessionIdGenerator: undefined,
    });

    expect(transport).toBeDefined();
  });

  test("should create transport with options", () => {
    const transport = new StreamableHttpServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
    });

    expect(transport).toBeDefined();
  });
});
