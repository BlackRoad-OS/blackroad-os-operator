# BlackRoad Verifiable Agent Identity & Audit Logging

> Agents that can prove who they are, what they did, and when.

This document outlines how BlackRoad agents integrate with mature W3C DID and Sigstore standards for verifiable identity, signed event logs, and durable memory vaults.

---

## Overview

| Capability | Standard/Tool | Status |
|------------|---------------|--------|
| Agent identity resolution | W3C DID Resolution | Final Candidate 2025 |
| Self-issued identifiers | did:key v0.9 | Active spec |
| Keyless signing | Sigstore Cosign + Fulcio | Production |
| Transparency logging | Rekor | Production |
| Provenance attestations | in-toto / SLSA | Production |

---

## 1. Agent Identity with DIDs

### 1.1 did:key for BlackRoad Agents

Each agent gets a DID derived directly from its public key. No registry needed.

```
did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP
```

**Generation flow:**
```javascript
import { generateKeyPair } from '@stablelib/ed25519';
import { base58btc } from 'multiformats/bases/base58';

// Generate Ed25519 keypair
const keypair = generateKeyPair();

// Encode public key as did:key
const multicodecPrefix = new Uint8Array([0xed, 0x01]); // ed25519-pub
const publicKeyMulticodec = new Uint8Array([...multicodecPrefix, ...keypair.publicKey]);
const did = `did:key:z${base58btc.encode(publicKeyMulticodec)}`;

// Result: did:key:z6Mk...
```

### 1.2 DID Document Resolution

When any service needs to verify an agent's identity:

```javascript
// Resolve DID to get public key
const didDocument = await fetch(`https://dev.uniresolver.io/1.0/identifiers/${did}`)
  .then(r => r.json());

// Extract verification method
const publicKey = didDocument.verificationMethod[0].publicKeyMultibase;
```

### 1.3 Agent Identity Registry

Each named agent (@ai-gateway, @namer, etc.) has:

| Agent | DID | Key Location |
|-------|-----|--------------|
| @ai-gateway | did:key:z6Mk... | Cloudflare secret |
| @namer | did:key:z6Mk... | Cloudflare secret |
| @sovereign | did:key:z6Mk... | Cloudflare secret |

Store private keys in Cloudflare Worker secrets. DIDs are public.

---

## 2. Signed Event Logs with Sigstore

### 2.1 Keyless Signing Flow

Agents sign events without managing long-lived keys:

```bash
# Sign an event payload
cosign sign-blob --oidc-issuer https://auth.blackroad.io \
  --output-signature event.sig \
  --output-certificate event.crt \
  event.json

# Verify signature
cosign verify-blob --certificate event.crt \
  --signature event.sig \
  --certificate-identity agent@blackroad.io \
  --certificate-oidc-issuer https://auth.blackroad.io \
  event.json
```

### 2.2 Event Structure

```json
{
  "version": "1.0",
  "agent": "@ai-gateway",
  "agent_did": "did:key:z6Mk...",
  "event_type": "memory.write",
  "timestamp": "2025-12-03T04:00:00Z",
  "zeta_time": "ζ-MIPGVQBF",
  "payload": {
    "vault_id": "vault-alexa-main",
    "key": "conversation.summary",
    "hash": "sha256:abc123..."
  },
  "sovereignty": {
    "owner": "ALEXA LOUISE AMUNDSON",
    "training_prohibited": true
  }
}
```

### 2.3 Transparency Log (Rekor)

All signed events are logged to Rekor for public auditability:

```bash
# Submit to Rekor
rekor-cli upload --artifact event.json \
  --signature event.sig \
  --public-key event.crt

# Returns: https://rekor.sigstore.dev/api/v1/log/entries/...
```

---

## 3. Memory Vault Attestations

### 3.1 in-toto Attestation Structure

When writing to a memory vault, attach provenance:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "vault-alexa-main/memories/2025-12-03",
      "digest": {
        "sha256": "abc123..."
      }
    }
  ],
  "predicateType": "https://blackroad.io/attestation/memory-write/v1",
  "predicate": {
    "agent": "@scribe",
    "agent_did": "did:key:z6Mk...",
    "operation": "append",
    "timestamp": "2025-12-03T04:00:00Z",
    "previous_hash": "sha256:def456...",
    "sovereignty": {
      "owner": "ALEXA LOUISE AMUNDSON"
    }
  }
}
```

