## ADDED Requirements

### Requirement: Baseline manager imports are correct
The BaselineManager SHALL import `existsSync` from `node:fs` (synchronous module) and SHALL import `mkdir`, `readFile`, `writeFile` from `node:fs/promises` (async module).

#### Scenario: BaselineManager loads without import errors
- **WHEN** the test runner imports `baseline-manager.ts`
- **THEN** no syntax error SHALL occur during module loading
- **AND** the module exports `BaselineManager`, `createBaselineManager`, and `baselineManager`

#### Scenario: BaselineManager uses correct fs imports
- **WHEN** `BaselineManager.saveBaseline()` is called
- **THEN** it SHALL use `existsSync` from `node:fs` to check file existence
- **AND** it SHALL use `mkdir` from `node:fs/promises` to create directories
- **AND** it SHALL use `writeFile` from `node:fs/promises` to write baseline files

#### Scenario: BaselineManager loads existing baselines
- **WHEN** `BaselineManager.loadBaseline()` is called for an existing baseline file
- **THEN** it SHALL use `existsSync` from `node:fs` to verify the file exists
- **AND** it SHALL use `readFile` from `node:fs/promises` to read the file contents
