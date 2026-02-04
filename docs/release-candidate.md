# Release Candidate Documentation

This document provides specific information for Goblin MCP Gateway release candidate, including upgrade instructions, known issues, and migration guidance.

## Release Information

**Version**: v0.4.0-rc.1
**Release Date**: 2026-02-04
**Status**: Release Candidate (RC)
**Target Audience**: Testing and evaluation

## Upgrade Guide

### From v0.3.0 to v0.4.0-rc.1

#### Breaking Changes

1. **Authentication Mode Change**
   - `dev` mode is now deprecated
   - `apikey` mode is the new default
   - API keys required for all clients

2. **Configuration Schema Updates**
   - New `auth.users` array for user management
   - New `gateway.tls` configuration for HTTPS
   - Enhanced `policies` with rate limiting

3. **API Changes**
   - New security endpoints (`/security`, `/v1/security/*`)
   - New user management endpoints (`/v1/users/*`)
   - Enhanced status endpoint with security information

#### Migration Steps

1. **Backup Current Configuration**
   ```bash
   cp goblin-config.json goblin-config.json.backup
   ```

2. **Update Configuration File**
   - Change `auth.mode` from `dev` to `apikey`
   - Add API key to `auth.apiKey`
   - Configure TLS if needed
   - Update policies section

3. **Update Environment Variables**
   ```bash
   export GOBLIN_AUTH_MODE=apikey
   export GOBLIN_API_KEY=your-new-api-key
   ```

4. **Update Client Applications**
   - Add API key to client requests
   - Update authentication headers
   - Handle new authentication errors

#### Configuration Migration Example

**Old Configuration**:

```json
{
  "auth": {
    "mode": "dev"
  }
}
```

**New Configuration**:

```json
{
  "auth": {
    "mode": "apikey",
    "apiKey": "your-secret-api-key",
    "users": [
      {
        "username": "admin",
        "apiKey": "admin-key-123",
        "roles": ["admin", "developer"]
      }
    ]
  }
}
```

### From Earlier Versions

#### v0.2.0 and Earlier

1. **Complete Configuration Rewrite**
   - All configuration fields have changed
   - New authentication system
   - New security features

2. **API Endpoint Changes**
   - New security endpoints
   - New user management endpoints
   - Enhanced status endpoints

3. **Client Updates Required**
   - Authentication headers
   - Error handling
   - New API responses

## Known Issues

### Critical Issues

1. **Rate Limiting Not Fully Implemented**
   - Rate limiting works at gateway level
   - Per-server rate limiting is not yet implemented
   - May cause unexpected behavior under load

2. **TLS Certificate Validation**
   - Self-signed certificates may cause issues
   - Certificate chain validation not fully implemented
   - May require additional configuration

### Major Issues

1. **User Management Limitations**
   - User deletion not fully implemented
   - Role inheritance not working
   - API key rotation not automated

2. **Audit Logging Performance**
   - High volume audit logging may impact performance
   - Audit log retention not configurable
   - Log rotation not fully implemented

### Minor Issues

1. **Security Scan Performance**
   - Security scans may take longer than expected
   - Scan results may not be comprehensive
   - Scan scheduling not implemented

2. **Documentation Gaps**
   - Some CLI commands not fully documented
   - API examples may be incomplete
   - Configuration examples may be outdated

## Workarounds

### Rate Limiting Issues

**Workaround**: Implement client-side rate limiting

```javascript
// Client-side rate limiting
class RateLimitedClient {
  constructor(apiKey, rateLimit = 60) {
    this.apiKey = apiKey;
    this.rateLimit = rateLimit;
    this.requests = 0;
    this.windowStart = Date.now();
  }

  async callTool(tool, args) {
    this._checkRateLimit();
    return this._makeRequest(tool, args);
  }

  _checkRateLimit() {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    
    if (now - this.windowStart > windowDuration) {
      this.windowStart = now;
      this.requests = 0;
    }
    
    if (this.requests >= this.rateLimit) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests++;
  }
}
```

### TLS Certificate Issues

**Workaround**: Use trusted certificate authorities

```bash
# Generate certificate with trusted CA
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Or use Let's Encrypt for production
certbot certonly --standalone -d your-domain.com
```

### User Management Issues

**Workaround**: Manual user management via API

```bash
# Create user via API
curl -X POST http://localhost:3000/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePassword123!",
    "roles": ["developer"],
    "active": true
  }'

# Update user via API
curl -X PUT http://localhost:3000/v1/users/newuser \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["developer", "auditor"],
    "active": true
  }'
```

## Performance Considerations

### Known Performance Issues

1. **Security Overhead**
   - Authentication adds 10-20ms per request
   - Authorization adds 5-10ms per request
   - Audit logging adds 2-5ms per request

2. **Memory Usage**
   - User session storage increases memory usage
   - Audit log retention may cause memory growth
   - TLS session cache may increase memory usage

### Performance Optimization

#### Configuration Optimization

