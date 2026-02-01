# Performance Latency Tests Specification

This document defines the performance latency requirements and acceptance criteria for the Goblin MCP gateway. These tests ensure that the gateway maintains low latency under various conditions and provides comprehensive latency reporting capabilities.

## Overview

The Goblin MCP gateway is designed to route requests between clients and MCP servers with minimal overhead. This specification defines the latency targets, measurement requirements, and reporting standards that the gateway must meet. The tests specified here are intended to be run as part of the continuous integration pipeline and as part of performance regression testing before releases.

Latency is defined as the time from when a request enters the gateway until the response leaves the gateway. This measurement excludes backend processing time, as the gateway cannot control the performance of backend services. The gateway's responsibility is to minimize routing overhead and provide transparent, low-latency proxying of requests.

The specification covers latency targets at various percentiles, consistency under different load conditions, measurement accuracy requirements, behavior under concurrent load, component-level latency breakdown, and comprehensive reporting capabilities. Each of these aspects is critical for understanding and optimizing gateway performance.

## Latency Target Achievement

The gateway must maintain routing overhead under defined thresholds to ensure responsive service for clients. These targets represent the maximum acceptable latency values for different percentile measurements.

### Requirement 1.1: p50 latency under 50ms

The median latency (p50) represents the typical user experience and must be maintained at low levels to ensure responsive interactions.

**Scenario: p50 latency under 50ms**

- **GIVEN** requests are being processed through the gateway
- **WHEN** latency is measured at the p50 percentile
- **THEN** the latency SHALL be under 50ms
- **AND** this measurement SHALL include only gateway processing time
- **AND** backend processing time SHALL be excluded from this measurement
- **AND** the measurement SHALL include request deserialization, routing, and response serialization
- **AND** network latency to the backend server SHALL be excluded

The p50 latency is the most important metric for user-perceived performance as it represents the experience of the typical request. A value under 50ms ensures that most users experience snappy, responsive service. This requirement must be met under normal operating conditions with no significant system stress.

### Requirement 1.2: p95 latency under 100ms

The p95 percentile represents the experience of the 95th percentile of requests and ensures that the vast majority of users receive acceptable performance.

**Scenario: p95 latency under 100ms**

- **GIVEN** requests are being processed through the gateway
- **WHEN** latency is measured at the p95 percentile
- **THEN** the latency SHALL be under 100ms
- **AND** latency variability SHALL be minimal across measurements
- **AND** outliers that cause spikes in p95 latency SHALL be investigated and addressed
- **AND** the measurement methodology SHALL be consistent with p50 measurements

The p95 latency is critical for service level agreements and user satisfaction. A value under 100ms ensures that 95% of requests complete in under 100ms, which is generally acceptable for interactive applications. Variability should be minimal to ensure predictable performance, and any significant outliers should be investigated to understand and mitigate their causes.

### Requirement 1.3: p99 latency under 200ms

The p99 percentile represents the experience of the most extreme 1% of requests and ensures that even the slowest requests complete in a reasonable timeframe.

**Scenario: p99 latency under 200ms**

- **GIVEN** requests are being processed through the gateway
- **WHEN** latency is measured at the p99 percentile
- **THEN** the latency SHALL be under 200ms
- **AND** tail latency SHALL be bounded and not subject to unbounded growth
- **AND** no extreme outliers with latency exceeding 500ms SHALL exist under normal conditions
- **AND** the causes of p99 latency requests SHALL be identifiable and investigable

The p99 latency is important for understanding worst-case scenarios and ensuring that the service remains responsive even for the most challenging requests. A value under 200ms ensures that even the slowest 1% of requests complete in a reasonable time. Extreme outliers should be extremely rare and should trigger investigation when they occur.

## Latency Consistency

The gateway must maintain consistent latency across different load conditions. Performance should degrade gracefully as load increases, and latency should remain predictable at all levels.

### Requirement 2.1: Latency under low load

Under low load conditions, the gateway should demonstrate excellent latency performance with minimal overhead.

**Scenario: Latency under low load**

- **GIVEN** the system is operating at or below 10% of maximum capacity
- **WHEN** latency is measured across all requests
- **THEN** the p50 latency SHALL be under 20ms
- **AND** the p95 latency SHALL be under 40ms
- **AND** the standard deviation of latency SHALL be minimal
- **AND** the system SHOULD demonstrate headroom for handling additional load

