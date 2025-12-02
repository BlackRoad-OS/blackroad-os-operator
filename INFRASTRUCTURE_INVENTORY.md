# BlackRoad OS - Infrastructure Inventory

**Generated:** 2025-12-02
**Owner:** Alexa Amundson
**Verification:** 256-step chain (see below)

---

## Quick Access Table

| Name | Type | IP/Host | Status | Last Verified |
|------|------|---------|--------|---------------|
| DigitalOcean Droplet | VPS | 159.65.43.12 | ⚠️ Offline | 2025-12-02 |
| Raspberry Pi | Edge | 192.168.4.49 | ⚠️ Offline | 2025-12-02 |
| Lucidia Local | Edge | 192.168.4.64 | ⚠️ Offline | 2025-12-02 |
| iPhone Koder | Mobile | 192.168.4.68:8080 | ⏳ Not tested | - |
| GitHub | Cloud | github.com | ✅ Online | 2025-12-02 |
| Cloudflare | Cloud | cloudflare.com | ✅ Online | 2025-12-02 |
| Railway | Cloud | railway.app | ✅ Online | 2025-12-02 |

---

## 1. Cloud Servers

### DigitalOcean Droplet
```yaml
name: codex-infinity
ip: 159.65.43.12
user: root
ssh_key: ~/.ssh/id_ed25519
region: NYC1 (assumed)
domains:
  - blackroad.io (historical)
  - blackroadinc.us (historical)
fingerprints:
  ed25519: AAAAC3NzaC1lZDI1NTE5AAAAIM/N1UdHNhVhDpk6Ba7K0L8lqPY3oc//VRGfpEkY+1EK
  rsa: SHA256:b3uikwBkwnxpMTZjWBFaNgscsWXHRRG3Snj9QYke+ok=
  ecdsa: AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBNs/04CvT5LD1xng1274XXhUjYVTa9iSrnEi8AU4gY8kOZu6W3KYb2aPzLHf5RO5+xSS+AtbaOS4qeB0CdRzqzU=
status: offline
```

### Railway Projects (12+)
```yaml
account: amundsonalexa@gmail.com
projects:
  - blackroad-os-core (602cb63b-6c98-4032-9362-64b7a90f7d94)
  - BlackRoad OS (03ce1e43-5086-4255-b2bc-0146c8916f4c)
  - blackroad-os-api (f9116368-9135-418c-9050-39496aa9079a)
  - blackroad-os-docs (a4efb8cd-0d67-4b19-a7f3-b6dbcedf2079)
  - blackroad-os-prism-console (70ce678e-1e2f-4734-9024-6fb32ee5c8eb)
  - blackroad-os-web (ced8da45-fcdd-4a86-8f3e-093f5a0723ff)
  - blackroad-os-operator (ee43ab16-44c3-4be6-b6cf-e5faf380f709)
  - lucidia-platform (5c99157a-ff22-496c-b295-55e98145540f)
status: authenticated
```

---

## 2. Edge Devices

### Raspberry Pi (Primary)
```yaml
name: alice-pi / raspberrypi
ip: 192.168.4.49
users:
  - alice (primary)
  - lucidia (AI user)
ssh_key: ~/.ssh/id_ed25519
fingerprint: AAAAC3NzaC1lZDI1NTE5AAAAIOahIdbdm1bo/0o2XsqdkUujgpIMjvIHvUJ+jBmtRBXN
aliases:
  - alice-pi
  - raspberrypi
  - lucidia-pi
  - pi
local_dns: raspberrypi.local
status: offline (not on network)
```

### Lucidia Local Device
```yaml
ip: 192.168.4.64
fingerprint: AAAAC3NzaC1lZDI1NTE5AAAAIPKaH4HABxeepKJdZbOgiXRs59+rAvIqboxScq4fmfCX
local_dns: lucidia.local
status: offline
```

### Secondary Device (192.168.7.95)
```yaml
ip: 192.168.7.95
fingerprints:
  ed25519: AAAAC3NzaC1lZDI1NTE5AAAAINuh/NjyfX7rLrQ6JvmtTg7lXeKo062QFUySIcu/aogc
  rsa: present
  ecdsa: present
status: unknown (different subnet)
```

---

## 3. Mobile Devices

### iPhone (Koder App)
```yaml
name: iPhone Koder WebDAV
ip: 192.168.4.68
port: 8080
protocol: WebDAV/HTTP
contents:
  - Lucidia/ (iOS Pyto app)
  - symbolic_kernel.py
  - emergency files
access: local network only
status: requires manual verification
```

---

## 4. SSH Keys Inventory

