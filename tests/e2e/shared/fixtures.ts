/**
 * Test Fixtures for E2E Testing
 *
 * Provides test data and fixtures for e2e tests.
 */

import { join } from "node:path";

export interface SampleProject {
  name: string;
  files: Record<string, string>;
}

export interface SampleConfig {
  name: string;
  content: object;
}

export interface SamplePrompt {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  template: string;
}

export interface SampleResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: string;
}

/**
 * Sample projects for CLI testing
 */
export const SampleProjects: SampleProject[] = [
  {
    name: "simple-node",
    files: {
      "package.json": JSON.stringify(
        {
          name: "simple-node",
          version: "1.0.0",
          main: "index.js",
        },
        null,
        2,
      ),
      "index.js": 'console.log("Hello, World!");',
      "README.md": "# Simple Node Project\n\nA basic Node.js project for testing.",
    },
  },
  {
    name: "typescript-app",
    files: {
      "package.json": JSON.stringify(
        {
          name: "typescript-app",
          version: "1.0.0",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
          },
          devDependencies: {
            typescript: "^5.0.0",
          },
        },
        null,
        2,
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "commonjs",
            outDir: "./dist",
            strict: true,
          },
        },
        null,
        2,
      ),
      "src/index.ts": 'console.log("TypeScript app running!");',
      "README.md": "# TypeScript App\n\nA TypeScript project for testing.",
    },
  },
  {
    name: "multi-file",
    files: {
      "src/main.ts": 'import { greet } from "./greet";\nconsole.log(greet("World"));',
      "src/greet.ts":
        "export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}",
      "package.json": JSON.stringify(
        {
          name: "multi-file",
          version: "1.0.0",
        },
        null,
        2,
      ),
    },
  },
];

/**
 * Sample server configurations
 */
export const SampleConfigs: SampleConfig[] = [
  {
    name: "minimal",
    content: {
      servers: [],
    },
  },
  {
    name: "single-stdio",
    content: {
      servers: [
        {
          name: "test-server",
          transport: "stdio",
          command: "echo",
          args: ["test"],
          enabled: true,
        },
      ],
    },
  },
  {
    name: "multi-server",
    content: {
      servers: [
        {
          name: "server-a",
          transport: "stdio",
          command: "echo",
          args: ["a"],
          enabled: true,
        },
        {
          name: "server-b",
          transport: "http",
          url: "http://localhost:3001",
          enabled: true,
        },
      ],
    },
  },
  {
    name: "with-policies",
    content: {
      servers: [],
      policies: {
        outputSizeLimit: 65536,
        defaultTimeout: 30000,
      },
    },
  },
];

/**
 * Sample prompts for testing
 */
export const SamplePrompts: SamplePrompt[] = [
  {
    name: "summarize",
    description: "Summarize text content",
    arguments: [
      {
        name: "text",
        description: "The text to summarize",
        required: true,
      },
      {
        name: "maxLength",
        description: "Maximum summary length",
        required: false,
      },
    ],
    template: "Please summarize the following text in 100 words:\n\n{{text}}",
  },
  {
    name: "analyze-code",
    description: "Analyze code for best practices",
    arguments: [
      {
        name: "code",
        description: "The code to analyze",
        required: true,
      },
      {
        name: "language",
        description: "Programming language",
        required: true,
      },
    ],
    template:
      "Analyze the following {{language}} code and suggest improvements:\n\n```{{language}}\n{{code}}\n```",
  },
  {
    name: "translate",
    description: "Translate text to another language",
    arguments: [
      {
        name: "text",
        description: "Text to translate",
        required: true,
      },
      {
        name: "targetLanguage",
        description: "Target language",
        required: true,
      },
    ],
    template: "Translate the following text to {{targetLanguage}}:\n\n{{text}}",
  },
];

/**
 * Sample resources for testing
 */
export const SampleResources: SampleResource[] = [
  {
    uri: "file:///test/project/README.md",
    name: "README",
    description: "Project README file",
    mimeType: "text/markdown",
    content: "# Test Project\n\nThis is a test README file.",
  },
  {
    uri: "file:///test/project/config.json",
    name: "Config",
    description: "JSON configuration file",
    mimeType: "application/json",
    content: JSON.stringify({ key: "value", nested: { data: true } }, null, 2),
  },
  {
    uri: "test://data/text",
    name: "Text Data",
    description: "Plain text data",
    mimeType: "text/plain",
    content: "This is plain text content for testing.",
  },
];

/**
 * Get a sample project by name
 */
export function getSampleProject(name: string): SampleProject | undefined {
  return SampleProjects.find((p) => p.name === name);
}

/**
 * Get a sample config by name
 */
export function getSampleConfig(name: string): SampleConfig | undefined {
  return SampleConfigs.find((c) => c.name === name);
}

/**
 * Create a sample project in a directory
 */
export async function createSampleProject(dir: string, project: SampleProject): Promise<void> {
  const { writeFileSync, mkdirSync } = await import("node:fs");

  for (const [relativePath, content] of Object.entries(project.files)) {
    const fullPath = relativePath.includes("/")
      ? join(dir, relativePath)
      : join(dir, project.name, relativePath);

    const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (parentDir) {
      mkdirSync(parentDir, { recursive: true });
    }

    writeFileSync(fullPath, content);
  }
}

/**
 * Create a sample config file
 */
export async function createSampleConfig(dir: string, config: SampleConfig): Promise<string> {
  const { writeFileSync } = await import("node:fs");
  const path = join(dir, `${config.name}.json`);
  writeFileSync(path, JSON.stringify(config.content, null, 2));
  return path;
}
