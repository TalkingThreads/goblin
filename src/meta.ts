/**
 * Project Metadata
 *
 * Centralized project identity - single source of truth for version and name.
 * Reads from package.json to ensure consistency across the codebase.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

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

function findPackageJson(): string {
  let dir = process.cwd();
  const root = dir;

  for (let i = 0; i < 10; i++) {
    const packageJsonPath = join(dir, "package.json");
    try {
      readFileSync(packageJsonPath, "utf-8");
      return packageJsonPath;
    } catch {
      const parent = join(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  }

  throw new VersionLoadError(
    `Could not find package.json in ${root} or any parent directory up to 10 levels`,
  );
}

function loadProjectMeta(): ProjectMeta {
  const packageJsonPath = findPackageJson();

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
 * Searches for package.json starting from current working directory.
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
