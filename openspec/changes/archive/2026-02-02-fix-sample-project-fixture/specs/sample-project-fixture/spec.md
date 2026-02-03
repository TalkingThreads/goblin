## ADDED Requirements

### Requirement: createSampleProject creates parent directories
The `createSampleProject` function SHALL create all parent directories before writing files.

#### Scenario: Creates nested directory structure
- **WHEN** `createSampleProject("simple-node")` is called
- **THEN** it SHALL create the `tempDir/simple-node/` directory
- **AND** create `tempDir/simple-node/package.json` without errors

#### Scenario: Works on Windows with backslash paths
- **WHEN** paths contain Windows-style separators
- **THEN** `path.join` SHALL normalize paths
- **AND** `mkdirSync` with `recursive: true` SHALL create directories

### Requirement: Sample project structure is correct
The created sample project SHALL have the expected structure and content.

#### Scenario: Package.json contains required fields
- **WHEN** sample project is created
- **THEN** `package.json` SHALL contain `name`, `version`, `type`, `goblin` fields

#### Scenario: Goblin config is valid JSON
- **WHEN** sample project is created
- **THEN** `.goblin.json` SHALL be valid JSON with server configuration
