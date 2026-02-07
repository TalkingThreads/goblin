export function generateFishCompletion(): string {
  return `# Goblin CLI Fish Completion

# Disable file completions for the goblin command
complete -c goblin -f

# Top-level commands
complete -c goblin -n "__fish_use_subcommand" -a "stdio" -d "Run in STDIO mode"
complete -c goblin -n "__fish_use_subcommand" -a "start" -d "Start the gateway"
complete -c goblin -n "__fish_use_subcommand" -a "status" -d "Show gateway status"
complete -c goblin -n "__fish_use_subcommand" -a "stop" -d "Stop the gateway"
complete -c goblin -n "__fish_use_subcommand" -a "health" -d "Show health status"
complete -c goblin -n "__fish_use_subcommand" -a "servers" -d "Manage servers"
complete -c goblin -n "__fish_use_subcommand" -a "tools" -d "Manage tools"
complete -c goblin -n "__fish_use_subcommand" -a "config" -d "Manage configuration"
complete -c goblin -n "__fish_use_subcommand" -a "logs" -d "View logs"
complete -c goblin -n "__fish_use_subcommand" -a "help" -d "Show help"
complete -c goblin -n "__fish_use_subcommand" -a "version" -d "Show version"

# Servers subcommands
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "add" -d "Add a new server"
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "remove" -d "Remove a server"
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "enable" -d "Enable a server"
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "disable" -d "Disable a server"
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "list" -d "List servers"
complete -c goblin -n "__fish_seen_subcommand_from servers" -a "details" -d "Show server details"

# Tools subcommands
complete -c goblin -n "__fish_seen_subcommand_from tools" -a "list" -d "List available tools"
complete -c goblin -n "__fish_seen_subcommand_from tools" -a "invoke" -d "Invoke a tool"
complete -c goblin -n "__fish_seen_subcommand_from tools" -a "describe" -d "Describe a tool"
complete -c goblin -n "__fish_seen_subcommand_from tools" -a "search" -d "Search for tools"

# Config subcommands
complete -c goblin -n "__fish_seen_subcommand_from config" -a "validate" -d "Validate configuration"
complete -c goblin -n "__fish_seen_subcommand_from config" -a "show" -d "Show configuration"

# Global flags
complete -c goblin -n "__fish_use_subcommand" -s h -l help -d "Show help"
complete -c goblin -n "__fish_use_subcommand" -s v -l version -d "Show version"
complete -c goblin -n "__fish_use_subcommand" -l verbose -d "Enable verbose logging"
complete -c goblin -n "__fish_use_subcommand" -l json -d "Output in JSON format"
complete -c goblin -n "__fish_use_subcommand" -l config -d "Config file path" -r
complete -c goblin -n "__fish_use_subcommand" -l port -d "Gateway port" -r
complete -c goblin -n "__fish_use_subcommand" -l host -d "Gateway host" -r
`;
}
