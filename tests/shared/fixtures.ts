/**
 * Test Fixtures
 *
 * Shared test data fixtures for integration tests.
 */

import type { Prompt, Resource, Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Sample tool definitions for testing
 */
export const SAMPLE_TOOLS: Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to write",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "List files in a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the directory to list",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "get_weather",
    description: "Get the current weather for a location",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Location to get weather for",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "search_web",
    description: "Search the web for information",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        num_results: {
          type: "number",
          description: "Number of results to return",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "calculate",
    description: "Perform a calculation",
    inputSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Mathematical expression to evaluate",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_time",
    description: "Get the current time",
    inputSchema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Timezone to get time for (e.g., 'America/New_York')",
        },
      },
    },
  },
  {
    name: "send_email",
    description: "Send an email",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Email recipient",
        },
        subject: {
          type: "string",
          description: "Email subject",
        },
        body: {
          type: "string",
          description: "Email body",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
];

/**
 * Sample resource definitions for testing
 */
export const SAMPLE_RESOURCES: Resource[] = [
  {
    uri: "file:///test/docs/readme.md",
    name: "README.md",
    description: "Project README file",
    mimeType: "text/markdown",
  },
  {
    uri: "file:///test/docs/api.md",
    name: "API Documentation",
    description: "API documentation",
    mimeType: "text/markdown",
  },
  {
    uri: "file:///test/config.json",
    name: "Configuration",
    description: "Application configuration",
    mimeType: "application/json",
  },
  {
    uri: "file:///test/data/users.json",
    name: "User Data",
    description: "User data file",
    mimeType: "application/json",
  },
  {
    uri: "file:///test/data/report.csv",
    name: "Report",
    description: "Data report",
    mimeType: "text/csv",
  },
  {
    uri: "https://api.example.com/status",
    name: "API Status",
    description: "API status endpoint",
    mimeType: "application/json",
  },
  {
    uri: "https://docs.example.com/guide",
    name: "User Guide",
    description: "Online user guide",
    mimeType: "text/html",
  },
  {
    uri: "file:///test/logs/app.log",
    name: "Application Log",
    description: "Application log file",
    mimeType: "text/plain",
  },
];

/**
 * Sample prompt definitions for testing
 */
export const SAMPLE_PROMPTS: Prompt[] = [
  {
    name: "summarize",
    description: "Summarize a given text",
    arguments: [
      {
        name: "text",
        description: "Text to summarize",
        required: true,
      },
      {
        name: "max_length",
        description: "Maximum summary length in words",
        required: false,
      },
    ],
  },
  {
    name: "translate",
    description: "Translate text to a different language",
    arguments: [
      {
        name: "text",
        description: "Text to translate",
        required: true,
      },
      {
        name: "target_language",
        description: "Target language (e.g., 'spanish', 'french')",
        required: true,
      },
    ],
  },
  {
    name: "analyze_code",
    description: "Analyze code for potential issues",
    arguments: [
      {
        name: "code",
        description: "Code to analyze",
        required: true,
      },
      {
        name: "language",
        description: "Programming language",
        required: true,
      },
    ],
  },
  {
    name: "generate_docstring",
    description: "Generate a docstring for a function",
    arguments: [
      {
        name: "function_name",
        description: "Name of the function",
        required: true,
      },
      {
        name: "description",
        description: "Function description",
        required: true,
      },
    ],
  },
  {
    name: "create_test",
    description: "Create unit tests for a function",
    arguments: [
      {
        name: "function_code",
        description: "The function code to test",
        required: true,
      },
    ],
  },
];

/**
 * Sample tool responses for testing
 */
export const SAMPLE_TOOL_RESPONSES: Record<string, unknown> = {
  read_file: {
    content: [
      {
        type: "text",
        text: "File content here",
      },
    ],
  },
  write_file: {
    content: [
      {
        type: "text",
        text: "File written successfully",
      },
    ],
  },
  list_directory: {
    content: [
      {
        type: "text",
        text: "file1.txt\nfile2.txt\nfile3.txt\nsubdir/",
      },
    ],
  },
  get_weather: {
    content: [
      {
        type: "text",
        text: "Current weather: 22°C, Partly Cloudy",
      },
    ],
  },
  search_web: {
    content: [
      {
        type: "text",
        text: "Search results:\n1. Result 1\n2. Result 2\n3. Result 3",
      },
    ],
  },
  calculate: {
    content: [
      {
        type: "text",
        text: "42",
      },
    ],
  },
  get_time: {
    content: [
      {
        type: "text",
        text: "Current time: 2024-01-15T10:30:00Z",
      },
    ],
  },
  send_email: {
    content: [
      {
        type: "text",
        text: "Email sent successfully to recipient@example.com",
      },
    ],
  },
};

/**
 * Sample resource content for testing
 */
export const SAMPLE_RESOURCE_CONTENT: Record<string, string> = {
  "file:///test/docs/readme.md": "# Test Project\n\nThis is a test project for integration tests.",
  "file:///test/docs/api.md":
    "# API Documentation\n\n## Endpoints\n\n- GET /status\n- POST /tools/call",
  "file:///test/config.json": '{"version": "1.0.0", "name": "test-app"}',
  "file:///test/data/users.json": '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]',
  "file:///test/data/report.csv": "name,value\nAlice,100\nBob,200",
  "https://api.example.com/status": '{"status": "ok", "version": "1.0.0"}',
  "https://docs.example.com/guide": "<html><body>User Guide</body></html>",
  "file:///test/logs/app.log":
    "[2024-01-15T10:00:00Z] INFO: Application started\n[2024-01-15T10:01:00Z] INFO: Request received",
};

/**
 * Sample prompt responses for testing
 */
export const SAMPLE_PROMPT_RESPONSES: Record<string, string> = {
  summarize: "This is a summary of the provided text.",
  translate: "Translated text in the target language.",
  analyze_code: "The code looks good but consider adding error handling.",
  generate_docstring:
    '"""Function description\n\nArgs:\n    arg1: Description of arg1\n\nReturns:\n    Description of return value\n"""',
  create_test:
    "import unittest\n\nclass TestFunction(unittest.TestCase):\n    def test_example(self):\n        self.assertEqual(1, 1)",
};

/**
 * Create a test server with multiple tools
 */
export function createServerWithTools(tools: Tool[]): { name: string; tools: Tool[] } {
  return {
    name: "test-server-with-tools",
    tools,
  };
}

/**
 * Create a test server with multiple resources
 */
export function createServerWithResources(resources: Resource[]): {
  name: string;
  resources: Resource[];
} {
  return {
    name: "test-server-with-resources",
    resources,
  };
}

/**
 * Create a test server with multiple prompts
 */
export function createServerWithPrompts(prompts: Prompt[]): { name: string; prompts: Prompt[] } {
  return {
    name: "test-server-with-prompts",
    prompts,
  };
}
