/**
 * CLI Stdio Command Smoke Tests
 */

import { describe, expect, it } from "bun:test";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

describe("CLI Stdio Command", () => {
  it.skipIf(process.platform === "win32")(
    "should start and respond to JSON-RPC over stdio",
    async () => {
      const child = spawn("bun", ["dist/cli/index.js", "stdio"], {
        env: { ...process.env, NO_COLOR: "1" },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let responseReceived = false;
      let serverStarted = false;

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        if (stdout.includes("jsonrpc")) {
          responseReceived = true;
        }
      });

      child.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        if (text.includes("Goblin STDIO server running")) {
          serverStarted = true;
        }
      });

      // Wait for server to start (up to 5 seconds)
      const startTime = Date.now();
      while (!serverStarted && Date.now() - startTime < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(serverStarted).toBe(true);

      // Send initialize request
      const initRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const message = `Content-Length: ${Buffer.byteLength(initRequest)}\r\n\r\n${initRequest}`;
      child.stdin.write(message);

      await new Promise<void>((resolve, reject) => {
        if (responseReceived) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error(`Timeout waiting for response.`));
        }, 10000);

        const checkInterval = setInterval(() => {
          if (responseReceived) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });

      child.kill();

      expect(stdout).toContain("jsonrpc");
      expect(stdout).toContain("result");
      expect(stderr).toContain("Goblin STDIO server running");
    },
  );

  it.skipIf(process.platform === "win32")("should list tools via stdio", async () => {
    const child = spawn("bun", ["dist/cli/index.js", "stdio"], {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let serverStarted = false;

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      if (text.includes("Goblin STDIO server running")) {
        serverStarted = true;
      }
    });

    // Wait for server to start (up to 5 seconds)
    const startTime = Date.now();
    while (!serverStarted && Date.now() - startTime < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(serverStarted).toBe(true);

    if (!serverStarted) {
      throw new Error("Server did not start within timeout");
    }

    // Send initialize request
    const initRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });
    let message = `Content-Length: ${Buffer.byteLength(initRequest)}\r\n\r\n${initRequest}`;
    child.stdin.write(message);

    // Wait a bit for initialization
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Send list tools request
    const listToolsRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    message = `Content-Length: ${Buffer.byteLength(listToolsRequest)}\r\n\r\n${listToolsRequest}`;
    child.stdin.write(message);

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        child.kill();
        resolve();
      }, 5000);

      const checkInterval = setInterval(() => {
        if (
          stdout.includes('"tools":[') ||
          stdout.includes('"method":"notifications/tools/list_changed"')
        ) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
    });

    child.kill();

    // Verify we got a tools list response
    expect(stdout).toContain("tools");
    expect(stderr).toContain("Goblin STDIO server running");
  });
});
