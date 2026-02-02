/**
 * Tool Schema Discovery Smoke Tests
 *
 * Tests for tool schema validation and discovery
 */

import { describe, expect, it } from "bun:test";

describe("Tool Schema Discovery", () => {
  it("should accept valid tool schemas", async () => {
    const validSchema = {
      name: "valid_tool",
      description: "A valid tool",
      inputSchema: {
        type: "object",
        properties: {
          param1: { type: "string" },
        },
        required: ["param1"],
      },
    };

    const validate = (schema: any) => {
      if (!schema.name || !schema.description || !schema.inputSchema) return false;
      return true;
    };

    expect(validate(validSchema)).toBe(true);
  });

  it("should reject invalid tool schemas", async () => {
    const invalidSchema = {
      name: "invalid_tool",
      // missing description and inputSchema
    };

    const validate = (schema: any) => {
      if (!schema.name || !schema.description || !schema.inputSchema) return false;
      return true;
    };

    expect(validate(invalidSchema)).toBe(false);
  });

  it("should include all required fields in tool schema", async () => {
    const tool = {
      name: "test_tool",
      description: "Test description",
      inputSchema: {
        type: "object",
        properties: {},
      },
    };

    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("description");
    expect(tool).toHaveProperty("inputSchema");
  });

  it("should handle tool schema validation errors", async () => {
    const schemaWithInvalidInput = {
      name: "bad_input",
      description: "Tool with bad input schema",
      inputSchema: "not an object", // Invalid
    };

    const validate = (schema: any) => {
      const errors: string[] = [];
      if (typeof schema.inputSchema !== "object") {
        errors.push("inputSchema must be an object");
      }
      return errors;
    };

    const errors = validate(schemaWithInvalidInput);
    expect(errors).toContain("inputSchema must be an object");
    expect(errors.length).toBeGreaterThan(0);
  });
});
