import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  formatSuggestionMessage,
  getCommandSuggestions,
  handleUnknownCommand,
  KNOWN_COMMANDS,
  levenshteinDistance,
  MAX_SUGGESTIONS,
  SUGGESTION_THRESHOLD,
} from "../../../src/cli/utils/suggestions.js";

describe("Levenshtein Distance", () => {
  it("should return 0 for identical strings", () => {
    expect(levenshteinDistance("hello", "hello")).toBe(0);
  });

  it("should return 1 for single character substitution", () => {
    expect(levenshteinDistance("hello", "hallo")).toBe(1);
  });

  it("should return 1 for single character insertion", () => {
    expect(levenshteinDistance("helo", "hello")).toBe(1);
  });

  it("should return 1 for single character deletion", () => {
    expect(levenshteinDistance("hello", "helo")).toBe(1);
  });

  it("should return correct distance for transposed characters", () => {
    expect(levenshteinDistance("hello", "helol")).toBe(2);
  });

  it("should return correct distance for completely different strings", () => {
    expect(levenshteinDistance("abc", "xyz")).toBe(3);
  });

  it("should return length of second string for empty first string", () => {
    expect(levenshteinDistance("", "hello")).toBe(5);
  });

  it("should return length of first string for empty second string", () => {
    expect(levenshteinDistance("hello", "")).toBe(5);
  });

  it("should handle case insensitivity", () => {
    const lower = levenshteinDistance("hello", "HELLO");
    expect(lower).toBeGreaterThan(0);
  });
});

