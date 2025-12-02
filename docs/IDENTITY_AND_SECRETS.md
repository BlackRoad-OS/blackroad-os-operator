# BlackRoad OS - Identity & Secrets Architecture

> "Only the Operator holds real secrets. Everyone else uses aliases via governed API calls."

## Overview

BlackRoad OS uses a layered identity and secrets system:

1. **Secrets Aliases** - Logical names for credentials (`openai.default`)
2. **PS-SHA∞ Identities** - Deterministic 2048-bit identity ciphers
3. **Secrets Perimeter** - Only Cece Operator holds real secrets

```
┌─────────────────────────────────────────────────────────────┐
│                    SECRETS PERIMETER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Cece Operator (Railway)                 │   │
│  │                                                      │   │
│  │  Secrets:           PS-SHA∞ Root:                   │   │
│  │  - OPENAI_API_KEY   - Root cipher (2048 bits)       │   │
│  │  - ANTHROPIC_KEY    - Cece identity                 │   │
│  │  - STRIPE_SECRET    - Agent seeds                   │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │  "use openai.default"
                            │  "verify PS∞-ABC123"
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────┴────┐        ┌─────┴─────┐       ┌────┴────┐
   │  Cece   │        │  30,000   │       │   365   │
   │ Worker  │        │  Agents   │       │Workflows│
   └─────────┘        └───────────┘       └─────────┘
   NO secrets         NO secrets          NO secrets
   HAS fingerprint    HAS fingerprint     Uses aliases
```

---

## 1. Secrets System

### Philosophy

- **One paste, infinite use**: Set a secret once in Railway, use everywhere via aliases
- **No spray**: Agents, workers, packs never see raw API keys
- **Governed access**: Policy engine controls which agents can use which aliases

### Aliases

Defined in `config/secrets.aliases.yaml`:

```yaml
providers:
  openai:
    default:
      env_var: OPENAI_API_KEY
      description: "Primary OpenAI key for Cece operator"
      required: true

  anthropic:
    default:
      env_var: ANTHROPIC_API_KEY
      required: false
```

### Usage in Code

```python
from br_operator.secrets import get_secret, resolve_secret, has_secret

# Required secret (throws if missing)
api_key = get_secret("openai.default")

# Optional secret (returns None if missing)
anthropic_key = resolve_secret("anthropic.default")

# Check availability
if has_secret("stripe.secret"):
    # use Stripe
```

### CLI Tool

```bash
# Show status
./scripts/br-secrets status

# List all aliases
./scripts/br-secrets list

# Get info (no value shown)
./scripts/br-secrets get openai.default

# Sync to Railway
./scripts/br-secrets sync openai.default --to railway
```

### Where Secrets Live

| Environment | Location |
|-------------|----------|
| Local dev | `~/.blackroad/secrets.env` or `.env` |
| Production | Railway env vars (Operator service only) |
| Workers | NO secrets (proxy to Operator) |
| Agents | NO secrets (use aliases via API) |

---

## 2. PS-SHA∞ Identity System

### What is PS-SHA∞?

**PS-SHA∞** (Parallel-Structured SHA-Infinity) is BlackRoad's deterministic identity scheme:

- Takes any secret string (root seed)
- Produces a 2048-bit identity cipher
- Stable, high-entropy, non-reversible
- Used for agent IDs, cluster IDs, verification stamps

### How It Works

```
Input: secret_string + context_label

Round 0: SHA-512("BR-PS-SHA∞-0:{context}" || secret) → 512 bits
Round 1: SHA-512("BR-PS-SHA∞-1:{context}" || secret) → 512 bits
Round 2: SHA-512("BR-PS-SHA∞-2:{context}" || secret) → 512 bits
Round 3: SHA-512("BR-PS-SHA∞-3:{context}" || secret) → 512 bits

Output: 2048-bit cipher (concatenated)
```

### Usage

```python
from br_operator.ps_sha_infinity import (
    ps_sha_infinity_2048,
    ps_sha_infinity_hex,
    derive_agent_identity,
    get_cece_identity,
    create_verification_stamp,
)

# Generate root cipher (from env secret)
root = get_root_cipher()

# Derive agent identity
agent_seed = derive_agent_identity(root, "agent-001")

# Create verification stamp for responses
stamp = create_verification_stamp(root, "API-Response")
# Returns:
# {
#   "owner": "ALEXA LOUISE AMUNDSON",
#   "verified": True,
#   "zeta_time": "ζ-ABC12345",
#   "fingerprint": "PS∞-DEADBEEF",
#   ...
# }
```

### Identity Hierarchy

