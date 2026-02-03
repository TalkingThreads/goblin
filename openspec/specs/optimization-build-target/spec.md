# Optimization: Build Target Optimization

**Spec ID:** optimization-build-target
**Change:** mvp-release-optimization
**Status:** Draft
**Version:** 1.0.0

---

## Summary

Update build configuration to target Bun runtime specifically and enable minification, achieving 20% smaller output and faster startup time.

## Context

Goblin uses Bun throughout (Bun.serve, bun.lock) but builds for generic Node.js target, missing Bun-specific optimizations. Minification is not enabled, resulting in larger binary size and slower startup compared to optimized build.

## Design

### Current Behavior

```json
// Current package.json build scripts
{
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node"
  }
}
```

### Proposed Behavior

```json
// Optimized package.json build scripts
{
  "scripts": {
    "build": "bun build src/index.ts --target bun --minify --sourcemap=external",
    "build:node": "bun build src/index.ts --outdir dist --target node",
    "build:analyze": "bun build src/index.ts --target bun --minify --analyze"
  }
}
```

### Implementation Details

- `--target bun`: Enables Bun-specific optimizations including native module resolution, platform-specific code generation, and elimination of unnecessary polyfills
- `--minify`: Reduces output size through whitespace removal, identifier shortening, and constant folding
- `--sourcemap=external`: Generates separate source map file for debugging without increasing binary size

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Build command must produce working executable | MUST |
| FR2 | Build output must be functionally equivalent to current build | MUST |
| FR3 | Source maps must be generated and usable for debugging | MUST |
| FR4 | All Bun-specific APIs must be handled correctly | MUST |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR1 | Build output size must be 20% smaller than current | SHOULD |
| NFR2 | Startup time must be 20% faster than current | SHOULD |
| NFR3 | Build process must complete within reasonable time | MUST |
| NFR4 | Build errors must provide clear error messages | MUST |

## When/Then Scenarios

### Scenario 1: Production Build

```gherkin
WHEN the build command is executed for production
THEN the output must target Bun runtime
AND the output must be minified
AND source maps must be generated externally
AND the binary must execute correctly
```

### Scenario 2: Node.js Fallback Build

```gherkin
WHEN the build:node command is executed
THEN the output must target Node.js runtime
AND the output must be usable on Node.js environments
AND minification may be applied
```

### Scenario 3: Build Analysis

```gherkin
WHEN the build:analyze command is executed
THEN bundle size analysis must be output
AND optimization opportunities must be identified
```

### Scenario 4: Source Map Usage

```gherkin
WHEN debugging production issues
THEN source maps must correctly map minified code to source
AND line and column numbers must be accurate
```

## API Surface

### Configuration Changes

```json
{
  "scripts": {
    "build": "bun build src/index.ts --target bun --minify --sourcemap=external",
    "build:node": "bun build src/index.ts --outdir dist --target node",
    "build:analyze": "bun build src/index.ts --target bun --minify --analyze",
    "start": "bun run dist/index.js"
  }
}
```

### Files to Modify

- `package.json` - Update build scripts
- `package-lock.json` or `bun.lock` - Updated dependencies (if needed)

## Testing Strategy

### Unit Tests

- Build produces working executable
- Executable passes existing test suite
- Source maps are generated correctly

### Integration Tests

- Verify startup time improvement
- Verify binary size reduction
- Test on actual Bun runtime environment

### Validation Tests

- Functional equivalence test (run same operations, compare results)
- Performance benchmarking before/after
- Binary size measurement before/after

## Metrics and Validation

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Binary size | 20% reduction | File size comparison |
| Startup time | 20% faster | Timing script |
| Build time | No significant regression | Build timing |
| Source map correctness | 100% accurate mapping | Debug test |

## Rollback Plan

1. Restore previous build command to use `--target node`
2. Remove `--minify` flag
3. Run build to verify restoration
4. Test executable to ensure it works correctly

## Dependencies

- None (configuration-only change)

## Open Questions

### Question 1: Should we keep Node.js build target as alternative?

**From Design Document:** Yes, keep Node.js build target as alternative for flexibility.

**Implementation Note:** Maintain `build:node` script for environments that require Node.js compatibility.

---

**Spec Created:** 2026-01-31
**Last Updated:** 2026-01-31
