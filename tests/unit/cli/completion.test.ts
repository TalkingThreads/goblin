import { describe, expect, test } from "bun:test";
import { generateBashCompletion } from "../../../src/cli/completion/bash.js";
import { generateFishCompletion } from "../../../src/cli/completion/fish.js";
import { generateZshCompletion } from "../../../src/cli/completion/zsh.js";

describe("Bash Completion", () => {
  test("generates bash completion script", () => {
    const script = generateBashCompletion();
    expect(script).toContain("_goblin_completions");
    expect(script).toContain("complete -F _goblin_completions goblin");
  });

  test("includes all top-level commands", () => {
    const script = generateBashCompletion();
    expect(script).toContain("stdio");
    expect(script).toContain("start");
    expect(script).toContain("status");
    expect(script).toContain("stop");
    expect(script).toContain("health");
    expect(script).toContain("servers");
    expect(script).toContain("tools");
    expect(script).toContain("config");
    expect(script).toContain("logs");
    expect(script).toContain("help");
    expect(script).toContain("version");
  });

  test("includes servers subcommands", () => {
    const script = generateBashCompletion();
    expect(script).toContain("add");
    expect(script).toContain("remove");
    expect(script).toContain("enable");
    expect(script).toContain("disable");
    expect(script).toContain("list");
    expect(script).toContain("details");
  });

  test("includes tools subcommands", () => {
    const script = generateBashCompletion();
    expect(script).toContain("list");
    expect(script).toContain("invoke");
    expect(script).toContain("describe");
    expect(script).toContain("search");
  });

  test("includes config subcommands", () => {
    const script = generateBashCompletion();
    expect(script).toContain("validate");
    expect(script).toContain("show");
  });

  test("includes global flags", () => {
    const script = generateBashCompletion();
    expect(script).toContain("--help");
    expect(script).toContain("--version");
    expect(script).toContain("--verbose");
    expect(script).toContain("--json");
    expect(script).toContain("--config");
    expect(script).toContain("--port");
    expect(script).toContain("--host");
  });

  test("includes bash completion function", () => {
    const script = generateBashCompletion();
    expect(script).toContain("_goblin_completions()");
    expect(script).toContain("COMPREPLY");
    expect(script).toContain("compgen");
    expect(script).toContain("complete -F");
  });
});

describe("Zsh Completion", () => {
  test("generates zsh completion script", () => {
    const script = generateZshCompletion();
    expect(script).toContain("#compdef goblin");
    expect(script).toContain("_goblin");
  });

  test("includes all top-level commands", () => {
    const script = generateZshCompletion();
    expect(script).toContain("stdio");
    expect(script).toContain("start");
    expect(script).toContain("status");
    expect(script).toContain("stop");
    expect(script).toContain("servers");
    expect(script).toContain("tools");
    expect(script).toContain("config");
  });

  test("includes command descriptions", () => {
    const script = generateZshCompletion();
    expect(script).toContain("Run in STDIO mode");
    expect(script).toContain("Start the gateway");
    expect(script).toContain("Show gateway status");
  });

  test("includes global flags with descriptions", () => {
    const script = generateZshCompletion();
    expect(script).toContain("--help");
    expect(script).toContain("Show help");
    expect(script).toContain("--verbose");
    expect(script).toContain("Enable verbose logging");
  });

  test("includes subcommand handlers", () => {
    const script = generateZshCompletion();
    expect(script).toContain("_goblin_servers");
    expect(script).toContain("_goblin_tools");
    expect(script).toContain("_goblin_config");
  });
});

describe("Fish Completion", () => {
  test("generates fish completion script", () => {
    const script = generateFishCompletion();
    expect(script).toContain("complete -c goblin");
  });

  test("includes all top-level commands", () => {
    const script = generateFishCompletion();
    expect(script).toContain("stdio");
    expect(script).toContain("start");
    expect(script).toContain("status");
    expect(script).toContain("stop");
    expect(script).toContain("servers");
    expect(script).toContain("tools");
    expect(script).toContain("config");
  });

  test("includes command descriptions", () => {
    const script = generateFishCompletion();
    expect(script).toContain('-d "Run in STDIO mode"');
    expect(script).toContain('-d "Start the gateway"');
  });

  test("includes subcommand completions", () => {
    const script = generateFishCompletion();
    expect(script).toContain("__fish_seen_subcommand_from servers");
    expect(script).toContain("__fish_seen_subcommand_from tools");
    expect(script).toContain("__fish_seen_subcommand_from config");
  });

  test("includes global flags", () => {
    const script = generateFishCompletion();
    expect(script).toContain("-s h -l help");
    expect(script).toContain("-s v -l version");
    expect(script).toContain("-l verbose");
    expect(script).toContain("-l json");
  });

  test("disables file completions", () => {
    const script = generateFishCompletion();
    expect(script).toContain("complete -c goblin -f");
  });
});

describe("Completion Command Structure", () => {
  test("all shells have consistent command coverage", () => {
    const bash = generateBashCompletion();
    const zsh = generateZshCompletion();
    const fish = generateFishCompletion();

    const commands = ["stdio", "start", "status", "servers", "tools", "config"];

    for (const cmd of commands) {
      expect(bash).toContain(cmd);
      expect(zsh).toContain(cmd);
      expect(fish).toContain(cmd);
    }
  });

  test("all shells have subcommand coverage", () => {
    const bash = generateBashCompletion();
    const zsh = generateZshCompletion();
    const fish = generateFishCompletion();

    const subcommands = ["add", "remove", "list", "invoke", "validate"];

    for (const subcmd of subcommands) {
      expect(bash).toContain(subcmd);
      expect(zsh).toContain(subcmd);
      expect(fish).toContain(subcmd);
    }
  });
});
