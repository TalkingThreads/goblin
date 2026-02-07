export function generateBashCompletion(): string {
  return `# Goblin CLI Bash Completion
# Source this file: eval "$(goblin completion bash)"

_goblin_completions() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Top-level commands
    local commands="stdio start status stop health servers tools config logs help version complete"

    # Subcommands for servers
    local servers_subcommands="add remove enable disable list details"

    # Subcommands for tools
    local tools_subcommands="list invoke describe search"

    # Subcommands for config
    local config_subcommands="validate show"

    # Subcommands for complete
    local complete_subcommands="servers tools"

    # Global flags
    local global_flags="--help --version --verbose --json --config --port --host"

    # Complete based on position
    if [[ \${COMP_CWORD} -eq 1 ]]; then
        # First argument - complete commands
        COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
        return 0
    fi

    # Complete subcommands
    case "\${COMP_WORDS[1]}" in
        servers)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( $(compgen -W "\${servers_subcommands}" -- "\${cur}") )
                return 0
            fi
            # Dynamic server name completion for certain subcommands
            if [[ \${COMP_CWORD} -eq 3 ]]; then
                case "\${COMP_WORDS[2]}" in
                    remove|enable|disable|details)
                        local servers=$(goblin complete servers 2>/dev/null)
                        if [[ -n "$servers" ]]; then
                            COMPREPLY=( $(compgen -W "$servers" -- "\${cur}") )
                            return 0
                        fi
                        ;;
                esac
            fi
            ;;
        tools)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( $(compgen -W "\${tools_subcommands}" -- "\${cur}") )
                return 0
            fi
            # Dynamic tool name completion for certain subcommands
            if [[ \${COMP_CWORD} -eq 3 ]]; then
                case "\${COMP_WORDS[2]}" in
                    invoke|describe)
                        local tools=$(goblin complete tools 2>/dev/null)
                        if [[ -n "$tools" ]]; then
                            COMPREPLY=( $(compgen -W "$tools" -- "\${cur}") )
                            return 0
                        fi
                        ;;
                esac
            fi
            ;;
        config)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( $(compgen -W "\${config_subcommands}" -- "\${cur}") )
                return 0
            fi
            ;;
        complete)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( $(compgen -W "\${complete_subcommands}" -- "\${cur}") )
                return 0
            fi
            ;;
    esac

    # Complete flags for any command
    if [[ "\${cur}" == -* ]]; then
        COMPREPLY=( $(compgen -W "\${global_flags}" -- "\${cur}") )
        return 0
    fi

    return 0
}

complete -F _goblin_completions goblin
`;
}
