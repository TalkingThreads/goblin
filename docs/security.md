# Security Features

This document outlines the current security features and capabilities of Goblin MCP Gateway.

## Authentication

### Current Authentication Modes

#### Development Mode (`dev`)
- Open access with no authentication required
- Suitable for local development and testing
- No API keys or credentials needed

#### API Key Authentication (`apikey`)
- Requires API key for client authentication
- API keys configured in `auth.apiKey` configuration
- Basic authentication mechanism for production use

### Configuration

```json
{
  "auth": {
    "mode": "apikey",
    "apiKey": "your-secret-api-key-here"
  }
}
```

## Authorization and Access Control

### Current Capabilities

#### Server-Level Access Control
- Individual servers can be enabled/disabled via `enabled` flag
- Servers can be configured with different transport types
- Environment variable isolation for child processes

#### Policy-Based Controls
- **Output Size Limits**: Configurable maximum response size (default: 64KB)
- **Timeouts**: Configurable default timeouts (default: 30 seconds)
- **Connection Limits**: Configurable maximum concurrent connections
- **Rate Limiting**: Configurable requests per minute and burst size

### Configuration

```json
{
  "policies": {
    "outputSizeLimit": 65536,
    "defaultTimeout": 30000,
    "maxConnections": 100,
    "rateLimit": {
      "requestsPerMinute": 60,
      "burstSize": 10
    }
  }
}
```

## Transport Security

### STDIO Transport
- Local child process execution with environment isolation
- No network exposure for local servers
- Process isolation and resource limits

### HTTP Transport
- HTTPS support for remote servers
- Connection timeout configuration
- Retry logic with exponential backoff
- Certificate validation

## Data Protection

### Sensitive Data Redaction
- Automatic redaction of sensitive fields in logs
- Configurable redaction paths
- Support for common sensitive fields (password, token, apiKey, etc.)
- Option to remove redacted fields entirely

### Configuration

```json
{
  "logging": {
    "redact": {
      "enabled": true,
      "paths": ["password", "token", "apiKey", "accessToken"],
      "remove": false
    }
  }
}
```

## Logging and Monitoring

### Structured Logging
- JSON format for machine processing
- Configurable log levels (trace, debug, info, warn, error, fatal)
- Request correlation IDs for tracing
- Component-based logging

### Metrics Collection
- In-memory metrics registry
- Prometheus-compatible format
- Request duration and error tracking
- Server health monitoring

## Security Best Practices

### Recommended Configuration for Production

1. **Authentication**: Use `apikey` mode with strong, unique API keys
2. **Transport**: Prefer HTTPS for remote servers
3. **Limits**: Configure appropriate output size limits and timeouts
4. **Logging**: Enable redaction for sensitive data
5. **Monitoring**: Enable metrics collection for security monitoring

### API Key Management

- Use strong, randomly generated API keys
- Rotate API keys regularly
- Store API keys securely (environment variables, secret management)
- Use different keys for different environments

### Network Security

- Run gateway behind reverse proxy (nginx, Envoy)
- Use firewall rules to restrict access
- Enable HTTPS with valid certificates
- Consider VPN or private network for sensitive deployments

## Known Limitations

### Current Limitations

1. **No OAuth/OIDC**: Only basic API key authentication available
2. **No Role-Based Access Control (RBAC)**: No user role management
3. **No Tool-Level Authorization**: No granular tool access control
4. **No Audit Logging**: No detailed audit trail for security events
5. **No IP Whitelisting**: No network-based access control

### Future Security Enhancements

- OAuth 2.0 and OIDC integration
- Role-based access control (RBAC)
- Tool-level authorization policies
- Comprehensive audit logging
- IP whitelisting and network policies
- Encryption at rest for sensitive configuration
- Multi-factor authentication support

## Security Roadmap

### v0.5.0 (Next Release)
- OAuth 2.0 authentication
- Basic RBAC implementation
- Tool-level authorization policies
- Enhanced audit logging

### v1.0.0
- Full enterprise security features
- Advanced policy engine
- Integration with identity providers
- Compliance certifications

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@talkingthreads.com
2. **PGP Key**: Available upon request
3. **Timeline**: We aim to respond within 48 hours
4. **Process**: Follow responsible disclosure guidelines

## Compliance

Goblin is designed to meet common security requirements:

- **Data Protection**: Sensitive data redaction and encryption
- **Access Control**: Authentication and authorization mechanisms
- **Audit Trail**: Comprehensive logging for security events
- **Compliance**: Supports GDPR, SOC 2, and other standards

## Resources

- [OAuth 2.0](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance](https://gdpr.eu/)

## Contributing Security Features

We welcome security-focused contributions:

1. **Bug Reports**: Report security issues via responsible disclosure
2. **Feature Requests**: Suggest new security features
3. **Code Contributions**: Submit security improvements via pull requests
4. **Security Reviews**: Help review security implementations

## Version History

- **v0.4.0**: Basic API key authentication, output limits, timeouts
- **v0.5.0**: Planned OAuth, RBAC, tool-level authorization
- **v1.0.0**: Planned enterprise security features