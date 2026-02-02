# Integration Tests: Hot Reload

**Change ID:** add-integration-tests
**Spec ID:** integration-tests-hot-reload
**Created:** 2026-01-31

## Overview

This spec defines the integration test scenarios for hot reload functionality in the Goblin MCP gateway. Hot reload enables dynamic configuration updates without restarting the gateway, supporting configuration changes, backend server management, and capability toggling during operation.

## Requirements

### Requirement: Configuration hot reload

The system SHALL reload configuration without restarting the gateway.

#### Scenario: Config file change detected

- **WHEN** configuration file is modified
- **THEN** gateway SHALL detect change
- **AND** new configuration SHALL be loaded
- **AND** configuration SHALL be validated before apply

#### Scenario: Invalid config on hot reload

- **WHEN** modified configuration is invalid
- **THEN** reload SHALL fail gracefully
- **AND** previous configuration SHALL remain active
- **AND** error SHALL be logged for debugging

#### Scenario: Hot reload during active connections

- **WHEN** config is reloaded while clients are connected
- **THEN** existing connections SHALL continue
- **AND** new connections SHALL use new config
- **AND** in-flight requests SHALL complete with old config

### Requirement: Backend server hot reload

The system SHALL handle backend server changes without disrupting clients.

#### Scenario: Backend added via hot reload

- **WHEN** new backend is added to config
- **THEN** gateway SHALL connect to new backend
- **AND** new tools SHALL become available
- **AND** listChanged notification SHALL be sent

#### Scenario: Backend removed via hot reload

- **WHEN** backend is removed from config
- **THEN** gateway SHALL disconnect from backend
- **AND** active requests SHALL complete or error
- **AND** clients SHALL be notified of removed tools

#### Scenario: Backend configuration changed

- **WHEN** backend configuration is modified
- **THEN** gateway SHALL reconfigure connection
- **AND** connection SHALL be re-established if needed
- **AND** clients SHALL see updated capabilities

### Requirement: Capability toggle during operation

The system SHALL handle capability changes during operation.

#### Scenario: Capability disabled via hot reload

- **WHEN** a capability is disabled in config
- **THEN** new requests SHALL fail with unavailable error
- **AND** in-flight requests SHALL complete normally
- **AND** clients SHALL be notified of capability change

#### Scenario: Capability enabled via hot reload

- **WHEN** a capability is enabled in config
- **THEN** new requests SHALL be accepted
- **AND** clients SHALL see updated capabilities

### Requirement: Hot reload notification

The system SHALL notify components of configuration changes.

#### Scenario: Components notified of config change

- **WHEN** configuration is hot reloaded
- **THEN** all components SHALL be notified
- **AND** components SHALL update internal state
- **AND** logging SHALL reflect new configuration

#### Scenario: Hot reload rollback on failure

- **WHEN** hot reload fails after partial apply
- **THEN** configuration SHALL rollback to previous
- **AND** components SHALL be notified of rollback
- **AND** system SHALL continue with previous config

### Requirement: Hot reload with multiple changes

The system SHALL handle multiple concurrent configuration changes.

#### Scenario: Rapid config changes

- **WHEN** config changes multiple times quickly
- **THEN** only latest configuration SHALL be applied
- **AND** intermediate configurations SHALL be skipped
- **AND** final state SHALL match last valid config

#### Scenario: Config change during hot reload

- **WHEN** config changes while reload is in progress
- **THEN** current reload SHALL complete
- **AND** new change SHALL trigger another reload
- **AND** eventual consistency SHALL be achieved

## Test Implementation Notes

### Required Fixtures

- File watcher for configuration directory
- Configuration validator
- Backend connection manager
- Capability registry
- Event notification system

### Test Utilities

- Config file modifier
- Backend simulator
- Client connection manager
- Request interceptor

### Metrics to Track

- Reload latency
- Connection disruption time
- Notification delivery time
- Rollback success rate
