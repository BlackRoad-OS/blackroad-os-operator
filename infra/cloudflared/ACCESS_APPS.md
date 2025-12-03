# BlackRoad Zero Trust Access Applications

## Overview

All BlackRoad services are protected by Cloudflare Access (Zero Trust).
No public endpoints without authentication.

---

## Access Application Matrix

| Application | Hostname | Auth Methods | Policy |
|-------------|----------|--------------|--------|
| BlackRoad App | app.blackroad.io | Google, Email OTP | Allow: BlackRoad-Core |
| BlackRoad API | api.blackroad.io | Service Token, Google | Allow: BlackRoad-Core, CI/CD |
| BlackRoad Console | console.blackroad.io | Google, Email OTP | Allow: BlackRoad-Core |
| CECE AI Gateway | cece.blackroad.io | Service Token | Allow: Agents, CI/CD |
| Identity Service | identity.blackroad.io | Service Token | Allow: Agents |
| Dashboard | dashboard.blackroad.io | Google | Allow: BlackRoad-Core |
| Studio | studio.blackroad.io | Google | Allow: BlackRoad-Core |
| Finance | finance.blackroad.io | Google | Allow: BlackRoad-Finance |
| Preview Wildcard | *.preview.blackroad.io | Google | Allow: BlackRoad-Dev |

---

## Identity Groups

### BlackRoad-Core
- amundsonalexa@gmail.com (Owner)
- blackroad.systems@gmail.com (System)

### BlackRoad-Dev
- BlackRoad-Core members
- Approved contractors

### BlackRoad-Finance
- amundsonalexa@gmail.com only

### Agents (Service Tokens)
- `br-agent-cece` - CECE AI Gateway
- `br-agent-identity` - Identity service
- `br-ci-github` - GitHub Actions

---

## Service Token Setup

```bash
# Create service token via Cloudflare dashboard or API
# Store in GitHub Secrets as:
#   CF_ACCESS_CLIENT_ID
#   CF_ACCESS_CLIENT_SECRET

# Usage in requests:
curl -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
     https://api.blackroad.io/health
```

---

## Access Policy Templates

### Allow BlackRoad-Core
```json
{
  "decision": "allow",
  "include": [
    { "email": { "email": "amundsonalexa@gmail.com" } },
    { "email": { "email": "blackroad.systems@gmail.com" } }
  ]
}
```

### Allow Service Token + Core
```json
{
  "decision": "allow",
  "include": [
    { "service_token": {} },
    { "email": { "email": "amundsonalexa@gmail.com" } }
  ]
}
```

---

## Quick Setup Commands

```bash
# 1. Create Access Application (via wrangler or dashboard)
# Dashboard: https://one.dash.cloudflare.com/848cf0b18d51e0170e0d1537aec3505a/access/apps

# 2. Add application
# - Name: BlackRoad App
# - Domain: app.blackroad.io
# - Session Duration: 24h
# - Identity providers: Google, One-time PIN

# 3. Add policy
# - Name: Allow Core Team
# - Action: Allow
# - Include: Emails ending in specific list
```

---

## Validation

```bash
# Should return 302 to Cloudflare Access login
curl -I https://app.blackroad.io

# With service token, should return 200
curl -I -H "CF-Access-Client-Id: $ID" \
        -H "CF-Access-Client-Secret: $SECRET" \
        https://api.blackroad.io/health
```

---

*Created: 2025-12-03*
*Owner: Alexa Louise Amundson*
