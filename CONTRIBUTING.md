# Developer Setup Guide

This guide covers setting up your development environment for contributing to Goblin.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.8
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/TalkingThreads/goblin.git
cd goblin
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Husky (Git Hooks)

Husky provides git hooks for quality checks before commits. Run the following command once to enable them:

```bash
npx husky install
```

This will create the `.husky/` directory and configure git to use the hooks defined in `.husky/pre-commit`.

**Note:** If you encounter issues with `npx husky install`, you can also install husky globally:

```bash
npm install -g husky
husky install
```

### 4. Build the Project

```bash
bun run build
```

### 5. Verify Installation

Run the test suite to ensure everything is working:

```bash
bun test
```

## Development Workflow

### Running in Development Mode

```bash
bun run dev
```

This starts the server with hot-reload enabled.

### Running Tests

```bash
bun test                    # All tests
bun test tests/unit        # Unit tests only
bun test tests/integration  # Integration tests only
bun test tests/e2e         # E2E tests only
bun test tests/smoke        # Smoke tests only
bun test tests/performance  # Performance tests only
```

### Code Quality

```bash
bun run lint               # Check for issues
bun run lint:fix           # Auto-fix issues
bun run format             # Format code
bun run typecheck          # TypeScript type checking
```

### Building

```bash
bun run build              # Build for production
bun run build:cli          # Build CLI only
bun run build:analyze      # Build with bundle analysis
```

## Git Hooks

Goblin uses husky to run quality checks before commits:

- **pre-commit**: Runs biome linting and type checking
- **pre-commit-auto-fix**: Auto-formats code before commit

To skip hooks (not recommended):

```bash
git commit --no-verify -m "message"
```

## CI/CD Considerations

When running in CI/CD pipelines, hooks may not be needed. To install dependencies without running husky:

```bash
npm install --ignore-scripts
```

Then run build and tests manually in your CI configuration.

## Troubleshooting

### "bun: command not found: husky"

This happens during `npm install` if husky's `prepare` script runs before dependencies are installed. To fix:

```bash
npm install --ignore-scripts
npx husky install
```

### Line Ending Warnings (Windows)

If you see LF/CRLF warnings, configure git to handle line endings:

```bash
git config core.autocrlf false
```

### Permission Errors with Husky (Linux/macOS)

```bash
sudo npx husky install
```

Or ensure your user has write permissions to the `.husky` directory.
