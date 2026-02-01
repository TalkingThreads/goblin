# Performance Baseline Framework Specification

## Overview

This specification defines the requirements and implementation details for the Goblin performance baseline framework. The framework enables persistent storage of performance metrics, baseline comparison, regression detection, and trend analysis.

## 1. Baseline Storage

Performance baselines SHALL be stored persistently for comparison.

### 1.1 Save Baseline to File

- **WHEN** performance test completes
- **AND** baseline does not exist
- **THEN** baseline SHALL be saved to file
- **AND** file SHALL be version controlled
- **AND** metadata SHALL include environment info

**Implementation Details:**

The initial baseline is captured when the first performance test runs without an existing baseline. The baseline file is stored in the designated baselines directory with appropriate naming conventions. Version control ensures historical tracking of baseline changes, allowing teams to understand when and why baselines were modified. Environment information includes hardware specifications, software versions, and configuration details that could impact performance measurements.

**File Structure:**

```json
{
  "version": "1.0.0",
  "createdAt": "2026-01-31T10:00:00Z",
  "environment": {
    "os": "Windows",
    "cpu": "Intel Core i7-12700K",
    "memory": "32GB DDR5",
    "nodeVersion": "v20.10.0"
  },
  "metrics": {
    "latency": {
      "p50": 45.2,
      "p95": 78.6,
      "p99": 125.4
    },
    "throughput": {
      "requestsPerSecond": 12500,
      "bytesPerSecond": 52428800
    },
    "memory": {
      "averageMb": 256.8,
      "peakMb": 384.2
    }
  },
  "configuration": {
    "testType": "load",
    "duration": "60s",
    "concurrency": 100
  }
}
```

### 1.2 Load Baseline from File

- **WHEN** performance test runs
- **AND** baseline file exists
- **THEN** baseline SHALL be loaded
- **AND** comparison SHALL be performed

**Implementation Details:**

On test execution, the framework searches for the appropriate baseline file matching the current test configuration. If multiple baselines exist for different configurations, the correct one is selected based on environment and test parameters. The baseline is loaded into memory for comparison with current results. Error handling ensures graceful degradation when baseline files are corrupted or missing.

### 1.3 Multiple Baselines for Different Configurations

- **WHEN** different configurations are tested
- **THEN** separate baselines SHALL be stored
- **AND** correct baseline SHALL be selected for comparison
- **AND** configuration SHALL be documented

**Implementation Details:**

The framework supports multiple baseline profiles to handle different test scenarios. Each profile includes a unique identifier based on test parameters, environment, and configuration. Selection logic matches current test parameters against baseline metadata to find the most relevant comparison point. Documentation includes test parameters, environment details, and any notes about the baseline creation.

## 2. Baseline Comparison

Performance tests SHALL compare results against baselines.

### 2.1 Detect Latency Regression

- **WHEN** latency test completes
- **AND** baseline exists
- **THEN** current results SHALL be compared
- **AND** p50 regression over 10% SHALL be flagged
- **AND** p95 regression over 15% SHALL be flagged

**Implementation Details:**

Latency comparison focuses on percentile metrics that represent user experience. The p50 (median) threshold of 10% catches typical performance shifts, while the p95 threshold of 15% accounts for natural variance in tail latency. Calculations use the formula: `((current - baseline) / baseline) * 100`. Results exceeding thresholds generate regression alerts with detailed comparison data.

### 2.2 Detect Throughput Regression

- **WHEN** throughput test completes
- **AND** baseline exists
- **THEN** current results SHALL be compared
- **AND** throughput decrease over 10% SHALL be flagged

**Implementation Details:**

Throughput metrics measure system capacity and efficiency. A 10% decrease indicates significant performance degradation that could impact user experience under load. The comparison accounts for measurement variance by using average values over the test duration. Throughput regressions often indicate resource constraints, code inefficiencies, or infrastructure issues.

### 2.3 Detect Memory Regression

- **WHEN** memory test completes
- **AND** baseline exists
- **THEN** current results SHALL be compared
- **AND** memory growth over 20% SHALL be flagged

**Implementation Details:**

