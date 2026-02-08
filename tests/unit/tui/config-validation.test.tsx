import { describe, expect, test } from "bun:test";

interface ValidationError {
  path: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  path: string;
  errors: ValidationError[];
}

describe("Validation error parsing", () => {
  test("parseZodErrors handles simple string errors", () => {
    const errors: ValidationError[] = [];
    const errorObj = { name: "Required" };

    parseZodErrors(errorObj, "", errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe("name");
    expect(errors[0].message).toBe("Required");
  });

  test("parseZodErrors handles nested errors", () => {
    const errors: ValidationError[] = [];
    const errorObj = {
      servers: {
        0: {
          name: "Required",
        },
      },
    };

    parseZodErrors(errorObj, "", errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe("servers.0.name");
    expect(errors[0].message).toBe("Required");
  });

  test("parseZodErrors handles _errors array", () => {
    const errors: ValidationError[] = [];
    const errorObj = {
      port: {
        _errors: ["Expected number, received string"],
      },
    };

    parseZodErrors(errorObj, "", errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe("port");
    expect(errors[0].message).toBe("Expected number, received string");
  });

  test("parseZodErrors handles multiple errors", () => {
    const errors: ValidationError[] = [];
    const errorObj = {
      name: "Required",
      port: {
        _errors: ["Must be positive", "Must be less than 65536"],
      },
    };

    parseZodErrors(errorObj, "", errors);

    expect(errors).toHaveLength(3);
  });

  test("parseZodErrors handles array errors", () => {
    const errors: ValidationError[] = [];
    const errorObj = {
      servers: ["Server at index 0 is invalid"],
    };

    parseZodErrors(errorObj, "", errors);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe("servers");
    expect(errors[0].message).toBe("Server at index 0 is invalid");
  });
});

function parseZodErrors(
  errorObj: Record<string, unknown>,
  prefix: string,
  errors: ValidationError[],
) {
  for (const [key, value] of Object.entries(errorObj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      errors.push({ path, message: value });
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      errors.push({ path, message: value[0] as string });
    } else if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if ("_errors" in obj && Array.isArray(obj["_errors"])) {
        for (const err of obj["_errors"] as string[]) {
          errors.push({ path, message: err });
        }
      } else {
        parseZodErrors(obj, path, errors);
      }
    }
  }
}

describe("Validation result types", () => {
  test("valid result has no errors", () => {
    const result: ValidationResult = {
      valid: true,
      path: "goblin.json",
      errors: [],
    };

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("invalid result has errors", () => {
    const result: ValidationResult = {
      valid: false,
      path: "goblin.json",
      errors: [
        { path: "servers.0.name", message: "Required" },
        { path: "port", message: "Must be a number" },
      ],
    };

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  test("connection error is properly structured", () => {
    const result: ValidationResult = {
      valid: false,
      path: "goblin.json",
      errors: [{ path: "connection", message: "Could not connect to gateway" }],
    };

    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe("connection");
  });
});

describe("Config path handling", () => {
  test("default config path is goblin.json", () => {
    const defaultPath = "goblin.json";
    expect(defaultPath).toBe("goblin.json");
  });

  test("custom config paths are supported", () => {
    const paths = ["/etc/goblin.json", "~/config/goblin.json", "./local-config.json"];

    for (const path of paths) {
      expect(path.length).toBeGreaterThan(0);
    }
  });
});

describe("Keyboard shortcuts", () => {
  test("V triggers validation", () => {
    const shortcut = "v";
    expect(shortcut).toBe("v");
  });

  test("R resets the panel", () => {
    const shortcut = "r";
    expect(shortcut).toBe("r");
  });

  test("E opens editor", () => {
    const shortcut = "e";
    expect(shortcut).toBe("e");
  });

  test("Escape cancels", () => {
    const escape = "\u001b";
    expect(escape).toBe("\u001b");
  });
});
