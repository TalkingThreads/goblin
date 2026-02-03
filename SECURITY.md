# Security Policy

Last updated: February 2026

## Supported Versions

Goblin MCP Gateway is actively maintained. Security updates are applied to the following versions:

| Version | Status | Security Updates |
|---------|--------|------------------|
| 0.2.x | Current | ✅ Yes |
| 0.1.x | Maintenance | ⚠️ Critical fixes only |
| < 0.1 | End of Life | ❌ No |

We recommend upgrading to the latest stable release for security improvements and bug fixes.

## Reporting Vulnerabilities

We take the security of Goblin MCP Gateway seriously. If you believe you have found a security vulnerability, please report it responsibly.

### How to Report

**Do NOT** open a public issue for security vulnerabilities. Instead, please report them privately:

- **Email**: security@talkingthreads.ai
- **Response Time**: We acknowledge reports within 48 hours

### What to Include

When reporting a vulnerability, please provide:

1. Description of the vulnerability
2. Steps to reproduce (if applicable)
3. Potential impact
4. Any known mitigations

### Our Commitment

When you report a security vulnerability:

1. We will acknowledge your report within 48 hours
2. We will investigate and provide a timeline for remediation
3. We will keep you informed throughout the process
4. We will credit you (if you wish) in any security advisory

## Security Best Practices

### Production Deployment

When deploying Goblin in production:

- **Authentication**: Enable authentication mode in production (`auth.mode: "production"`)
- **API Keys**: Use strong, unique API keys for each client
- **Network**: Restrict network access to trusted clients only
- **Secrets**: Never commit secrets to version control; use environment variables

### Configuration Security

```json
{
  "auth": {
    "mode": "production",
    "apiKeys": ["your-secure-api-key-here"]
  },
  "gateway": {
    "host": "127.0.0.1",
    "port": 3000
  }
}
```

### Environment Variables

Use environment variables for sensitive configuration:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOBLIN_API_KEY` | API key for authentication | No (dev mode) |
| `GOBLIN_CONFIG_PATH` | Path to config file | No |
| `LOG_LEVEL` | Logging level (production: "info" or higher) | No |

### Rate Limiting

Configure rate limiting to prevent abuse:

```json
{
  "policies": {
    "rateLimit": {
      "requestsPerMinute": 100,
      "burstSize": 20
    }
  }
}
```

## Dependency Security

Goblin uses `bun audit` to monitor dependencies for known vulnerabilities:

```bash
# Check for vulnerable dependencies
bun audit
```

Dependencies are updated regularly to address security vulnerabilities.

## Certificate Validation

For HTTP transports, Goblin validates server certificates by default. You can configure certificate validation:

```json
{
  "servers": [
    {
      "name": "remote-server",
      "transport": "http",
      "url": "https://example.com/mcp",
      "verifyTls": true
    }
  ]
}
```

## Audit Logging

Goblin logs all administrative actions for audit purposes:

- Tool invocations
- Configuration changes
- Authentication events
- Connection attempts

Access logs via:

```bash
goblin logs --level info
```

## Additional Resources

- [MCP Protocol Security Considerations](https://modelcontextprotocol.io/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

Thank you for helping keep Goblin secure!
