import { Command } from "commander";
import { generateBashCompletion } from "../completion/bash.js";
import { generateFishCompletion } from "../completion/fish.js";
import { generateZshCompletion } from "../completion/zsh.js";

export function createCompletionCommand(): Command {
  const command = new Command("completion");

  command.description("Generate shell completion scripts");

  command
    .command("bash")
    .description("Generate bash completion script")
    .action(() => {
      console.log(generateBashCompletion());
    });

  command
    .command("zsh")
    .description("Generate zsh completion script")
    .action(() => {
      console.log(generateZshCompletion());
    });

  command
    .command("fish")
    .description("Generate fish completion script")
    .action(() => {
      console.log(generateFishCompletion());
    });

  return command;
}