Memory comparison uses average and peak consumption metrics. The 20% threshold accommodates minor allocation variations while catching significant memory leaks or inefficient resource usage. Memory regressions are particularly concerning as they can lead to out-of-memory conditions and system instability under sustained load.

## 3. Regression Reporting

Regressions SHALL be clearly reported.

### 3.1 Regression Includes Details

- **WHEN** regression is detected
- **THEN** report SHALL include baseline value
- **AND** report SHALL include current value
- **AND** report SHALL include percentage change
- **AND** severity SHALL be indicated

**Report Structure:**

```json
{
  "detectedAt": "2026-01-31T10:30:00Z",
  "testType": "latency",
  "severity": "warning",
  "metric": "p95",
  "baseline": 78.6,
  "current": 92.4,
  "change": {
    "value": 13.8,
    "percentage": 17.55
  },
  "threshold": {
    "limit": 15,
    "exceededBy": 2.55
  },
  "environment": {
    "commitHash": "abc123",
    "timestamp": "2026-01-31T10:25:00Z"
  }
}
```

### 3.2 Regression in CI Pipeline

- **WHEN** performance test runs in CI
- **AND** regression is detected
- **THEN** build SHALL be flagged
- **AND** details SHALL be in build logs
- **AND** notification SHALL be sent

**CI Integration:**

The framework integrates with CI systems to provide performance regression tracking. When a regression is detected, the build status is updated to reflect the issue. Detailed logs include comparison data, environment information, and links to historical trends. Notification channels (Slack, email, webhooks) alert relevant teams about performance concerns.

### 3.3 No Regression When Acceptable Change

- **WHEN** change is within threshold
- **THEN** no regression SHALL be reported
- **AND** results SHALL be logged
- **AND** trend data SHALL be updated

**Implementation Details:**

Results within acceptable thresholds are logged as normal test outcomes. The framework tracks these results in the historical database for trend analysis, even when no regression is reported. This data supports long-term performance tracking and helps establish baseline ranges for different conditions.

## 4. Baseline Management

Baselines SHALL be managed effectively.

### 4.1 Update Baseline for Intentional Changes

- **WHEN** performance improvement is intentional
- **THEN** baseline SHALL be updatable
- **AND** update SHALL require approval
- **AND** change SHALL be documented

**Update Workflow:**

1. Performance improvement is identified and validated
2. Developer or QA submits baseline update request
3. Reviewer approves the update with justification
4. New baseline is created with updated metrics
5. Change documentation is stored with the baseline

### 4.2 Baseline Versioning

- **WHEN** baseline is updated
- **THEN** previous baseline SHALL be preserved
- **AND** history SHALL be maintained
- **AND** rollback SHALL be possible

**Version History Structure:**

```
baselines/
├── v1.0.0/
│   ├── baseline.json
│   └── metadata.yaml
├── v1.1.0/
│   ├── baseline.json
│   └── metadata.yaml
└── current -> v1.1.0
```

### 4.3 Baseline for Different Environments

- **WHEN** same code runs in different environments
- **THEN** separate baselines SHALL be maintained
- **AND** environment SHALL be identified
- **AND** appropriate baseline SHALL be used

**Environment-Specific Baselines:**

The framework supports environment-specific baseline profiles for development, staging, and production environments. Each profile includes environment identification metadata and configuration-specific parameters. Test execution automatically selects the correct baseline based on detected environment variables.

## 5. Performance Trends

Performance trends SHALL be tracked over time.

### 5.1 Store Historical Performance Data

- **WHEN** performance test completes
- **THEN** results SHALL be stored in history
- **AND** timestamp SHALL be recorded
- **AND** environment info SHALL be included

**Historical Data Schema:**

```json
{
  "id": "test-uuid-1234",
  "testedAt": "2026-01-31T10:30:00Z",
  "commitHash": "abc123",
  "branch": "main",
  "environment": {
    "os": "Windows",
    "cpu": "Intel Core i7-12700K",
    "memory": "32GB DDR5"
  },
  "results": {
    "latency": {
      "p50": 42.1,
      "p95": 72.4,
      "p99": 118.9
    },
    "throughput": {
      "requestsPerSecond": 13200
    },
    "memory": {
      "averageMb": 248.5
    }
  },
  "baselineId": "baseline-v1.0.0",
  "comparison": {
    "latencyP50": {
      "percentage": -6.86,
      "improved": true
    }
  }
}
```

