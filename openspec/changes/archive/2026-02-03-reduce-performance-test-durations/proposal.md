## Why

Current performance tests have extremely long durations that make development slow and CI feedback loops lengthy. Tests like 1-hour memory stability and 8-hour sustained load are impractical for regular development and CI. We need to categorize tests and provide faster alternatives for development while maintaining comprehensive test coverage for release validation.

## What Changes

- **Reduce 1-hour memory tests to 5 minutes** for quick validation, with @quick annotation
- **Reduce 8-hour memory tests to 10 minutes** for quick validation, with @quick annotation  
- **Reduce 1-hour sustained load tests to 5 minutes** with @quick annotation
- **Add test categorization**: @quick (<5 min), @full (5-15 min), @extended (1+ hours)
- **Add test filtering** via Bun's --filter flag for selective test execution
- **Add npm scripts** for running quick vs full test suites

## Capabilities

### New Capabilities
- `quick-performance-tests`: Fast validation tests (<5 min total)
- `extended-performance-tests`: Long-running benchmark tests (1+ hours) for scheduled runs

### Modified Capabilities
- `performance-tests`: Now supports test duration categories with filtering

## Impact

- **Tests**: 4 long-running tests reduced from hours to minutes in quick mode
- **Developer Experience**: Fast feedback during development
- **CI/CD**: Can run quick tests on every PR, extended tests on main/release
- **Code**: 4 test files modified with duration categories
