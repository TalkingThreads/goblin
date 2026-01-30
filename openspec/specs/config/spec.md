# config Specification

## Purpose
TBD - created by archiving change add-config-system. Update Purpose after archive.
## Requirements
### Requirement: Configuration Schema Definition

The system SHALL define a Zod schema for complete gateway configuration including servers, gateway settings, authentication, and policies.

#### Scenario: Valid config parsed successfully
- **WHEN** valid configuration is provided
- **THEN** Zod schema parses without errors and returns typed config object

#### Scenario: Invalid config rejected with clear error
- **WHEN** configuration violates schema constraints
- **THEN** Zod validation fails and provides detailed error messages

#### Scenario: Default values applied
- **WHEN** optional fields are omitted from config
- **THEN** schema default values are used

### Requirement: Configuration Loading

The system SHALL load configuration from OS-standard locations with atomic validation.

#### Scenario: Config loaded from standard location
- **WHEN** application starts
- **THEN** config is loaded from `~/.config/goblin/config.json` (Linux), `~/Library/Application Support/Goblin/config.json` (macOS), or `%APPDATA%\Goblin\config.json` (Windows)

#### Scenario: Invalid config does not crash application
- **WHEN** config file contains invalid JSON or fails schema validation
- **THEN** application logs error and uses previous valid config or safe defaults

#### Scenario: Missing config handled gracefully
- **WHEN** config file does not exist
- **THEN** application creates default config or prompts user with helpful message

### Requirement: Hot Reload with File Watching

The system SHALL watch the config file and reload changes automatically with atomic updates.

#### Scenario: Valid config change applied
- **WHEN** config file is modified with valid changes
- **THEN** new config is loaded and applied within 500ms without restarting

#### Scenario: Invalid config change rolled back
- **WHEN** config file is modified with invalid changes
- **THEN** previous valid config remains active and error is logged

#### Scenario: Rapid file changes debounced
- **WHEN** config file is saved multiple times rapidly (editor behavior)
- **THEN** reload is debounced to prevent multiple reloads

### Requirement: JSON Schema Generation

The system SHALL generate JSON Schema from Zod schema for editor support.

#### Scenario: Schema file generated on build
- **WHEN** application is built or started
- **THEN** `config.schema.json` is written to config directory

#### Scenario: VSCode autocomplete enabled
- **WHEN** user adds `"$schema": "./config.schema.json"` to config file
- **THEN** VSCode provides autocomplete, validation, and inline documentation

### Requirement: Type Safety

The system SHALL export TypeScript types derived from Zod schema.

#### Scenario: Config type matches runtime schema
- **WHEN** TypeScript code references config properties
- **THEN** type checking enforces schema constraints at compile time

#### Scenario: Config type updated with schema changes
- **WHEN** Zod schema is modified
- **THEN** TypeScript types are automatically updated via `z.infer`