### 5.2 Visualize Performance Trends

- **WHEN** historical data exists
- **THEN** trend visualization SHALL be available
- **AND** improvements SHALL be visible
- **AND** regressions SHALL be highlighted

**Visualization Features:**

The trend visualization module provides interactive charts showing performance metrics over time. Color coding distinguishes between improvements (green), stable performance (blue), and regressions (red). Users can filter by metric type, time range, and environment to analyze specific trends.

### 5.3 Predict Future Performance

- **WHEN** sufficient historical data exists
- **THEN** trend prediction SHALL be available
- **AND** capacity planning SHALL be supported
- **AND** alerts SHALL be generated for projected issues

**Prediction Capabilities:**

Using statistical analysis of historical data, the framework projects future performance trends. Capacity planning features estimate resource requirements based on projected load. Proactive alerts warn about potential regressions before they occur, enabling teams to address issues preemptively.

## 6. Implementation Architecture

### 6.1 Component Structure

```
src/
├── performance/
│   ├── baseline/
│   │   ├── manager.ts
│   │   ├── storage.ts
│   │   └── comparison.ts
│   ├── tests/
│   │   ├── runner.ts
│   │   └── metrics/
│   ├── reporting/
│   │   ├── formatter.ts
│   │   └── notifier.ts
│   └── trends/
│       ├── analyzer.ts
│       └── predictor.ts
```

### 6.2 Configuration

Performance baseline framework configuration in `config.yaml`:

```yaml
performance:
  baseline:
    storagePath: "./baselines"
    versioning: true
    maxVersions: 10
  
  thresholds:
    latency:
      p50: 10
      p95: 15
    throughput: 10
    memory: 20
  
  reporting:
    ciIntegration: true
    notifications:
      slack: true
      email: true
    severityLevels:
      - warning
      - error
      - critical
  
  trends:
    minDataPoints: 10
    predictionEnabled: true
    capacityPlanning: true
```

## 7. API Reference

### 7.1 Baseline Manager

```typescript
class BaselineManager {
  async saveBaseline(testResults: TestResults): Promise<Baseline>;
  async loadBaseline(config: TestConfig): Promise<Baseline | null>;
  async updateBaseline(baselineId: string, newResults: TestResults): Promise<Baseline>;
  async listBaselines(): Promise<Baseline[]>;
  async rollback(baselineId: string): Promise<void>;
}
```

### 7.2 Comparison Engine

```typescript
class ComparisonEngine {
  compare(baseline: Baseline, current: TestResults): ComparisonResult;
  detectRegressions(comparison: ComparisonResult): Regression[];
  calculatePercentageChange(baseline: number, current: number): number;
}
```

### 7.3 Trend Analyzer

```typescript
class TrendAnalyzer {
  async storeResult(result: TestResult): Promise<void>;
  async getHistoricalData(config: QueryConfig): Promise<HistoricalData[]>;
  async predictTrend(metric: string): Promise<Prediction>;
  async generateVisualization(config: VisualizationConfig): Promise<string>;
}
```

## 8. Security Considerations

- Baseline files contain environment information that should be protected
- Access to baseline modification requires appropriate authorization
- API endpoints for baseline management should require authentication
- Audit logging tracks all baseline changes and access attempts

## 9. Testing Strategy

- Unit tests for baseline comparison logic
- Integration tests for file storage and retrieval
- End-to-end tests for complete workflow scenarios
- Performance tests for the framework itself

## 10. Deployment Considerations

- Baselines directory should be backed up regularly
- CI pipeline integration requires webhook configuration
- Notification channels need credential management
- Dashboard deployment requires web server setup

## 11. References

- [MCP SDK Performance Testing Guidelines]
- [CI/CD Pipeline Integration Best Practices]
- [Statistical Analysis for Performance Metrics]
