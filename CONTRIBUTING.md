# Contributing to Goblin

Thank you for your interest in contributing to Goblin MCP Gateway! This document provides comprehensive guidelines for setting up your development environment and contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Getting Help](#getting-help)
- [Recognition](#recognition)
- [License](#license)

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and harassment-free environment for everyone.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8
- Git
- A GitHub account

## Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/goblin.git
cd goblin
```

### 2. Install Dependencies

```bash
bun install
```

This will automatically set up Husky git hooks via the `prepare` script.

### 3. Build the Project

```bash
bun run build
bun run build:cli
```

### 4. Verify Installation

Run the test suite to ensure everything is working:

```bash
bun run typecheck
bun run lint
bun test
```

### 5. Set Up Husky (Git Hooks)

Husky provides git hooks for quality checks before commits. If hooks weren't installed automatically:

```bash
bun run prepare
```

This configures git to use the hooks defined in `.husky/pre-commit`.

**Troubleshooting Husky:**

- **"bun: command not found: husky"**: Run `npm install --ignore-scripts` then `bun run prepare`
- **Permission Errors (Linux/macOS)**: Ensure your user has write permissions to the `.husky` directory
- **Line Ending Warnings (Windows)**: Configure git with `git config core.autocrlf false`

## Development Workflow

### Running in Development Mode

```bash
bun run dev  # Starts server with hot-reload
```

### Code Quality Commands

```bash
bun run lint        # Check for issues
bun run lint:fix    # Auto-fix issues
bun run format      # Format code
bun run typecheck   # TypeScript type checking
```

### Running Tests

```bash
bun test                    # All tests
bun test tests/unit         # Unit tests only
bun test tests/integration  # Integration tests only
bun test tests/e2e          # E2E tests only
bun test tests/smoke        # Smoke tests only
bun test tests/performance  # Performance tests only
bun test --watch            # Watch mode during development
```

### 1. OpenSpec First (For Features)

Goblin uses **OpenSpec** for spec-driven development. For new features or breaking changes:

1. **Read the OpenSpec Guide**
   ```bash
   cat openspec/AGENTS.md
   ```

2. **Check Existing Work**
   ```bash
   openspec list          # List active changes
   openspec list --specs  # List existing specs
   ```

3. **Create a Change Proposal**
   ```bash
   mkdir -p openspec/changes/add-feature-name/specs
   # Write proposal.md, tasks.md, and spec deltas
   # See openspec/AGENTS.md for format
   ```

4. **Validate Your Proposal**
   ```bash
   openspec validate add-feature-name --strict --no-interactive
   ```

5. **Wait for Approval**
   - Submit proposal as PR or discussion
   - Get maintainer approval before implementation

### 2. Implementation

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Follow Code Style** (See [AGENTS.md](AGENTS.md))
   - Use Biome for formatting
   - Follow TypeScript strict mode
   - Use `.js` extensions for local imports
   - Add JSDoc comments for public APIs
   - Use structured logging with Pino

3. **Write Tests**
   ```bash
   touch tests/unit/your-feature.test.ts
   bun test --watch  # Watch mode during development
   ```

4. **Update Documentation**
   - Update README.md if adding user-facing features
   - Update CHANGELOG.md with your changes
   - Add/update JSDoc comments

### 3. Quality Checks

Run all checks before submitting:

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Formatting
bun run format

# Tests
bun test

# Build verification
bun run build
```

All checks must pass before your PR can be merged. Pre-commit hooks will run these checks automatically.

### 4. Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples:**
```bash
git commit -m "feat(registry): add tool discovery endpoint"
git commit -m "fix(transport): handle connection timeout gracefully"
git commit -m "docs: update README with configuration examples"
```

**Skip hooks (not recommended):**
```bash
git commit --no-verify -m "message"
```

### 5. Submit Pull Request

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Link to OpenSpec proposal (if applicable)
   - Describe what changed and why
   - Add screenshots/examples if relevant

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Related Issues
   Fixes #123
   
   ## OpenSpec
   - [ ] Change proposal: `openspec/changes/add-feature-name/`
   - [ ] Proposal validated and approved
   
   ## Type of Change
   - [ ] Bug fix (non-breaking)
   - [ ] New feature (non-breaking)
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Checklist
   - [ ] Tests pass (`bun test`)
   - [ ] Type checking passes (`bun run typecheck`)
   - [ ] Linting passes (`bun run lint`)
   - [ ] Build succeeds (`bun run build`)
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   ```

## What to Contribute

### Good First Issues

Look for issues labeled:
- `good first issue` - Beginner-friendly
- `help wanted` - Contributions welcome
- `documentation` - Docs improvements

### Areas of Contribution

- **Bug Fixes**: Fix reported issues
- **Features**: Implement from OpenSpec proposals
- **Documentation**: Improve guides, examples, API docs
- **Tests**: Add test coverage
- **Performance**: Optimize hot paths
- **Examples**: Add example configurations or integrations

## Code Style Guidelines

See [AGENTS.md](AGENTS.md) for detailed guidelines. Key points:

### Formatting
- 2 space indentation
- 100 character line width
- Double quotes
- Semicolons always
- Trailing commas

### TypeScript
- Use `strict` mode
- Handle `undefined` from array access
- Use bracket notation for index signatures
- Prefer `type` imports for type-only imports
- Use `node:` protocol for built-ins

### Naming
- Files: `kebab-case.ts`
- Functions: `camelCase`
- Classes: `PascalCase`
- Types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Error Handling
```typescript
// Use unknown, then narrow
function handleError(error: unknown): void {
  if (error instanceof Error) {
    logger.error({ error }, "Error occurred");
  }
}

// Top-level catch pattern
main().catch((error: unknown) => {
  logger.error({ error }, "Fatal error");
  process.exit(1);
});
```

## Testing Guidelines

- Write tests for all new features
- Maintain existing test coverage
- Use descriptive test names
- Test edge cases and error conditions
- Run tests in watch mode during development

```typescript
import { test, expect, describe } from "bun:test";

describe("Feature Name", () => {
  test("should handle success case", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = yourFunction(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

### Test Coverage Requirements

Goblin enforces minimum test coverage through git hooks:

- **Pre-commit**: Warns if coverage drops below 70% (commit still allowed)
- **Pre-push**: Blocks push if coverage falls below 60%
- **CI**: Fails if coverage is below blocking threshold

#### Running Coverage Checks

```bash
# Run full coverage analysis
bun run coverage:analyze

# Run quick coverage check (exit code reflects threshold)
bun run coverage:check

# View detailed coverage report
bun run coverage:report
```

#### Configuring Coverage

Edit `coverage.config.json` to customize:

```json
{
  "thresholds": {
    "warning": 70,
    "blocking": 60
  },
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.ts"
  ]
}
```

#### Troubleshooting Coverage

- **Coverage too low for new files**: Add tests for new source files
- **Excluded files still showing**: Check glob patterns in `coverage.config.json`
- **Coverage differs locally vs CI**: Ensure consistent Bun versions

## Documentation Guidelines

- Write clear, concise documentation
- Include code examples
- Update README.md for user-facing changes
- Use JSDoc for public APIs
- Keep AGENTS.md updated for tooling changes

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/TalkingThreads/goblin/discussions)
- **Bugs**: [GitHub Issues](https://github.com/TalkingThreads/goblin/issues)

## Recognition

Contributors are recognized in:
- Release notes
- CHANGELOG.md
- GitHub contributors page

Exceptional contributors may be invited to become maintainers (see [MAINTAINERS.md](MAINTAINERS.md)).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Goblin! 🎉
