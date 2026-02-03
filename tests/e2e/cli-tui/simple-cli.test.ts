/**
 * Simple CLI Test
 */

import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { join } from "node:path";

describe("Simple CLI Test", () => {
  test("should run help command", async () => {
    const binaryPath = join(process.cwd(), "dist/cli/index.js");

    return new Promise((resolve, reject) => {
      const proc = spawn("node", [binaryPath, "help"], {
        cwd: process.cwd(),
        env: { ...process.env, NO_COLOR: "1" },
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", reject);

      proc.on("exit", (code) => {
        console.log("Test completed with exit code:", code);
        console.log("stdout:", stdout.substring(0, 100));
        expect(code).toBe(0);
        expect(stdout).toContain("goblin");
        resolve();
      });

      setTimeout(() => {
        proc.kill();
        reject(new Error("Test timed out"));
      }, 5000);
    });
  });
});