Low load conditions represent the best-case performance scenario for the gateway. Under these conditions, latency should be minimal with the p50 well under 20ms and p95 under 40ms. This ensures that the gateway has significant headroom and that there is no significant overhead from resource contention or queueing.

### Requirement 2.2: Latency under medium load

Medium load conditions represent typical operating conditions where the system is being used but not heavily stressed.

**Scenario: Latency under medium load**

- **GIVEN** the system is operating at approximately 50% of maximum capacity
- **WHEN** latency is measured across all requests
- **THEN** the p50 latency SHALL be under 40ms
- **AND** the p95 latency SHALL be under 80ms
- **AND** latency degradation SHALL be graceful and proportional to load increase
- **AND** the system SHALL maintain stability without significant latency spikes

Medium load conditions are the most common operating state for production systems. Under these conditions, the p50 latency should remain under 40ms, representing a doubling from the low-load case, which is acceptable given the increased load. The p95 latency should remain under 80ms, maintaining a 2x multiplier from p50, which indicates consistent performance characteristics.

### Requirement 2.3: Latency under high load

High load conditions represent stressed operating conditions where the system is heavily utilized but not overwhelmed.

**Scenario: Latency under high load**

- **GIVEN** the system is operating at approximately 80% of maximum capacity
- **WHEN** latency is measured across all requests
- **THEN** the p50 latency SHALL be under 60ms
- **AND** the p95 latency SHALL be under 120ms
- **AND** the system SHALL remain stable without request timeouts or failures
- **AND** the gateway SHALL gracefully handle the load without resource exhaustion

High load conditions test the gateway's ability to maintain performance under stress. The p50 latency should remain under 60ms, which represents a 3x increase from the low-load case. The p95 latency should remain under 120ms, maintaining approximately a 2x ratio with p50. The system should remain stable and should not experience resource exhaustion or failures under these conditions.

## Latency Measurement Accuracy

Accurate and reproducible latency measurements are essential for understanding gateway performance and detecting regressions. The measurement system itself must be precise and reliable.

### Requirement 3.1: Full request lifecycle measurement

Latency measurements must capture the complete request lifecycle to provide accurate performance data.

**Scenario: Measurement includes full request lifecycle**

- **GIVEN** a request is being processed through the gateway
- **WHEN** latency is measured
- **THEN** the measurement SHALL include gateway routing time
- **AND** the measurement SHALL include request and response serialization
- **AND** the measurement SHALL include network time to communicate with the backend
- **AND** the measurement SHALL exclude backend processing time
- **AND** the measurement boundaries SHALL be clearly defined and documented

A complete latency measurement must capture all time spent within the gateway, from the moment the request is received until the response is sent. This includes time spent parsing and validating the request, looking up the appropriate backend, serializing the request for transmission to the backend, waiting for the backend response, and serializing the response for the client. Backend processing time must be excluded as it is outside the gateway's control.

### Requirement 3.2: Reproducible measurements

Latency measurements must be reproducible across test runs to enable meaningful comparison and regression detection.

**Scenario: Measurements are reproducible**

- **GIVEN** the same latency test is executed multiple times
- **WHEN** results are compared
- **THEN** the p50 latency variance SHALL be under 10% between runs
- **AND** the test environment SHALL be fully documented and reproducible
- **AND** statistical outliers SHALL be excluded from comparison calculations
- **AND** a minimum sample size SHALL be required for valid comparison

Reproducibility is essential for detecting regressions and understanding performance trends. The p50 variance between runs should be under 10% when run under identical conditions, indicating that the measurement system is stable and reliable. The test environment must be fully documented, including hardware specifications, software versions, and configuration parameters, to enable others to reproduce results.

### Requirement 3.3: High precision timing

The timing system must provide sufficient precision to accurately measure gateway latency, which operates in the millisecond and sub-millisecond range.

**Scenario: High precision timing**

- **GIVEN** latency measurements are being performed
- **WHEN** timing is captured
- **THEN** the timing resolution SHALL be sub-millisecond
- **AND** a monotonic clock SHALL be used to prevent issues with system time changes
- **AND** the timer overhead SHALL be measurable and documented
- **AND** the timing implementation SHALL not introduce significant measurement bias

Sub-millisecond timing resolution is essential for accurately measuring gateway latency, which typically operates in the 20-100ms range. A monotonic clock should be used to prevent issues that can occur when the system clock is adjusted during testing. The overhead introduced by the timing system itself should be documented and measured to ensure it does not significantly bias the results.