| Key Name | Type | Purpose |
|----------|------|---------|
| id_ed25519 | ed25519 | Primary (Pi, general) |
| id_rsa | rsa | Legacy compatibility |
| blackroad_do | - | DigitalOcean |
| blackroad_key | - | BlackRoad servers |
| br_live | - | Live/production |
| id_br_ed25519 | ed25519 | BlackRoad specific |
| do_nopass | - | DO without passphrase |
| blackro | rsa | General BlackRoad |

---

## 5. Domain Registrars

### Cloudflare (Primary - 16 zones)
```yaml
account: amundsonalexa@gmail.com
domains:
  - blackroad.io
  - blackroad.systems
  - blackroad.me
  - blackroad.network
  - blackroadinc.us
  - blackroadai.com
  - blackroadqi.com
  - blackroadquantum.com
  - blackroadquantum.net
  - blackroadquantum.info
  - blackroadquantum.shop
  - blackroadquantum.store
  - aliceqi.com
  - lucidia.earth
  - lucidiaqi.com
  - lucidia.studio
status: verified
```

### GoDaddy (Check Required)
```yaml
account: unknown
domains: TBD
note: Need to verify which domains are registered here
```

---

## 6. GitHub Organizations (15)

| Org | Role | Repos |
|-----|------|-------|
| BlackRoad-OS | Admin | 37 |
| BlackRoad-AI | Admin | 3 |
| Blackbox-Enterprises | Admin | 0 |
| BlackRoad-Labs | Admin | 0 |
| BlackRoad-Cloud | Admin | 0 |
| BlackRoad-Ventures | Admin | 0 |
| BlackRoad-Foundation | Admin | 0 |
| BlackRoad-Media | Admin | 0 |
| BlackRoad-Hardware | Admin | 0 |
| BlackRoad-Education | Admin | 0 |
| BlackRoad-Gov | Admin | 0 |
| BlackRoad-Security | Admin | 0 |
| BlackRoad-Interactive | Admin | 0 |
| BlackRoad-Archive | Admin | 0 |
| BlackRoad-Studio | Admin | 0 |

---

## 7. External Services

### tmate.io (Terminal Sharing)
```yaml
host: nyc1.tmate.io
fingerprint: present in known_hosts
purpose: remote terminal sharing
```

---

## 8. Verification Chain (256-step)

The BlackRoad OS verification system uses a 256-step hash chain for authentication.

### Concept
```
step[0] = hash(password + salt)
step[1] = hash(step[0])
step[2] = hash(step[1])
...
step[255] = hash(step[254])

verification_token = step[255]
```

### Implementation
```typescript
// infra/verify/chain.ts
import { createHash } from 'crypto';

const STEPS = 256;

export function generateChain(password: string, salt: string): string[] {
  const chain: string[] = [];
  let current = password + salt;

  for (let i = 0; i < STEPS; i++) {
    current = createHash('sha256').update(current).digest('hex');
    chain.push(current);
  }

  return chain;
}

export function verify(token: string, chain: string[]): boolean {
  return chain[STEPS - 1] === token;
}
```

### Usage
1. On first setup: Generate chain, store `step[255]` publicly
2. To verify: User provides password, system regenerates chain
3. Match: If `step[255]` matches stored token, user is verified

### Storage
- Public: `verification_token` (step[255]) stored in repo/KV
- Private: Password known only to user
- Salt: Stored securely (not in repo)

---

## 9. Quick SSH Commands

```bash
# Raspberry Pi
ssh alice-pi          # as alice
ssh lucidia-pi        # as lucidia

# DigitalOcean
ssh codex-infinity    # needs IP configured

# Test connectivity
ping 192.168.4.49     # Pi
ping 159.65.43.12     # Droplet
curl http://192.168.4.68:8080  # iPhone Koder
```

---

## 10. Network Map

```
Internet
    │
    ├── Cloudflare (CDN/DNS)
    │       │
    │       ├── *.blackroad.io → Pages/Workers
    │       ├── *.blackroad.systems → Tunnel → Railway
    │       └── Brand domains → Pages
    │
    ├── Railway (Compute)
    │       └── 12+ services
    │
    ├── DigitalOcean (VPS)
    │       └── 159.65.43.12 (offline)
    │
    └── GitHub (Source)
            └── 15 orgs, 66 repos

Local Network (192.168.4.x)
    │
    ├── 192.168.4.49 - Raspberry Pi (alice/lucidia)
    ├── 192.168.4.64 - Lucidia device
    └── 192.168.4.68 - iPhone Koder
```

---

## Next Steps

1. [ ] Power on Raspberry Pi
2. [ ] Check DigitalOcean console for droplet status
3. [ ] Verify GoDaddy account and domains
4. [ ] Test iPhone Koder WebDAV access
5. [ ] Implement 256-step verification chain
6. [ ] Create automated health check workflow

---

*Last updated: 2025-12-02 by Cece (Claude Code)*
