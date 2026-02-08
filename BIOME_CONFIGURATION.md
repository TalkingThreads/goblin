# Biome Configuration Guide for Goblin

# This document explains the Biome configuration and best practices

## Overview

Biome is a fast, opinionated linter and formatter for JavaScript, TypeScript, JSX, and JSON.
It is a unified toolchain for code quality, replacing ESLint, Prettier, and other tools.

## Quick Start

```bash
# Install dependencies (includes lefthook)
bun install

# Install git hooks
bun run prepare

# Run biome check (lint + format check)
bun run lint

# Auto-fix issues
bun run lint:fix

# Check formatting
bun run format:check

# Format code
bun run format
```

## Configuration Files

### biome.json

The main configuration file for Biome. It includes:

- **VCS Integration**: Git integration for tracking changed files
- **File Patterns**: Which files to process
- **Formatter**: Code formatting rules (indent style, line width, etc.)
- **Linter**: Code quality rules organized by category
- **JavaScript/TypeScript**: Language-specific settings
- **Overrides**: Per-directory configuration (e.g., relaxed rules for tests)

### .husky/pre-commit

Git hook configured with Husky + lint-staged for pre-commit checks.

### .vscode/settings.json

VS Code workspace settings for:

- Format on save
- Code actions on save (fix all, organize imports)
- Biome extension configuration

### .zed/settings.json

Zed editor settings for:

- LSP configuration for Biome
- Language-specific formatting rules
- Code actions on format

## Package.json Scripts

| Script | Description |
|--------|-------------|
| `bun run lint` | Run biome check (lint + assist) |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run lint:ci` | CI-mode check (no fixes) |
| `bun run format` | Format code |
| `bun run format:diff` | Show formatting diff |
| `bun run check` | Run lint + format (with fixes) |
| `bun run check:fix` | Fix lint + format issues |
| `bun run check:ci` | Full CI check (no fixes) |
| `bun run typecheck` | TypeScript type checking |

## Linter Rules

Biome groups linter rules into categories:

### Recommended (enabled by default)

- **correctness**: Code that is guaranteed to be incorrect
- **style**: Code style and consistency
- **complexity**: Code that could be simplified
- **suspicious**: Code that looks incorrect
- **security**: Potential security issues
- **performance**: Performance improvements
- **accessibility**: Accessibility concerns

### Goblin Customizations

#### Stricter Rules (error level)

- `noUnusedImports`: No unused imports allowed
- `noUnusedVariables`: No unused variables allowed
- `useConst`: Prefer const over let
- `useImportType`: Use TypeScript import type syntax
- `useNodejsImportProtocol`: Use node: protocol for Node.js built-ins
- `noConfusingVoidType`: Avoid confusing void type usage
- `noRedeclare`: No duplicate variable declarations
- `noDuplicateCase`: No duplicate case labels
- `useIsArray`: Use Array.isArray() instead of instanceof

#### Relaxed Rules (warn/off for tests)

- Test files (`tests/**/*`):
  - `noUnusedImports`: Off (fixtures may import unused items)
  - `noUnusedVariables`: Off (test setup may define unused variables)
  - `noNonNullAssertion`: Off (tests may use non-null assertions)
  - `noExplicitAny`: Off (tests may use any for simplicity)

#### Nursery Rules (disabled by default)

New rules that are still under development. Must be explicitly enabled.

## Editor Integration

### VS Code

1. Install the Biome extension:
   - VS Code: [Biome - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
   - VSCodium: [Open VSX Registry](https://open-vsx.org/extension/biomejs/biome)

2. Open the workspace - settings should load automatically

3. Recommended settings are in `.vscode/settings.json`:
   - Format on save enabled
   - Organize imports on save
   - Biome as default formatter

### Zed

Biome is built into Zed (v0.131.0+). Settings are in `.zed/settings.json`:

- Biome LSP is automatically configured
- Format on save enabled
- Code actions on format configured

## CI Integration

The GitHub Actions workflow (`.github/workflows/quality.yml`) runs:

1. **Biome Check**: Lint + format validation
2. **TypeScript Check**: Type safety validation
3. **Additional Linting**: Extended linting
4. **Formatting Check**: Format validation

## Git Hooks

Husky + lint-staged runs the following hooks:

### pre-commit

Runs lint-staged which checks only staged files for faster commits:

```bash
npx lint-staged
```

Configuration in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,jsonc}": [
      "biome check --staged --files-ignore-unknown=true --no-errors-on-unmatched"
    ]
  }
}
```

### Setup

```bash
# Install dependencies (runs prepare script automatically)
bun install

# This initializes:
# - husky install
# - lint-staged configuration
```

### Manual Setup (if needed)

```bash
# Initialize husky
husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/../.."
npx lint-staged
EOF
chmod +x .husky/pre-commit
```

## Troubleshooting

### Biome not formatting on save

1. Check VS Code settings: `editor.formatOnSave` should be `true`
2. Check Biome extension is installed
3. Check `.vscode/settings.json` has Biome as default formatter

### Linter errors not showing

1. Run `bun run lint` to see all errors
2. Check `biome.json` linter rules are not set to `"off"`
3. Check file patterns in `files.includes` match your files

### TypeScript errors after lint fix

If you see new TypeScript errors after running `lint:fix`:

1. Run `bun run typecheck` to see TypeScript errors
2. Some Biome fixes may expose TypeScript issues that were masked

## Best Practices

1. **Run format before commit**: `bun run check:fix` ensures code is properly formatted
2. **Use type imports**: Use `import type { Foo }` for types only
3. **Avoid `any`**: Use specific types or `unknown` instead
4. **Use const assertions**: `as const` for literal values
5. **Avoid non-null assertions**: Use optional chaining or nullish coalescing
6. **Organize imports**: Let Biome handle import sorting
7. **Write self-documenting code**: Don't overuse comments

## Migration from ESLint/Prettier

Biome is designed to be compatible with most ESLint and Prettier configurations:

- Similar rule names where possible
- Compatible formatting options
- Gradual migration possible (run alongside existing tools)

Run `bun run biome migrate eslint` to import ESLint rules.

## Further Reading

- [Biome Documentation](https://biomejs.dev/)
- [Linter Rules](https://biomejs.dev/linter/)
- [Formatter Options](https://biomejs.dev/formatter/)
- [CLI Reference](https://biomejs.dev/reference/cli/)