```json
{
  "policies": {
    "outputSizeLimit": 65536,
    "defaultTimeout": 30000,
    "maxConnections": 1000,
    "rateLimit": {
      "requestsPerMinute": 600,
      "burstSize": 100
    },
    "auditLogging": {
      "enabled": true,
      "batchSize": 100,
      "flushInterval": 60000
    }
  }
}
```

#### Client Optimization

```javascript
// Batch requests to reduce overhead
async function batchToolCalls(calls) {
  const results = [];
  
  for (const call of calls) {
    results.push(await client.callTool(call.tool, call.args));
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  }
  
  return results;
}
```

## Security Considerations

### Security Limitations

1. **Authentication Strength**
   - API keys are static (no rotation)
   - No multi-factor authentication
   - No IP-based restrictions

2. **Authorization Scope**
   - Role-based access control is basic
   - No attribute-based access control
   - No context-aware authorization

3. **Audit Trail**
   - Audit logs are not tamper-proof
   - Log retention is not configurable
   - No real-time alerting

### Security Best Practices

#### API Key Management

```bash
# Generate secure API keys
openssl rand -hex 32

# Store API keys securely
export GOBLIN_API_KEY=$(openssl rand -hex 32)

# Rotate API keys regularly
echo "New API key: $(openssl rand -hex 32)"
```

#### Network Security

```bash
# Use firewall rules
iptables -A INPUT -p tcp --dport 3000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP

# Use VPN for remote access
openvpn --config server.conf
```

#### Monitoring and Alerting

```javascript
// Monitor security events
const securityEvents = [
  'AUTH-002', // Invalid API key
  'AUTH-007', // Rate limit exceeded
  'AUTH-008', // Permission denied
  'SECURITY-004', // Unauthorized access attempt
  'SECURITY-005'  // Suspicious activity detected
];

// Alert on security events
setInterval(() => {
  const alerts = getRecentSecurityEvents();
  if (alerts.length > 0) {
    sendAlert('Security events detected', alerts);
  }
}, 60000);
```

## Compatibility Matrix

### Client Compatibility

| Client Type | Compatible | Notes |
|-------------|------------|-------|
| MCP Clients | ✅ | All standard MCP clients |
| REST Clients | ✅ | API key authentication required |
| WebSocket Clients | ✅ | API key authentication required |
| CLI Tools | ✅ | API key authentication required |

### Server Compatibility

| Server Type | Compatible | Notes |
|-------------|------------|-------|
| Stdio Servers | ✅ | No changes required |
| HTTP Servers | ✅ | API key authentication required |
| SSE Servers | ✅ | API key authentication required |
| Custom Servers | ✅ | May need authentication updates |

### Language/Framework Support

| Language | Compatible | Notes |
|----------|------------|-------|
| TypeScript | ✅ | Full support |
| JavaScript | ✅ | Full support |
| Python | ✅ | HTTP client required |
| Java | ✅ | HTTP client required |
| Go | ✅ | HTTP client required |
| Rust | ✅ | HTTP client required |

## Troubleshooting

### Common Issues

#### Authentication Issues

**Symptom**: `AUTH-001: Authentication required`
**Cause**: Missing or invalid API key
**Solution**: Add API key to request headers

```bash
# Add API key to headers
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/status
```

**Symptom**: `AUTH-002: Invalid API key`
**Cause**: Incorrect API key
**Solution**: Verify API key configuration

```bash
# Check API key in configuration
grep "apiKey" goblin-config.json
```

#### Rate Limiting Issues

**Symptom**: `AUTH-007: Rate limit exceeded`
**Cause**: Too many requests
**Solution**: Implement client-side rate limiting

```bash
# Check current rate limit status
goblin security policies list
```

#### TLS Issues

**Symptom**: `SECURITY-006: Certificate validation failed`
**Cause**: Invalid or untrusted certificate
**Solution**: Use trusted certificate authority

```bash
# Check certificate details
openssl x509 -in cert.pem -text -noout
```

### Debug Commands

#### Security Debug

```bash
# Check security status
goblin security status

# Run security scan
goblin security scan

# View audit logs
goblin security audit --limit 50

# Check user management
goblin users list
```

#### Performance Debug

```bash
# Check performance metrics
goblin metrics

# Monitor memory usage
goblin health --verbose

# Check rate limiting status
goblin security rate-limit status
```

#### Configuration Debug

```bash
# Validate configuration
goblin config validate

# Show current configuration
goblin config show --json

# Check TLS configuration
goblin config show --json | jq '.gateway.tls'
```

## Testing in Release Candidate

### Test Scenarios

#### Security Testing

1. **Authentication Tests**
   - Test with valid API keys
   - Test with invalid API keys
   - Test with expired tokens
   - Test with missing authentication

2. **Authorization Tests**
   - Test role-based access
   - Test permission-based access
   - Test policy enforcement
   - Test audit logging

3. **Rate Limiting Tests**
   - Test rate limit enforcement
   - Test burst size handling
   - Test rate limit reset
   - Test client-side rate limiting

