import { describe, expect, mock, test } from "bun:test";
import { StdioServerTransport } from "../../../src/transport/stdio-server.js";

// Mock the SDK Transport
mock.module("@modelcontextprotocol/sdk/server/stdio.js", () => {
  return {
    StdioServerTransport: class MockSdkStdioTransport {
      onclose?: () => void;
      onerror?: (error: Error) => void;
    },
  };
});

describe("StdioServerTransport", () => {
  test("should be instantiable", () => {
    const transport = new StdioServerTransport();
    expect(transport).toBeDefined();
  });

  test("should have onerror property", () => {
    const transport = new StdioServerTransport();
    expect("onerror" in transport).toBe(true);
  });

  test("should have onclose property", () => {
    const transport = new StdioServerTransport();
    expect("onclose" in transport).toBe(true);
  });
});
