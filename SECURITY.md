# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email: **<antovinoth7@gmail.com>**

Include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You can expect an initial response within 72 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Practices

### Authentication

- Firebase Authentication (email/password) with client-side rate limiting
- Auth tokens refreshed every 45–50 minutes (tokens expire at 60 minutes)
- Password policy enforces minimum 8 characters with uppercase and numeric requirements for new accounts

### Data Access

- All Firestore queries are scoped to the authenticated user via `user_id`
- Firestore security rules enforce document-level ownership checks
- Ownership is verified before update and delete operations

### Data Storage

- No sensitive data is stored in Firebase Storage (images are device-local only)
- Firestore stores only text metadata and filenames
- Local cache uses AsyncStorage (device-level security)

### Error Handling

- Sensitive context keys (password, token, email, etc.) are redacted from error logs
- User-facing error messages do not expose internal details or file paths
- Auth errors use generic messages to prevent email enumeration

### Backup & Import

- ZIP imports are validated for path traversal attacks
- Decompressed file size, count, and per-file limits are enforced
- Filenames are sanitized with a character whitelist

### Dependencies

- Keep dependencies updated regularly
- Review security advisories via `npm audit`
