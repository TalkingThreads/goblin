# Quality Assurance Runbook

This runbook provides guidance for managing and troubleshooting the Goblin project's quality assurance system.

## Table of Contents

- [Pre-commit Hooks](#pre-commit-hooks)
- [CI Workflows](#ci-workflows)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Pre-commit Hooks

### How Hooks Work

Pre-commit hooks are managed by [Husky](https://typicode.github.io/husky/) and configured in `.husky/pre-commit`.

**Hook execution order:**
1. TypeScript type checking (`bun run typecheck`)
2. Biome linting (`bun run lint`)
3. Unit tests (`bun test tests/unit/`)
4. Agent compliance checks (`tools/agents-guard/check.sh`)

### How to Add a New Pre-commit Hook

1. Edit `.husky/pre-commit`:

```bash
# Add your hook before the final success message
echo "📝 Running custom check..."
./tools/custom-check.sh
if [ $? -ne 0 ]; then
  echo "❌ Custom check failed"
  exit 1
fi
```

2. Make your script executable:

```bash
chmod +x tools/custom-check.sh
```

3. Test the hook:

```bash
.git/hooks/pre-commit
```

### How to Temporarily Disable Hooks

**For a single commit (not recommended):**
```bash
git commit --no-verify -m "your message"
```

**For all commits (emergency only):**
```bash
# Remove the pre-commit hook
rm .husky/pre-commit

# Re-enable later by restoring from git
git checkout .husky/pre-commit
```

## CI Workflows

### Workflow Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Build & Lint | `.github/workflows/main.yml` | PR, push | Build, typecheck, lint |
| Tests | `.github/workflows/tests.yml` | PR, push | Unit & integration tests |
| Smoke Tests | `.github/workflows/smoke-tests.yml` | PR, push | CLI smoke tests |
| Changelog | `.github/workflows/changelog.yml` | PR | Validate CHANGELOG.md |
| Performance | `.github/workflows/performance-tests.yml` | Manual | Performance benchmarks |

### Dependency Caching

All workflows use Bun dependency caching:

```yaml
- name: Cache Bun dependencies
  uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb', '**/package.json') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

**Cache hit rate:** Should be >90% for PRs that don't modify package.json

### How to Clear CI Cache

If you need to clear the cache:

1. Go to GitHub Actions → Caches
2. Find caches matching your repository
3. Delete the relevant cache entries
4. Re-run the workflow

Or update the cache key in the workflow file temporarily.

## Smart Test Selection

### How It Works

The `tools/ci/affected-tests.sh` script maps changed files to relevant tests:

| Changed Files | Tests Run |
|---------------|-----------|
| `src/config/**` | `tests/unit/config`, `tests/integration/hot-reload` |
| `src/gateway/**` | `tests/unit/gateway`, `tests/integration/e2e` |
| `src/transport/**` | `tests/unit/transport`, `tests/integration/transport` |
| `src/cli/**` | `tests/unit/cli`, `tests/smoke/cli` |
| `src/tui/**` | `tests/unit/tui`, `tests/e2e/cli-tui` |
| `package.json` | All tests |

### How to Modify File-to-Test Mapping

Edit `tools/ci/affected-tests.sh`:

```bash
# Add new mapping
if echo "$CHANGED_FILES" | grep -q "^src/new-module/"; then
  TEST_PATTERN="$TEST_PATTERN|tests/unit/new-module|tests/integration/new-module"
fi
```

### Force Full Test Suite

```bash
# Run all tests regardless of changes
tools/ci/affected-tests.sh --all
```

## Troubleshooting

### Pre-commit Hook Fails

**TypeScript errors:**
```bash
bun run typecheck
# Fix errors, then retry commit
```

**Lint errors:**
```bash
bun run lint:fix
# Auto-fixes most issues, then retry commit
```

**Test failures:**
```bash
bun test tests/unit/
# Fix failing tests, then retry commit
```

**Agent compliance fails:**
- Check if CHANGELOG.md needs updating
- Verify no tests are skipped (`.skip()`, `.todo()`)
- Run `./tools/agents-guard/check.sh` for details

### CI Workflow Fails

**Dependency installation fails:**
- Clear Bun cache: `rm -rf ~/.bun/install/cache`
- Re-run: `bun install`

**Cache not working:**
- Check cache key in workflow matches bun.lockb or package.json
- Verify cache action version is up to date

**Tests timeout:**
- Increase timeout in workflow: `timeout-minutes: 20`
- Check for infinite loops or deadlocks

### Changelog Validation Fails

**Error:** "CHANGELOG.md was NOT updated"

**Solutions:**
1. Update CHANGELOG.md with your changes
2. If only documentation changed, add `[skip changelog]` to PR title
3. If change is not user-facing, document in commit message

## Rollback Procedures

### Disable All Quality Gates (Emergency)

**⚠️ WARNING: Only use in production emergencies**

1. **Disable pre-commit hooks:**
   ```bash
   rm .huspy/pre-commit
   ```

2. **Disable CI workflows temporarily:**
   - Rename workflow files: `.github/workflows/main.yml` → `.github/workflows/main.yml.disabled`

3. **Revert when emergency is resolved:**
   ```bash
   git checkout .husky/pre-commit
   # Rename workflow files back
   ```

### Disable Specific Checks

**Skip lint in pre-commit:**
```bash
# Edit .husky/pre-commit and comment out lint section
```

**Skip changelog validation:**
```bash
# Rename .github/workflows/changelog.yml → changelog.yml.disabled
```

### Restore Quality Gates

```bash
# Restore all hooks and workflows
git checkout .husky/
git checkout .github/workflows/
```

## Common Issues

### "bun: command not found" in CI

Ensure setup-bun action is first:
```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest
```

### Lint errors on unchanged files

This happens when lint rules change. Fix all at once:
```bash
bun run lint:fix
```

### Pre-commit hook too slow

Consider running only essential checks in pre-commit:
```bash
# In .husky/pre-commit, comment out slower checks
# Run full checks in CI only
```

## Support

For questions or issues with quality gates:

1. Check this runbook first
2. Review `.agent-rules.md` for agent-specific guidance
3. Check [AGENTS.md](AGENTS.md) for development workflow
4. Open an issue on GitHub

## Maintenance

**Monthly tasks:**
- Review CI workflow logs for failures
- Check cache hit rates in GitHub Actions
- Update dependencies if needed

**Quarterly tasks:**
- Review and update file-to-test mappings
- Assess pre-commit hook performance
- Update quality gates based on team feedback
