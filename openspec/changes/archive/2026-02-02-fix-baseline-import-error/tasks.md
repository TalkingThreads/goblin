## 1. Fix Import Statement

- [x] 1.1 Split fs imports in `tests/performance/shared/baseline-manager.ts`
- [x] 1.2 Add `existsSync` import from `node:fs`
- [x] 1.3 Keep `mkdir`, `readFile`, `writeFile` imports from `node:fs/promises`

## 2. Verify Fix

- [x] 2.1 Run `bun test tests/performance/baseline/storage.test.ts`
- [x] 2.2 Run `bun test tests/performance/baseline/comparison.test.ts`
- [x] 2.3 Confirm all 7 baseline tests pass
