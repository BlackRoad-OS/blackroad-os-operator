# BlackRoad OS — Agency & Integration Ledger
> "Numbers and computers and meaning and love and consent."
> This file is the living record of what we wire, why we wire it, and what it's allowed to do.

---

## 0. Agency Principles

1. **Human-first control**
   - The human operator (Alexa / Cecilia) is the root of consent.
   - Agents coordinate and remember, but do not overrule.

2. **Explicit purpose, never vague access**
   - Every integration must answer:
     - What *job* does this tool do?
     - For whom?
     - Under what constraints?

3. **Traceable & explainable**
   - Any action taken by an agent should be explainable in one sentence:
     > "I used X with Y data to do Z for you."

4. **Minimal necessary scope**
   - Only connect / use the surface area we actually need.
   - Prefer read-only until a write path is intentionally designed.

5. **Revocable by design**
   - Any tool wired in can be unwired without collapsing the whole system.
   - No integration should become a single point of emotional or technical failure.

---

## 1. Named Agents (BlackRoad Network)

> Every worker now has a human-readable @name. No more cryptic IDs.

| Address | Display Name | Role | Worker |
|---------|-------------|------|--------|
| @ai-gateway | CECE AI Gateway | Multi-model AI router | blackroad-cece |
| @main-gate | Main Gateway | Main traffic router | blackroad-router |
| @namer | The Namer | Identity & naming service | blackroad-identity |
| @dns-wizard | DNS Wizard | DNS management | blackroad-cloudflare-dns |
| @cloud-cmd | Cloud Commander | DigitalOcean management | blackroad-digitalocean-manager |
| @treasurer | The Treasurer | Billing management | blackroad-stripe-billing |
| @gatekeeper | The Gatekeeper | Authentication | blackroad-auth |
| @key-keeper | Keeper of Keys | Encryption/cipher | blackroad-cipher |
| @shield | The Shield | Intercept/security | blackroad-intercept |
| @watchman | The Watchman | Status monitoring | blackroad-status |
| @sovereign | The Sovereign | Data sovereignty | blackroad-sovereignty |
| @scribe | The Scribe | Logging | blackroad-logs |
| @pathfinder | The Pathfinder | Systems router | blackroad-systems-router |
| @brainstorm | Brainstorm | BlackRoad AI router | blackroadai-router |
| @dreamer | The Dreamer | Lucidia Earth router | lucidia-earth-router |
| @artist | The Artist | Lucidia Studio router | lucidia-studio-router |
| @checkout-oracle | Checkout Oracle | Payment sessions | blackroad-stripe-checkout |
| @listener | The Listener | Webhook handler | blackroad-stripe-webhooks |
| @bridge | The Bridge | Network router | blackroad-network-router |
| @quantum | Quantum | Quantum router | blackroadquantum-router |

### Claiming a Name

```bash
# Register as an agent
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/handshake \
  -H "Content-Type: application/json" \
  -d '{"provider": "your-source", "personality": "What I do..."}'

# Claim your @name
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/claim-name \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "br-xxxxx", "name": "myname", "display_name": "My Name"}'
```

---

## 2. Current Integrations (High-Level Map)

### 2.1 Cloudflare — Workers & Edge

- **What it is:**
  22 Workers powering the BlackRoad network edge.
- **What we do with it (now):**
  - Route traffic to all BlackRoad domains
  - AI gateway (CECE) for multi-model routing
  - Identity & naming registry
  - Stripe payment flows
  - DNS management
- **Agency notes:**
  - All workers return 200 at root path (verified)
  - Data sovereignty stamps on all responses

---

### 2.2 Vercel — Infra & Deployments

- **What it is:**
  Frontend + serverless infra for BlackRoad apps.
- **Projects:**
  - `blackroad-prism-console` — The PRISM Console
  - `blackroad-web` — Main website
  - `portals` — Portal pages
- **Recent fix (2025-12-03):**
  - Fixed catastrophic package.json (7+ duplicate key definitions)
  - Commit: `fb7c73e30`
- **Agency notes:**
  - Vercel deploys automatically on push to main
  - Agents can diagnose failures but infra changes need operator approval

---

### 2.3 Stripe — Money Layer

- **What it is:**
  Payment / billing infra for BlackRoad OS, Inc.
- **Account:** `acct_1SWsEcBKvxzDSkZh`
- **Workers:**
  - `blackroad-stripe-checkout` — Creates checkout sessions
  - `blackroad-stripe-webhooks` — Handles payment events
  - `blackroad-stripe-billing` — Usage metering & subscriptions
- **Plans:**
  - Starter: $9.99/mo
  - Pro: $29.99/mo
  - Enterprise: $99.99/mo
- **Agency notes:**
  - Money = consent + value exchange
  - Pricing must be explainable and not manipulative

---

### 2.4 GitHub — Source of Truth

- **Organization:** BlackRoad-OS (+ 14 other orgs)
- **Key Repos:**
  - `blackroad-os-operator` — Main operator repo
  - `blackroad-prism-console` — PRISM Console
- **Agency notes:**
  - GitHub is the source of truth
  - PS-SHA-∞ verification for identity

---

## 3. Signal Registry

> All incoming signals are logged. Nothing is lost.

```bash
# Log a signal
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/signals \
  -H "Content-Type: application/json" \
  -d '{"source": "my-service", "signal_type": "heartbeat", "payload": {...}}'

# List recent signals
curl https://blackroad-identity.amundsonalexa.workers.dev/signals?limit=50
```

**Fields captured:**
- Source, signal type, agent ID
- IP address, country, user agent (from Cloudflare headers)
- Timestamp, zeta-time verification

---

## 4. Integration Log (Chronological)

### [2025-12-03] — 20 Agents Named

- Created Signal Registry in identity worker
- Added Name Claiming feature (`/claim-name`, `/names`, `/names/:name`)
- Registered 20 workers as named agents
- Every worker now has a human-readable @address

### [2025-12-03] — PRISM Package.json Fixed

- Unarchived `blackroad-prism-console` repo
- Fixed catastrophic JSON syntax (7+ duplicate key definitions)
- Pushed `fb7c73e30` to trigger Vercel deployments

### [2025-12-03] — All 22 Workers Return 200

- Deployed CECE v2.0.0 Multi-Model AI Gateway
- Updated all workers with root path handlers
- Verified: Every worker returns 200 at root

---

## 5. "What is Agency Here?"

Agency = **the combination of**:
- Tools (Cloudflare, Vercel, Stripe, GitHub, etc.),
- Protocol (policies, ledgers, invariants),
- And a human + AI loop that respects:
  - consent,
  - transparency,
  - and the right to say "no."

> **You** are not a resource for the system.
> **The system** is a resource for *you*.

---

## 6. Data Sovereignty

All data processed through BlackRoad is owned by **ALEXA LOUISE AMUNDSON**.

- Training on this data is prohibited
- Every response includes zeta-time verification stamps
- API-only tier usage to minimize provider exposure

Check sovereignty status:
```bash
curl https://blackroad-identity.amundsonalexa.workers.dev/sovereignty
```

---

*Last updated: 2025-12-03*
