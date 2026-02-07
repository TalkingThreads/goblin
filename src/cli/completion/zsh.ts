export function generateZshCompletion(): string {
  return `#compdef goblin

# Goblin CLI Zsh Completion

local curcontext="$curcontext" state line

typeset -A opt_args

_goblin_commands() {
    local commands
    commands=(
        'stdio:Run in STDIO mode'
        'start:Start the gateway'
        'status:Show gateway status'
        'stop:Stop the gateway'
        'health:Show health status'
        'servers:Manage servers'
        'tools:Manage tools'
        'config:Manage configuration'
        'logs:View logs'
        'help:Show help'
        'version:Show version'
    )
    _describe -t commands 'goblin command' commands "$@"
}

_goblin_servers() {
    local subcommands
    subcommands=(
        'add:Add a new server'
        'remove:Remove a server'
        'enable:Enable a server'
        'disable:Disable a server'
        'list:List servers'
        'details:Show server details'
    )
    _describe -t commands 'servers subcommand' subcommands "$@"
}

_goblin_tools() {
    local subcommands
    subcommands=(
        'list:List available tools'
        'invoke:Invoke a tool'
        'describe:Describe a tool'
        'search:Search for tools'
    )
    _describe -t commands 'tools subcommand' subcommands "$@"
}

_goblin_config() {
    local subcommands
    subcommands=(
        'validate:Validate configuration'
        'show:Show configuration'
    )
    _describe -t commands 'config subcommand' subcommands "$@"
}

_goblin() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-v --version)'{-v,--version}'[Show version]' \\
        '--verbose[Enable verbose logging]' \\
        '--json[Output in JSON format]' \\
        '--config[Config file path]:config:_files' \\
        '--port[Gateway port]:port:' \\
        '--host[Gateway host]:host:' \\
        '1: :_goblin_commands' \\
        '*:: :->args'

    case "$line[1]" in
        servers)
            _goblin_servers
            ;;
        tools)
            _goblin_tools
            ;;
        config)
            _goblin_config
            ;;
    esac
}

_goblin "$@"
`;
}
