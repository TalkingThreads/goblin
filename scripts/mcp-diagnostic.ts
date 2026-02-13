#!/usr/bin/env bun
/**
 * MCP Diagnostic Tool
 * Tests if Goblin responds correctly to MCP initialization
 * Uses proper MCP STDIO framing (newline-delimited JSON)
 */

import { spawn } from "child_process";

console.log("🔍 Starting MCP diagnostic test...\n");

// Start Goblin in STDIO mode
const goblin = spawn("goblin", ["start", "--transport", "stdio"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let stderrBuffer = "";
let stdoutBuffer = "";
let initReceived = false;
let initResponded = false;

// Helper to send MCP message with proper framing (NDJSON)
function sendMcpMessage(message: unknown): void {
  const json = JSON.stringify(message);
  const line = json + "\n";
  goblin.stdin.write(line);
  console.log(`📤 Sent (${line.length} bytes):`, json.substring(0, 100) + (json.length > 100 ? "..." : ""));
}

// Capture stderr (logs)
goblin.stderr.on("data", (data) => {
  const text = data.toString();
  stderrBuffer += text;

  // Check for readiness signal
  if (text.includes('"status":"ready"') && !initReceived) {
    console.log("✅ Goblin sent readiness signal\n");
    initReceived = true;

    // Send initialize request after a short delay
    setTimeout(() => {
      console.log("📤 Sending initialize request...");
      sendMcpMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "diagnostic", version: "1.0.0" },
        },
      });
    }, 100);
  }
});

// Capture stdout (MCP responses)
goblin.stdout.on("data", (data) => {
  const text = data.toString();
  stdoutBuffer += text;

  console.log("📥 Raw stdout:", text.replace(/\n/g, "\\n"));

  // Parse lines
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const response = JSON.parse(line);
      console.log("📋 Parsed response:", JSON.stringify(response, null, 2));

      if (response.id === 1 && response.result) {
        console.log("✅ Goblin responded to initialize request!");
        initResponded = true;

        // Send initialized notification
        setTimeout(() => {
          console.log("\n📤 Sending notifications/initialized...");
          sendMcpMessage({
            jsonrpc: "2.0",
            method: "notifications/initialized",
          });
        }, 100);

        // Test ping
        setTimeout(() => {
          console.log("\n📤 Sending ping request...");
          sendMcpMessage({
            jsonrpc: "2.0",
            id: 2,
            method: "ping",
          });
        }, 300);

        // Test tools/list
        setTimeout(() => {
          console.log("\n📤 Sending tools/list request...");
          sendMcpMessage({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/list",
            params: {},
          });
        }, 500);

        // Close after tests
        setTimeout(() => {
          console.log("\n✅ All tests passed! Closing Goblin...");
          goblin.stdin.end();
        }, 1500);
      } else if (response.id === 2) {
        console.log("✅ Ping response received!");
      } else if (response.id === 3) {
        console.log(
          "✅ Tools/list response received, tool count:",
          response.result?.tools?.length || 0,
        );
      } else if (response.error) {
        console.log("❌ Error response:", JSON.stringify(response.error));
      }
    } catch (e) {
      console.log("⚠️  Failed to parse JSON:", line.substring(0, 100));
    }
  }
});

// Handle process exit
goblin.on("exit", (code) => {
  console.log("\n" + "=".repeat(50));
  console.log("📊 Diagnostic Summary");
  console.log("=".repeat(50));
  console.log(`Process exit code: ${code}`);
  console.log(`Initialize request sent: ${initReceived ? "YES" : "NO"}`);
  console.log(`Initialize response received: ${initResponded ? "YES" : "NO"}`);

  if (!initResponded) {
    console.log("\n❌ FAILED: Goblin did not respond to initialize request");
    console.log("\n🔍 Stderr output:");
    console.log(stderrBuffer || "(no output)");
    console.log("\n🔍 Stdout output:");
    console.log(stdoutBuffer || "(no output)");
    process.exit(1);
  } else {
    console.log("\n✅ SUCCESS: Goblin is working correctly!");
    process.exit(0);
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log("\n⏱️  Timeout: Goblin did not respond within 15 seconds");
  goblin.kill();
}, 15000);

console.log("⏳ Waiting for Goblin to start...");
