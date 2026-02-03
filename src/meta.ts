/**
 * Project Metadata
 *
 * Centralized project identity - single source of truth for version and name.
 * Reads from package.json to ensure consistency across the codebase.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProjectMeta {
  name: string;
  version: string;
}

/**
 * Synchronous access to project metadata from package.json
 * Reads from disk at module load time.
 */
export const PROJECT_META: ProjectMeta = (() => {
  try {
    const packageJsonPath = join(__dirname, "..", "..", "package.json");
    const content = readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    return {
      name: packageJson.name || "@talkingthreads/goblin",
      version: packageJson.version || "0.1.0",
    };
  } catch {
    return {
      name: "@talkingthreads/goblin",
      version: "0.1.0",
    };
  }
})();

/**
 * Server name used in MCP protocol
 */
export const SERVER_NAME = PROJECT_META.name.replace("@talkingthreads/", "");

/**
 * Server version used in MCP protocol
 */
export const SERVER_VERSION = PROJECT_META.version;

/**
 * Async metadata access (for cases where async is preferred)
 */
export async function getProjectMeta(): Promise<ProjectMeta> {
  return PROJECT_META;
}

export interface ServerIdentity {
  name: string;
  version: string;
}

export async function getServerIdentity(): Promise<ServerIdentity> {
  return {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  };
}
