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

export class VersionLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersionLoadError";
  }
}

function loadProjectMeta(): ProjectMeta {
  const packageJsonPath = join(__dirname, "..", "..", "package.json");

  let content: string;
  try {
    content = readFileSync(packageJsonPath, "utf-8");
  } catch (error) {
    throw new VersionLoadError(
      `Failed to read package.json at ${packageJsonPath}: ${error instanceof Error ? error.message : error}`,
    );
  }

  let packageJson: { name?: string; version?: string };
  try {
    packageJson = JSON.parse(content);
  } catch (error) {
    throw new VersionLoadError(
      `Failed to parse package.json: ${error instanceof Error ? error.message : error}`,
    );
  }

  if (!packageJson.version) {
    throw new VersionLoadError(
      `Version not found in package.json. Please ensure 'version' field is set.`,
    );
  }

  return {
    name: packageJson.name || "@talkingthreads/goblin",
    version: packageJson.version,
  };
}

/**
 * Synchronous access to project metadata from package.json
 * Reads from disk at module load time.
 * Throws VersionLoadError if version cannot be determined.
 */
export const PROJECT_META: ProjectMeta = loadProjectMeta();

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