#### Performance Testing

1. **Load Testing**
   - Test with concurrent users
   - Test with high request volume
   - Test with large payloads
   - Test with complex operations

2. **Stress Testing**
   - Test under maximum load
   - Test with resource exhaustion
   - Test with network failures
   - Test with configuration changes

3. **Scalability Testing**
   - Test horizontal scaling
   - Test vertical scaling
   - Test with multiple servers
   - Test with distributed clients

### Test Environment Setup

#### Test Configuration

```json
{
  "auth": {
    "mode": "apikey",
    "apiKey": "test-api-key-123",
    "users": [
      {
        "username": "test-admin",
        "apiKey": "test-admin-key-456",
        "roles": ["admin", "developer"]
      },
      {
        "username": "test-user",
        "apiKey": "test-user-key-789",
        "roles": ["developer"]
      }
    ]
  },
  "policies": {
    "outputSizeLimit": 1024,
    "defaultTimeout": 5000,
    "maxConnections": 10,
    "rateLimit": {
      "requestsPerMinute": 10,
      "burstSize": 2
    }
  }
}
```

#### Test Scripts

```bash
#!/bin/bash
# Test authentication
function test_auth() {
  echo "Testing authentication..."
  curl -H "Authorization: Bearer test-api-key-123" http://localhost:3000/status
  curl -H "Authorization: Bearer invalid-key" http://localhost:3000/status
  curl http://localhost:3000/status
}

# Test authorization
function test_authz() {
  echo "Testing authorization..."
  curl -H "Authorization: Bearer test-user-key-789" http://localhost:3000/v1/users
  curl -H "Authorization: Bearer test-admin-key-456" http://localhost:3000/v1/users
}

# Test rate limiting
function test_rate_limit() {
  echo "Testing rate limiting..."
  for i in {1..15}; do
    curl -H "Authorization: Bearer test-api-key-123" http://localhost:3000/status &
  done
  wait
}

# Run all tests
test_auth
test_authz
test_rate_limit
```

## Reporting Issues

### Issue Template

When reporting issues, please provide:

1. **Version Information**
   ```
   Goblin Version: v0.4.0-rc.1
   Operating System: [OS name and version]
   Node.js Version: [Node.js version]
   ```

2. **Steps to Reproduce**
   ```
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]
   ```

3. **Expected Behavior**
   ```
   [Describe what you expected to happen]
   ```

4. **Actual Behavior**
   ```
   [Describe what actually happened]
   ```

5. **Error Messages**
   ```
   [Include any error messages or stack traces]
   ```

6. **Configuration**
   ```json
   {
     "auth": {
       "mode": "apikey",
       "apiKey": "your-api-key"
     }
   }
   ```

### Issue Categories

1. **Critical**: System crashes, data loss, security vulnerabilities
2. **Major**: Major functionality broken, performance issues
3. **Minor**: Minor functionality issues, documentation errors
4. **Enhancement**: Feature requests, improvements

### Issue Priority

1. **P0**: System down, data loss, security breach
2. **P1**: Major functionality broken, performance critical
3. **P2**: Functionality issues, performance degradation
4. **P3**: Minor issues, documentation, enhancements

## Release Timeline

### Current Phase: Release Candidate

**Start**: 2026-02-04
**Duration**: 2 weeks (estimated)
**Goal**: Identify and fix critical issues before stable release

### Testing Phase

**Week 1**: Basic functionality testing
**Week 2**: Advanced testing and performance evaluation
**Week 3**: Security testing and audit

### Bug Fixing Phase

**Week 4**: Critical bug fixes
**Week 5**: Major bug fixes
**Week 6**: Minor bug fixes and documentation

### Stable Release

**Target**: v0.4.0 (stable)
**Timeline**: 6 weeks from RC start (estimated)
**Criteria**: All critical issues resolved, performance acceptable

## Support

### Community Support

- **GitHub Issues**: Report bugs and feature requests
- **Discord Server**: Real-time support and discussion
- **Mailing List**: Announcements and updates
- **Documentation**: Comprehensive documentation and guides

### Enterprise Support

For enterprise support, please contact:
- **Email**: support@talkingthreads.com
- **Phone**: +1-555-0123
- **SLA**: 24/7 support with guaranteed response times

## Feedback

We welcome your feedback on the release candidate:

1. **What works well?**
2. **What needs improvement?**
3. **What features are missing?**
4. **What issues did you encounter?**

Please share your feedback via:
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time discussion
- **Email**: Direct feedback to development team
- **Survey**: Periodic user surveys

## Conclusion

The v0.4.0 release candidate introduces significant security enhancements and new features. While there are known issues, the core functionality is stable and ready for testing.

**Next Steps**:
1. Test the release candidate in your environment
2. Report any issues or feedback
3. Help us identify critical issues before stable release
4. Prepare for migration to stable v0.4.0

**Thank you** for helping us improve Goblin MCP Gateway!