## Latency Under Concurrent Requests

The gateway must maintain latency targets when handling multiple concurrent requests. This is critical for real-world usage where multiple clients may be interacting with the system simultaneously.

### Requirement 4.1: Latency with 10 concurrent requests

The gateway should handle moderate concurrent load without significant latency impact.

**Scenario: Latency with 10 concurrent requests**

- **GIVEN** the gateway is configured and running
- **WHEN** 10 requests are processed concurrently
- **THEN** the average latency SHALL be under 50ms
- **AND** no single request SHALL exceed 100ms
- **AND** all requests SHALL complete successfully
- **AND** the system SHALL demonstrate efficient handling of concurrency

Ten concurrent requests represent a typical scenario for a moderately loaded gateway. The average latency should remain under 50ms, and no individual request should exceed 100ms. This demonstrates that the gateway can efficiently handle concurrent requests without significant queueing or resource contention.

### Requirement 4.2: Latency with 50 concurrent requests

The gateway should handle higher concurrent load while maintaining acceptable latency.

**Scenario: Latency with 50 concurrent requests**

- **GIVEN** the gateway is configured and running
- **WHEN** 50 requests are processed concurrently
- **THEN** the average latency SHALL be under 60ms
- **AND** the p95 latency SHALL be under 150ms
- **AND** all requests SHALL complete successfully
- **AND** the system SHALL demonstrate efficient thread or connection management

Fifty concurrent requests represent a heavier load scenario. The average latency should remain under 60ms, representing a modest increase from the 10-request case. The p95 latency should remain under 150ms, indicating that the vast majority of requests complete quickly even under concurrent load. The system should demonstrate efficient use of resources without significant queueing delays.

### Requirement 4.3: Latency with 100 concurrent requests

The gateway should handle heavy concurrent load while maintaining system stability.

**Scenario: Latency with 100 concurrent requests**

- **GIVEN** the gateway is configured and running
- **WHEN** 100 requests are processed concurrently
- **THEN** the average latency SHALL be under 80ms
- **AND** the system SHALL remain stable without failures
- **AND** all requests SHALL complete successfully
- **AND** resource utilization SHALL be within acceptable bounds

One hundred concurrent requests represent a heavy load scenario that tests the gateway's scalability. The average latency should remain under 80ms, showing that the gateway can handle substantial concurrency while maintaining acceptable performance. The system must remain stable without failures, memory leaks, or resource exhaustion.

## Latency Component Breakdown

The gateway must provide visibility into the breakdown of latency by component. This enables developers to identify and address performance bottlenecks.

### Requirement 5.1: Serialization overhead measurement

The time spent on request and response serialization must be measurable and bounded.

**Scenario: Identify serialization overhead**

- **GIVEN** a request is being processed through the gateway
- **WHEN** latency is measured and broken down by component
- **THEN** the serialization time SHALL be measurable as a separate component
- **AND** the serialization time SHALL be under 5ms for typical requests
- **AND** the measurement SHALL include both request deserialization and response serialization
- **AND** the serialization time SHALL be reported in latency breakdowns

Serialization and deserialization can be significant sources of latency, especially for large request or response payloads. The gateway should provide visibility into how much time is spent on these operations. For typical requests, this should be under 5ms. This measurement helps identify when serialization is becoming a performance bottleneck.

### Requirement 5.2: Routing overhead measurement

The time spent on routing decisions must be measurable and bounded.

**Scenario: Identify routing overhead**

- **GIVEN** a request is being processed through the gateway
- **WHEN** latency is measured and broken down by component
- **THEN** the routing lookup time SHALL be measurable as a separate component
- **AND** the routing lookup time SHALL be under 10ms
- **AND** the measurement SHALL include any configuration or policy lookups
- **AND** the routing time SHALL be reported in latency breakdowns

Routing decisions are core gateway functionality and must be performed efficiently. The time spent on routing lookups, including any policy or configuration checks, should be measurable and should be under 10ms for typical requests. This measurement helps identify when routing logic is becoming a performance bottleneck.

### Requirement 5.3: Backend communication overhead measurement

The time spent communicating with backend servers must be measurable and reported separately.

**Scenario: Identify backend communication overhead**

- **GIVEN** a request is being forwarded to a backend server
- **WHEN** latency is measured and broken down by component
- **THEN** the network time SHALL be measurable as a separate component
- **AND** the network time SHALL be reported separately from gateway processing time
- **AND** the measurement SHALL include connection establishment if applicable
- **AND** the network time SHALL be distinguishable from backend processing time

