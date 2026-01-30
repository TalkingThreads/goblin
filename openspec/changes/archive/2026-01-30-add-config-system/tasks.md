## 1. Schema Definition
- [x] 1.1 Create `src/config/schema.ts` with Zod schemas
- [x] 1.2 Define `ServerConfigSchema` for backend server configuration
- [x] 1.3 Define `GatewayConfigSchema` for gateway settings
- [x] 1.4 Define `AuthConfigSchema` for authentication settings
- [x] 1.5 Define `PoliciesConfigSchema` for runtime policies
- [x] 1.6 Define root `ConfigSchema` combining all sub-schemas
- [x] 1.7 Export TypeScript types via `z.infer`

## 2. Config Paths
- [x] 2.1 Create `src/config/paths.ts`
- [x] 2.2 Install `env-paths` package
- [x] 2.3 Implement `getConfigPath()` for OS-standard locations
- [x] 2.4 Implement `ensureConfigDir()` to create directory if missing

## 3. Config Loader
- [x] 3.1 Create `src/config/loader.ts`
- [x] 3.2 Implement `loadConfig()` with file reading and JSON parsing
- [x] 3.3 Implement atomic validation with `ConfigSchema.safeParse()`
- [x] 3.4 Add error handling for missing files, invalid JSON, validation errors
- [x] 3.5 Add support for default config when file is missing

## 4. Hot Reload
- [x] 4.1 Create `src/config/watcher.ts`
- [x] 4.2 Implement file watching using `node:fs watch()`
- [x] 4.3 Add 100ms debouncing for rapid changes
- [x] 4.4 Implement atomic swap pattern for config updates
- [x] 4.5 Add event emitter for config update notifications
- [x] 4.6 Add rollback behavior on validation failure

## 5. JSON Schema Generation
- [x] 5.1 Install `zod-to-json-schema` package
- [x] 5.2 Implement `generateSchema()` function
- [x] 5.3 Write schema to `config.schema.json` in config directory
- [x] 5.4 Add schema generation to build process
- [x] 5.5 Update README with VSCode setup instructions

## 6. Integration
- [x] 6.1 Create `src/config/index.ts` barrel export
- [x] 6.2 Update `src/index.ts` to load config on startup
- [x] 6.3 Add structured logging for config operations
- [x] 6.4 Add unit tests for schema validation
- [x] 6.5 Add unit tests for loader and watcher

## 7. Documentation
- [x] 7.1 Update README.md with config documentation
- [x] 7.2 Update CHANGELOG.md with config system addition
- [x] 7.3 Add example config file to docs/
- [x] 7.4 Commit changes with conventional commit message