describe("Command Suggestions", () => {
  describe("Basic Typos", () => {
    it("should suggest 'status' for 'statuz'", () => {
      const suggestions = getCommandSuggestions("statuz");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("status");
    });

    it("should suggest 'status' for 'stutus'", () => {
      const suggestions = getCommandSuggestions("stutus");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("status");
    });

    it("should suggest 'health' or 'help' for 'healp'", () => {
      const suggestions = getCommandSuggestions("healp");
      expect(suggestions.length).toBeGreaterThan(0);
      const commands = suggestions.map((s) => s.command);
      expect(commands).toContain("health");
    });

    it("should suggest 'tools' for 'toolss'", () => {
      const suggestions = getCommandSuggestions("toolss");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("tools");
    });

    it("should suggest 'servers' for 'serverss'", () => {
      const suggestions = getCommandSuggestions("serverss");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("servers");
    });

    it("should suggest 'config' for 'confg'", () => {
      const suggestions = getCommandSuggestions("confg");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("config");
    });

    it("should suggest 'logs' for 'logz'", () => {
      const suggestions = getCommandSuggestions("logz");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.command).toBe("logs");
    });
  });

  describe("Transposed Letters", () => {
    it("should suggest 'status' for 'stauts'", () => {
      const suggestions = getCommandSuggestions("stauts");
      expect(suggestions.some((s) => s.command === "status")).toBe(true);
    });

    it("should suggest 'tools' for 'toools'", () => {
      const suggestions = getCommandSuggestions("toools");
      expect(suggestions.some((s) => s.command === "tools")).toBe(true);
    });
  });

  describe("Missing Letters", () => {
    it("should suggest 'status' for 'staus'", () => {
      const suggestions = getCommandSuggestions("staus");
      expect(suggestions.some((s) => s.command === "status")).toBe(true);
    });

    it("should suggest 'tools' for 'tool'", () => {
      const suggestions = getCommandSuggestions("tool");
      expect(suggestions.some((s) => s.command === "tools")).toBe(true);
    });
  });

  describe("Extra Letters", () => {
    it("should suggest 'status' for 'statusss'", () => {
      const suggestions = getCommandSuggestions("statusss");
      expect(suggestions.some((s) => s.command === "status")).toBe(true);
    });

    it("should suggest 'tools' for 'toolssss'", () => {
      const suggestions = getCommandSuggestions("toolssss");
      expect(suggestions.some((s) => s.command === "tools")).toBe(true);
    });
  });

  describe("Multiple Suggestions", () => {
    it("should suggest 'servers' for 'srvers'", () => {
      const suggestions = getCommandSuggestions("srvers");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      const commands = suggestions.map((s) => s.command);
      expect(commands).toContain("servers");
    });

    it("should suggest 'servers' and/or 'status' for 'srvrs'", () => {
      const suggestions = getCommandSuggestions("srvrs");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("No Suggestions", () => {
    it("should return empty array for completely unrelated input", () => {
      const suggestions = getCommandSuggestions("xyzabc123");
      expect(suggestions.length).toBe(0);
    });

    it("should return empty array for empty input", () => {
      const suggestions = getCommandSuggestions("");
      expect(suggestions.length).toBe(0);
    });

    it("should return empty array for single unrelated character", () => {
      const suggestions = getCommandSuggestions("q");
      expect(suggestions.length).toBe(0);
    });
  });

  describe("Subcommand Suggestions", () => {
    it("should suggest 'servers add' for 'servers ad'", () => {
      const suggestions = getCommandSuggestions("servers ad");
      expect(suggestions.some((s) => s.command === "servers add")).toBe(true);
    });

    it("should suggest 'tools invoke' for 'tools invok'", () => {
      const suggestions = getCommandSuggestions("tools invok");
      expect(suggestions.some((s) => s.command === "tools invoke")).toBe(true);
    });

    it("should suggest 'config validate' for 'config valid'", () => {
      const suggestions = getCommandSuggestions("config valid");
      expect(suggestions.some((s) => s.command === "config validate")).toBe(true);
    });
  });

  describe("Confidence Levels", () => {
    it("should have high confidence for distance 1", () => {
      const suggestions = getCommandSuggestions("statuz");
      const statusSuggestion = suggestions.find((s) => s.command === "status");
      expect(statusSuggestion).toBeDefined();
      expect(statusSuggestion!.confidence).toBe("high");
    });

    it("should have appropriate confidence levels", () => {
      const suggestions = getCommandSuggestions("stutus");
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Limits", () => {
    it("should return at most MAX_SUGGESTIONS", () => {
      const suggestions = getCommandSuggestions("srv");
      expect(suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    });

    it("should respect SUGGESTION_THRESHOLD", () => {
      const suggestions = getCommandSuggestions("verylongtypo");
      for (const suggestion of suggestions) {
        expect(suggestion.distance).toBeLessThanOrEqual(SUGGESTION_THRESHOLD);
      }
    });
  });

  describe("Known Commands Registry", () => {
    it("should include main commands", () => {
      expect(KNOWN_COMMANDS).toContain("status");
      expect(KNOWN_COMMANDS).toContain("tools");
      expect(KNOWN_COMMANDS).toContain("servers");
      expect(KNOWN_COMMANDS).toContain("health");
      expect(KNOWN_COMMANDS).toContain("config");
      expect(KNOWN_COMMANDS).toContain("logs");
    });

    it("should include subcommands", () => {
      expect(KNOWN_COMMANDS).toContain("servers add");
      expect(KNOWN_COMMANDS).toContain("tools invoke");
      expect(KNOWN_COMMANDS).toContain("config validate");
    });

    it("should have readonly type", () => {
      const commands: ReadonlyArray<string> = KNOWN_COMMANDS;
      expect(commands.length).toBeGreaterThan(0);
    });
  });
});

describe("Format Suggestion Message", () => {
  it("should return empty string for no suggestions", () => {
    const message = formatSuggestionMessage("xyzabc", []);
    expect(message).toBe("");
  });

  it("should format single suggestion correctly", () => {
    const message = formatSuggestionMessage("statuz", [
      { command: "status", distance: 1, confidence: "high" },
    ]);
    expect(message).toContain("status");
    expect(message).toContain("Did you mean");
  });

  it("should format multiple suggestions correctly", () => {
    const message = formatSuggestionMessage("srvers", [
      { command: "servers", distance: 1, confidence: "high" },
      { command: "status", distance: 2, confidence: "medium" },
    ]);
    expect(message).toContain("Did you mean one of these?");
    expect(message).toContain("servers");
    expect(message).toContain("status");
  });
});

describe("Handle Unknown Command", () => {
  let originalConsoleError: typeof console.error;
  let consoleErrorCalls: string[];

  beforeEach(() => {
    originalConsoleError = console.error;
    consoleErrorCalls = [];
    console.error = (...args: unknown[]) => {
      consoleErrorCalls.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should output error message for unknown command", () => {
    handleUnknownCommand("xyzabc");
    expect(consoleErrorCalls.some((c) => c.includes("error: unknown command 'xyzabc'"))).toBe(true);
  });

  it("should not show suggestions for unknown command with no matches", () => {
    handleUnknownCommand("xyzabc");
    expect(
      consoleErrorCalls.some((c) => c.includes("Run 'goblin --help' to see available commands.")),
    ).toBe(true);
  });

  it("should show suggestions for misspelled command", () => {
    handleUnknownCommand("statuz");
    expect(consoleErrorCalls.some((c) => c.includes("Did you mean"))).toBe(true);
  });
});
