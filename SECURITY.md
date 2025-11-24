# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our website seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to https://github.com/quocthang0507/quocthang0507.github.io/security/advisories/new
   - Click "Report a vulnerability"
   - Provide detailed information about the vulnerability

2. **Private Contact**
   - Contact: [@quocthang0507](https://github.com/quocthang0507)
   - Please include "[SECURITY]" in the subject line

### What to Include

Please include as much information as possible:

- Type of vulnerability (XSS, CSRF, SQL injection, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Development**: Depends on severity and complexity
- **Public Disclosure**: After fix is deployed and verified

## Security Measures Implemented

### 1. Dependency Management
- ✅ Regular dependency updates
- ✅ Automated vulnerability scanning (npm audit, bundler-audit)
- ✅ No dependencies with known CVEs

### 2. Code Security
- ✅ CodeQL static analysis enabled
- ✅ No use of dangerous functions (eval, document.write)
- ✅ Input sanitization for user-facing features
- ✅ XSS prevention measures

### 3. Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Content-Security-Policy
- ✅ Permissions-Policy

### 4. HTTPS & Transport Security
- ✅ HTTPS enforced (via GitHub Pages)
- ✅ HSTS enabled by default (GitHub Pages)

### 5. Best Practices
- ✅ Secure coding guidelines followed
- ✅ Regular security audits
- ✅ Automated minification and optimization
- ✅ Security utility functions for common operations

## Security Audits

### Latest Audit: 2025-11-24
- **NPM Packages**: 0 vulnerabilities
- **Ruby Gems**: 0 vulnerabilities  
- **CodeQL**: 0 alerts
- **Overall Score**: 9/10

## Scope

### In Scope
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- SQL Injection (if applicable)
- Authentication/Authorization issues
- Server-Side Request Forgery (SSRF)
- Information Disclosure
- Insecure Direct Object References
- Security Misconfigurations

### Out of Scope
- Denial of Service (DoS) attacks
- Social engineering attacks
- Physical attacks
- Issues in third-party services (Bootstrap, Font Awesome, etc.)
- Issues that require physical access to a user's device

## Acknowledgments

We appreciate the security research community's efforts in making the web safer. Security researchers who responsibly disclose vulnerabilities will be acknowledged here (with their permission):

<!-- List of security researchers who have helped -->
- None yet - be the first!

## Security Best Practices for Contributors

If you're contributing to this project:

1. **Never commit secrets** (API keys, passwords, tokens)
2. **Sanitize user input** before using in HTML/JS
3. **Use textContent instead of innerHTML** when possible
4. **Validate and escape** all dynamic content
5. **Test your changes** for security implications
6. **Follow OWASP guidelines** for secure coding
7. **Keep dependencies updated**
8. **Review CodeQL alerts** before merging

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)

## Contact

For non-security related issues, please open a regular GitHub issue.

For security concerns, use the methods described above.

---

**Last Updated**: 2025-11-24
**Version**: 1.0