Network communication with backend servers is often the largest component of overall request latency. The gateway must measure and report this separately to provide clear visibility into where time is being spent. This helps distinguish between gateway performance issues and backend performance issues.

## Latency Reporting

Latency tests must generate comprehensive reports that provide actionable insights into gateway performance.

### Requirement 6.1: Percentile distribution reporting

Latency reports must include comprehensive percentile distribution data.

**Scenario: Report includes percentile distribution**

- **GIVEN** a latency test has completed execution
- **WHEN** the report is generated
- **THEN** the report SHALL include p50, p75, p90, p95, and p99 latency values
- **AND** a histogram of latency distribution SHALL be included
- **AND** outliers SHALL be listed with their latency values
- **AND** the report SHALL include the total number of requests sampled

Comprehensive percentile reporting provides a complete picture of latency distribution. The report should include standard percentiles (p50, p75, p90, p95, p99) as well as a histogram showing the full distribution. Outliers should be called out separately for investigation. The sample size should be reported to provide context for the statistical significance of the results.

### Requirement 6.2: Baseline comparison reporting

Latency reports must compare results against baseline measurements to identify changes.

**Scenario: Report includes comparison with baseline**

- **GIVEN** a latency test has completed execution
- **WHEN** the report is generated
- **THEN** the report SHALL compare results against a documented baseline
- **AND** changes SHALL be quantified as percentages
- **AND** regressions SHALL be clearly flagged
- **AND** improvements SHALL also be documented and highlighted

Baseline comparison is essential for detecting performance regressions and improvements. The report should compare current results against a documented baseline and quantify changes as percentages. Regressions should be clearly flagged to draw attention to potential issues. Improvements should also be documented to track performance gains over time.

### Requirement 6.3: Latency source identification

Latency reports must identify the sources of latency and provide actionable recommendations.

**Scenario: Report identifies latency sources**

- **GIVEN** a latency test has completed execution
- **WHEN** the report is generated
- **THEN** the report SHALL identify the slowest operations
- **AND** suggestions for improvement SHALL be provided
- **AND** trends SHALL be tracked over time with historical data
- **AND** the report SHALL include recommendations for optimization

The report should go beyond raw data to provide actionable insights. This includes identifying the slowest operations, suggesting specific improvements, and tracking trends over time. Recommendations should be practical and based on the specific latency patterns observed in the test results.

## Test Execution Requirements

This section defines the requirements for executing latency tests to ensure accurate and reproducible results.

### Test Environment Requirements

The test environment must be carefully controlled to ensure accurate and reproducible results. The hardware specifications, including CPU, memory, and network configuration, must be documented. Software versions, including the gateway version, operating system, and dependencies, must be recorded. The test environment should be isolated from other systems to prevent interference. Network conditions should be stable and consistent across test runs. The gateway should be configured in a production-representative manner.

### Test Data Requirements

Test data must be representative of real-world usage to provide meaningful results. Request payloads should be typical of actual gateway usage patterns. A mix of request types should be included to test various code paths. Request sizes should span the range from small to large payloads. The test data should be documented and reproducible across test runs.

### Measurement Methodology

The measurement methodology must be rigorous to ensure accurate results. Warm-up periods should be included to allow the system to reach steady state. A sufficient number of samples should be collected for statistical significance. Outliers should be handled according to documented rules. The measurement code should have minimal overhead to avoid biasing results.

## Acceptance Criteria

For a latency test run to be considered successful, all of the following criteria must be met:

1. All p50, p95, and p99 latency targets are met under the specified conditions
2. Latency consistency requirements are met across load levels
3. Measurement accuracy requirements are satisfied
4. Concurrent request requirements are met
5. Component breakdown is provided with all required metrics
6. Reports include all required percentile distributions
7. Baseline comparison is performed and documented
8. All test execution requirements are satisfied

## Implementation Notes

This specification should be implemented using established performance testing frameworks. Tests should be integrated into the continuous integration pipeline to prevent regressions. Historical data should be collected to track performance trends over time. Alerts should be configured to notify the team when latency targets are not met.

The latency tests should be designed to run in both development and production-like environments. In development environments, tests can run with lower load to provide quick feedback. In production-like environments, tests should run with realistic load levels to validate performance under stress conditions.