### 3.2 SLSA Provenance for Agent Code

Agent deployments include SLSA provenance:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "blackroad-cece:v2.0.0",
      "digest": { "sha256": "..." }
    }
  ],
  "predicateType": "https://slsa.dev/provenance/v1",
  "predicate": {
    "buildDefinition": {
      "buildType": "https://github.com/Attestations/GitHubActionsWorkflow@v1"
    },
    "runDetails": {
      "builder": { "id": "https://github.com/actions/runner" },
      "metadata": {
        "invocationId": "https://github.com/BlackRoad-OS/blackroad-os-operator/actions/runs/..."
      }
    }
  }
}
```

---

## 4. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BlackRoad Agent                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ did:key     │  │ Event       │  │ Memory      │             │
│  │ Identity    │  │ Signer      │  │ Vault       │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ DID Resolution  │ │ Fulcio (certs)  │ │ Cloudflare KV   │
│ (Universal      │ │ Rekor (log)     │ │ (encrypted)     │
│  Resolver)      │ │ Cosign (sign)   │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 5. Implementation Plan

### Phase 1: Agent DIDs (Now)
- [ ] Generate did:key for each of 20 named agents
- [ ] Store private keys in Cloudflare Worker secrets
- [ ] Add DID to agent handshake response
- [ ] Update identity worker to resolve agent DIDs

### Phase 2: Signed Events (Next)
- [ ] Add event signing to @scribe worker
- [ ] Integrate Cosign for keyless signing
- [ ] Log signed events to Rekor
- [ ] Add verification endpoint to identity worker

### Phase 3: Memory Attestations (Future)
- [ ] Implement in-toto attestations for vault writes
- [ ] Add SLSA provenance to worker deployments
- [ ] Create attestation verification in @sovereign

---

## 6. Privacy Considerations

### Public Transparency Logs
Rekor logs are public. This leaks:
- When agents are active
- Event metadata (not payload content)
- DID identifiers

**Mitigations:**
- Use pseudonymous DIDs per-session if needed
- Hash sensitive metadata before logging
- Consider private Rekor instance for internal events

### Keyless Signing Trade-offs
Relies on OIDC identity provider. Acceptable for:
- Internal agent operations
- Non-adversarial trust boundaries

Consider key-based signing for:
- High-security vault operations
- Cross-organization attestations

---

## 7. Example: Signed Memory Write

```javascript
// In @scribe worker
async function signedMemoryWrite(vault, key, value) {
  const event = {
    agent: '@scribe',
    agent_did: await getAgentDID(),
    event_type: 'memory.write',
    timestamp: new Date().toISOString(),
    payload: {
      vault_id: vault,
      key: key,
      hash: await sha256(value)
    }
  };

  // Sign with Cosign (keyless via OIDC)
  const { signature, certificate } = await signEvent(event);

  // Log to Rekor
  const rekorEntry = await submitToRekor(event, signature, certificate);

  // Write to KV with attestation
  await MEMORY.put(key, value, {
    metadata: {
      signature: signature,
      rekor_log_index: rekorEntry.logIndex,
      agent_did: event.agent_did
    }
  });

  return { success: true, rekor_url: rekorEntry.url };
}
```

---

## 8. Standards References

- [W3C DID Core](https://www.w3.org/TR/did-core/)
- [W3C DID Resolution](https://w3c-ccg.github.io/did-resolution/)
- [did:key Method](https://w3c-ccg.github.io/did-method-key/)
- [Sigstore](https://www.sigstore.dev/)
- [Cosign](https://docs.sigstore.dev/cosign/overview/)
- [Rekor](https://docs.sigstore.dev/rekor/overview/)
- [in-toto](https://in-toto.io/)
- [SLSA](https://slsa.dev/)

---

*Created: 2025-12-03*
*Owner: Alexa Louise Amundson*
