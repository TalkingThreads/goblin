## Implementation Tasks

### Phase 1: Add Duration Helper Functions

- [ ] **TASK-1**: Add duration category helpers to `tests/performance/shared/test-config.ts`
  - Add `DurationCategory` type: "quick" | "full" | "extended"
  - Add `getTestDuration(baseMs, category)` function
  - Add `getSampleCount(baseCount, category)` function
  - Define default durations per category:
    - quick: 300000ms (5 min)
    - full: 1800000ms (30 min)
    - extended: 3600000ms (1 hour)

### Phase 2: Update Memory Stability Tests

- [ ] **TASK-2**: Create @quick version of "1 Hour Memory Stability" test
  - Reduce duration from 3600000ms to 300000ms (5 min)
  - Reduce sample count from 120 to 10
  - Add "@quick" tag to describe block
  - Add assertion for <10% memory growth

- [ ] **TASK-3**: Create @full version of "1 Hour Memory Stability" test
  - Keep duration at 1800000ms (30 min)
  - Reduce sample count from 120 to 60
  - Add "@full" tag to describe block
  - Add assertion for <10% memory growth

- [ ] **TASK-4**: Create @quick version of "8 Hour Memory Stability" test
  - Reduce duration from 28800000ms to 600000ms (10 min)
  - Reduce sample count from 480 to 20
  - Add "@quick" tag to describe block
  - Add assertion for <20% memory growth

- [ ] **TASK-5**: Create @extended version of "8 Hour Memory Stability" test
  - Keep original duration of 28800000ms (8 hours)
  - Add "@extended" tag to describe block
  - For scheduled runs only

### Phase 3: Update Sustained Load Tests

- [ ] **TASK-6**: Create @quick version of "1 Hour Sustained Load" test
  - Reduce main duration from 60000ms to 30000ms
  - Reduce interval samples from 60 to 10
  - Add "@quick" tag to describe block
  - Add assertion for coefficient of variation < 20%

- [ ] **TASK-7**: Update "8 Hour Sustained Load" test with annotations
  - Create @full version with 1800000ms duration (30 min)
  - Create @extended version with original duration
  - Add appropriate tags

### Phase 4: Add Test Filtering

- [ ] **TASK-8**: Document test filtering commands
  - `bun test tests/performance --filter "@quick"` for fast tests
  - `bun test tests/performance --filter "@full"` for comprehensive tests
  - `bun test tests/performance --filter "@extended"` for extended tests

- [ ] **TASK-9**: Add npm scripts for test categories
  - `"perf:quick": "bun test tests/performance --filter \"@quick\""`
  - `"perf:full": "bun test tests/performance --filter \"@full\""`
  - `"perf:extended": "bun test tests/performance --filter \"@extended\""`

### Phase 5: Cleanup and Verification

- [ ] **TASK-10**: Remove original long-running tests
  - Remove original 1-hour memory test
  - Remove original 8-hour memory test
  - Remove original 1-hour sustained load test

- [ ] **TASK-11**: Verify tests work with filtering
  - Run quick tests and verify completion in <5 min
  - Run full tests and verify completion in <30 min
  - Verify all assertions pass

- [ ] **TASK-12**: Update documentation
  - Document test categories in test-config.ts
  - Update package.json script descriptions
  - Add README section about performance test categories

## Test Plan

### Quick Tests (<5 minutes)
- Verify all @quick tests complete in under 5 minutes
- Verify assertions still meaningful
- Verify tests catch obvious issues

### Full Tests (<30 minutes)
- Verify all @full tests complete in under 30 minutes
- Verify more sensitive than @quick tests
- Verify comprehensive coverage

### Extended Tests (1+ hours)
- Verify @extended tests run correctly
- For scheduled runs only, not PRs

## Success Criteria

1. ✅ @quick tests complete in <5 minutes total
2. ✅ @full tests complete in <30 minutes total
3. ✅ All tests properly filtered by category
4. ✅ No duplicate test coverage
5. ✅ Assertions remain meaningful in all categories
6. ✅ npm scripts work correctly
