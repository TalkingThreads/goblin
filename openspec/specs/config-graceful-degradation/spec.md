## ADDED Requirements

### Requirement: Gateway starts without config file
The gateway SHALL start successfully even when the config file does not exist.

#### Scenario: Gateway starts with no config file
- **WHEN** the gateway starts with no config file at the specified path
- **THEN** it SHALL use default configuration
- **AND** it SHALL NOT crash with ENOENT error
- **AND** it SHALL log a warning that config file is not being watched

#### Scenario: Gateway starts with missing config during tests
- **WHEN** tests start a gateway server
- **AND** the config file does not exist
- **THEN** the server SHALL start successfully
- **AND** the health endpoint SHALL respond with 200 OK

### Requirement: Config watcher graceful degradation
The config watcher SHALL handle missing files gracefully without crashing.

#### Scenario: Watcher skips when config missing
- **WHEN** the config file does not exist
- **THEN** the watcher SHALL NOT be created
- **AND** the gateway SHALL continue without hot reload
- **AND** a warning SHALL be logged

#### Scenario: Watcher error is caught
- **WHEN** the config watcher encounters an error
- **THEN** it SHALL NOT crash the gateway process
- **AND** it SHALL log the error at warn level
- **AND** the gateway SHALL continue operating