```
Root Cipher (BR_ROOT_SECRET)
    │
    ├── Cece Identity
    │   └── fingerprint: PS∞-XXXXXXXX
    │
    ├── Agent Identities
    │   ├── agent-001 → PS∞-AAAAAAAA
    │   ├── agent-002 → PS∞-BBBBBBBB
    │   └── ...
    │
    ├── Cluster Identities
    │   ├── lucidia-pi → PS∞-CCCCCCCC
    │   ├── codex-infinity → PS∞-DDDDDDDD
    │   └── ...
    │
    └── Session Identities (time-bound)
        └── session-XYZ-1234567890 → PS∞-EEEEEEEE
```

### Setting the Root Secret

For production, set `BR_ROOT_SECRET`:

```bash
# Generate a secure root
python -c "import secrets; print(secrets.token_hex(32))"

# Set in Railway
BR_ROOT_SECRET=<generated-hex>
```

If not set, the system falls back to deriving from `OPENAI_API_KEY` (for bootstrap only).

---

## 3. Verification & Attribution

### Response Stamps

Every Cece response can include a verification stamp:

```json
{
  "reply": "Hello! I'm Cece...",
  "trace": { ... },
  "__sovereignty": {
    "owner": "ALEXA LOUISE AMUNDSON",
    "verified": true,
    "zeta_time": "ζ-ABC12345",
    "fingerprint": "PS∞-DEADBEEF",
    "signature": "ALA-1234567890-BLACKROAD-VERIFIED"
  }
}
```

### Verifying Authenticity

External systems can verify by:

1. Checking the fingerprint matches known Cece identity
2. Validating the zeta_time is recent
3. Confirming signature format

### Agent Attribution

When agents perform actions:

```python
# Agent invocation is logged with identity
{
    "agent_id": "agent-001",
    "fingerprint": "PS∞-AAAAAAAA",
    "action": "notion:create_page",
    "ledger_event": "evt_12345"
}
```

---

## 4. Security Model

### What's Protected

| Asset | Protection |
|-------|------------|
| Raw API keys | Only in Railway env vars (Operator) |
| Root cipher | Derived from BR_ROOT_SECRET (never stored raw) |
| Agent identities | Derived from root (deterministic, stable) |
| Verification stamps | Include fingerprints (verifiable) |

### What's Safe to Store

| Asset | Can Store In Git? |
|-------|-------------------|
| `secrets.aliases.yaml` | ✓ Yes (no actual secrets) |
| Fingerprints (`PS∞-XXX`) | ✓ Yes (non-reversible) |
| Verification stamps | ✓ Yes (public data) |
| Raw API keys | ✗ NEVER |
| Root secret | ✗ NEVER |

### Attack Surface

- **Workers** (Cece edge): Can't access secrets, only forward requests
- **Agents**: Can't access secrets, must request via governed API
- **Operator**: Has secrets, but access is:
  - Policy-controlled
  - Ledger-logged
  - Rate-limited

---

## 5. Migration & Backup

### Changing Root Secret

If you need to rotate the root secret:

1. Generate new secret
2. Set `BR_ROOT_SECRET_NEW` in Railway
3. Deploy code that checks both old and new
4. After migration period, remove old secret

### Identity Stability

Because identities are **deterministic**:

- Same root secret → same agent fingerprints
- Backups restore with same identities
- Cluster migrations preserve identity

### From Old API Key

If bootstrapping from an old (invalidated) API key:

```python
# Safe: The old key is one-way hashed
# The cipher cannot be reversed to recover the key
root = ps_sha_infinity_2048(old_invalidated_key, "Bootstrap-v1")
```

**Important**: The old key must be invalidated at the provider first.

---

## Quick Reference

### Files

| File | Purpose |
|------|---------|
| `config/secrets.aliases.yaml` | Alias definitions |
| `br_operator/secrets.py` | Secrets resolver |
| `br_operator/ps_sha_infinity.py` | Identity system |
| `scripts/br-secrets` | CLI tool |

### Environment Variables

| Var | Purpose |
|-----|---------|
| `OPENAI_API_KEY` | Primary LLM (required) |
| `BR_ROOT_SECRET` | PS-SHA∞ root (recommended) |
| `ANTHROPIC_API_KEY` | Secondary LLM (optional) |

### Commands

```bash
# Secrets
./scripts/br-secrets status
./scripts/br-secrets sync openai.default --to railway

# Identity
python -m br_operator.ps_sha_infinity
```

---

*Owner: Alexa Louise Amundson*
*System: BlackRoad OS*
*Version: secrets-v1 / PS-SHA∞ v1*
