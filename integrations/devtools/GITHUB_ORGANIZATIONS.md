# BlackRoad GitHub Enterprise Architecture

> 15 Organizations | 180+ Repositories | Enterprise-Scale Governance

## Organization Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BLACKROAD GITHUB ENTERPRISE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TIER 1: CORE PLATFORM                                            │    │
│  │ ┌─────────────────────────────────────────────────────────────┐ │    │
│  │ │ BlackRoad-OS (24 repos)                                      │ │    │
│  │ │ Primary development org - Governance engine, agents, web     │ │    │
│  │ └─────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TIER 2: PRODUCT                                                  │    │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐            │    │
│  │ │ BlackRoad-AI│ │BlackRoad-   │ │ BlackRoad-      │            │    │
│  │ │ (15 repos)  │ │Cloud        │ │ Security        │            │    │
│  │ │ Lucidia,    │ │(16 repos)   │ │ (13 repos)      │            │    │
│  │ │ Beacon, AI  │ │K8s, Terraform│ │ Vault, Auth    │            │    │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TIER 3: RESEARCH                                                 │    │
│  │ ┌───────────────────┐ ┌───────────────────────┐                 │    │
│  │ │ BlackRoad-Labs    │ │ BlackRoad-Foundation  │                 │    │
│  │ │ (11 repos)        │ │ (9 repos)             │                 │    │
│  │ │ Quantum, AGI      │ │ Open source, Amundson │                 │    │
│  │ └───────────────────┘ └───────────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TIER 4: CREATIVE                                                 │    │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐            │    │
│  │ │ BlackRoad-  │ │ BlackRoad-  │ │ BlackRoad-      │            │    │
│  │ │ Studio      │ │ Media       │ │ Interactive     │            │    │
│  │ │ (11 repos)  │ │ (9 repos)   │ │ (7 repos)       │            │    │
│  │ │ Unity, 3D   │ │ Content     │ │ Gaming, XR      │            │    │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TIER 5-8: SUPPORT                                                │    │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│    │
│  │ │ BlackRoad-  │ │ BlackRoad-  │ │ BlackRoad-  │ │ Blackbox-   ││    │
│  │ │ Education   │ │ Hardware    │ │ Gov         │ │ Enterprises ││    │
│  │ │ (9 repos)   │ │ (9 repos)   │ │ (7 repos)   │ │ (9 repos)   ││    │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│    │
│  │ ┌─────────────┐ ┌─────────────┐                                 │    │
│  │ │ BlackRoad-  │ │ BlackRoad-  │                                 │    │
│  │ │ Ventures    │ │ Archive     │                                 │    │
│  │ │ (6 repos)   │ │ (6 repos)   │                                 │    │
│  │ └─────────────┘ └─────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Organizations Summary

| Organization | Purpose | Repos | Visibility | Key Technologies |
|--------------|---------|-------|------------|------------------|
| **BlackRoad-OS** | Core platform & governance | 24 | Private | Python, TypeScript, Next.js |
| **BlackRoad-AI** | AI/ML products | 15 | Mixed | Python, PyTorch, Transformers |
| **BlackRoad-Cloud** | Infrastructure | 16 | Private | Terraform, K8s, ArgoCD |
| **BlackRoad-Security** | Security & compliance | 13 | Private | Vault, OPA, SAST/DAST |
| **BlackRoad-Labs** | R&D & quantum | 11 | Mixed | Qiskit, JAX, Research |
| **BlackRoad-Foundation** | Open source | 9 | Public | Community, Standards |
| **BlackRoad-Studio** | Creative tools | 11 | Mixed | Unity, Unreal, Three.js |
| **BlackRoad-Media** | Content & publishing | 9 | Mixed | Ghost, Video, Social |
| **BlackRoad-Interactive** | Gaming & XR | 7 | Private | Gaming, VR/AR, Simulations |
| **BlackRoad-Education** | Learning | 9 | Public | Courses, Tutorials |
| **BlackRoad-Hardware** | Edge & IoT | 9 | Private | Firmware, PCB, Drivers |
| **BlackRoad-Gov** | Government/FedRAMP | 7 | Private | Compliance, IL4/IL5 |
| **Blackbox-Enterprises** | Business ops | 9 | Private | CRM, ERP, Finance |
| **BlackRoad-Ventures** | Investments | 6 | Private | Portfolio, M&A |
| **BlackRoad-Archive** | Legacy & archived | 6 | Private | Historical |

**Total: 180 repositories across 15 organizations**

---

## Detailed Organization Breakdown

### 1. BlackRoad-OS (Primary Development)

The core platform organization containing the governance engine and main product.

```
blackroad-os/
├── Core
│   ├── blackroad-os          # Main monorepo
│   ├── blackroad-os-core     # Shared libraries
│   └── blackroad-os-master   # Configuration & schemas
│
├── API
│   ├── blackroad-os-operator     # Governance Engine (FastAPI)
│   ├── blackroad-os-api-gateway  # API Gateway
│   └── blackroad-os-api          # Public SDKs
│
├── Web
│   ├── blackroad-os-web          # Main app (Next.js)
│   ├── blackroad-os-prism-console # Admin console
│   ├── blackroad-os-demo         # Demos
│   └── blackroad-os-home         # Marketing site
│
├── Agents
│   ├── blackroad-os-agents   # Lucidia runtime
│   └── blackroad-os-beacon   # LLM routing
│
├── Packs (6)
│   ├── blackroad-os-pack-research-lab
│   ├── blackroad-os-pack-finance
│   ├── blackroad-os-pack-education
│   ├── blackroad-os-pack-creator-studio
│   ├── blackroad-os-pack-legal
│   └── blackroad-os-pack-infra-devops
│
└── Support
    ├── blackroad-os-infra    # IaC
    ├── blackroad-os-docs     # Documentation
    ├── blackroad-os-research # Research papers
    ├── blackroad-os-ideas    # RFCs
    ├── blackroad-os-brand    # Brand assets
    └── blackroad-os-archive  # Archived
```

### 2. BlackRoad-AI (AI/ML Products)

```
blackroad-ai/
├── Lucidia Core
│   ├── lucidia-core      # Agent framework
│   ├── lucidia-memory    # Memory systems
│   ├── lucidia-reasoning # Reasoning engine
│   ├── lucidia-tools     # Tool library
│   └── lucidia-swarm     # Multi-agent
│
├── Beacon (LLM)
│   ├── beacon-router      # LLM routing
│   ├── beacon-embeddings  # Embeddings
│   ├── beacon-fine-tuning # Fine-tuning
│   └── beacon-evaluation  # Benchmarks
│
├── Research (Public)
│   ├── ai-research-papers
│   ├── ai-safety
│   └── ai-benchmarks
│
└── SDKs (Public)
    ├── lucidia-sdk-python
    ├── lucidia-sdk-typescript
    └── lucidia-sdk-rust
```

### 3. BlackRoad-Cloud (Infrastructure)

```
blackroad-cloud/
├── Kubernetes
│   ├── cloud-k8s-manifests
│   ├── cloud-k8s-operators
│   └── cloud-argocd
│
├── Terraform
│   ├── cloud-terraform-modules
│   ├── cloud-terraform-aws
│   ├── cloud-terraform-gcp
│   ├── cloud-terraform-do
│   └── cloud-terraform-cloudflare
│
├── Networking
│   ├── cloud-mesh
│   ├── cloud-tailscale
│   └── cloud-dns
│
├── Observability
│   ├── cloud-monitoring
│   ├── cloud-logging
│   └── cloud-tracing
│
└── Shared
    ├── cloud-databases
    └── cloud-github-actions (public)
```

### 4. BlackRoad-Security

```
blackroad-security/
├── Secrets
│   ├── security-vault
│   └── security-vault-plugins
│
├── Auth
│   ├── security-auth
│   ├── security-rbac
│   └── security-mfa
│
├── Compliance
│   ├── security-compliance
│   ├── security-auditing
│   └── security-policies
│
├── Scanning
│   ├── security-scanning
│   └── security-vulnerability
│
└── Response
    ├── security-incident-response
    ├── security-advisories (public)
    └── security-bug-bounty (public)
```

### 5. BlackRoad-Labs (Research)

```
blackroad-labs/
├── Quantum
│   ├── labs-quantum-core
│   ├── labs-quantum-algorithms (public)
│   ├── labs-quantum-simulator (public)
│   └── labs-quantum-ml
│
├── Advanced AI
│   ├── labs-agi-research
│   ├── labs-consciousness
│   └── labs-embodiment
│
├── Experimental
│   ├── labs-experiments
│   └── labs-hackathon (public)
│
└── Publications
    ├── labs-papers (public)
    └── labs-datasets (public)
```

### 6. BlackRoad-Foundation (Open Source)

All public repositories for community and standards.

```
blackroad-foundation/
├── Protocols
│   ├── amundson-protocol      # Governance spec
│   └── amundson-reference     # Reference impl
│
├── Open Source
│   ├── lucidia-open           # Open agent framework
│   └── beacon-open            # Open LLM router
│
├── Standards
│   ├── standards-agent-protocol
│   └── standards-memory-format
│
└── Community
    ├── community
    ├── awesome-blackroad
    └── grants-program
```

---

## Access Control

### Role Matrix

| Role | BlackRoad-OS | BlackRoad-AI | BlackRoad-Cloud | BlackRoad-Security | Other |
|------|-------------|--------------|-----------------|-------------------|-------|
| Executive | Owner | Owner | Owner | Owner | Owner |
| Platform Lead | Owner | Member | Owner | Read | - |
| AI Lead | Member | Owner | Member | Read | - |
| Security Lead | Read | Read | Read | Owner | Read |
| Senior Engineer | Maintain | Maintain | Maintain | Read | By team |
| Engineer | Write | Write | Write | - | By team |
| Contractor | Write* | Write* | - | - | Limited |

*Time-limited access (90 days max)

### Branch Protection

All organizations require:
- 1 approving review minimum
- Dismiss stale reviews on new commits
- Require status checks (lint, test, security)
- No force pushes to main
- Code owners required for sensitive paths

---

## Security & Compliance

### Required Security Features

| Feature | Status |
|---------|--------|
| SSO/SAML | Required |
| MFA | Required (WebAuthn preferred) |
| Secret Scanning | Enabled + Push Protection |
| Dependabot | Enabled (auto-merge patches) |
| CodeQL | Weekly scans |
| Audit Streaming | Datadog + Splunk |

### Compliance Frameworks

- **SOC 2**: All organizations
- **GDPR**: BlackRoad-OS, BlackRoad-AI, BlackRoad-Cloud
- **FedRAMP**: BlackRoad-Gov only

---

## CI/CD

### Shared Workflows

Source: `BlackRoad-Cloud/cloud-github-actions`

Required workflows across all repos:
- `security-scan.yaml`
- `dependency-check.yaml`
- `secrets-scan.yaml`

### Runners

| Type | Organizations | Specs |
|------|---------------|-------|
| linux-8core | All | 8 cores, 32GB RAM |
| linux-16core | All | 16 cores, 64GB RAM |
| gpu-runner | BlackRoad-AI, Labs | 16 cores, 64GB RAM, GPU |
| self-hosted | OS, AI, Cloud | Custom |

---

## Package Publishing

### NPM (@blackroad scope)

Organizations: BlackRoad-OS, BlackRoad-AI, BlackRoad-Studio

Packages:
- `@blackroad/core`
- `@blackroad/utils`
- `@blackroad/types`
- `@blackroad/api-client`
- `@blackroad/studio-three`
- `@blackroad/studio-r3f`
- `@lucidia/sdk`

### PyPI

Organizations: BlackRoad-OS, BlackRoad-AI, BlackRoad-Labs

Packages:
- `blackroad-core`
- `blackroad-api`
- `lucidia`

### Container Registry (ghcr.io)

All organizations can publish containers with:
- Image signing (cosign)
- Vulnerability scanning
- Block on critical vulnerabilities

---

## Files Reference

| File | Description |
|------|-------------|
| `github-enterprise.yaml` | Complete org structure with 180 repos |
| `github-org-governance.yaml` | Governance policies and access control |
| `github-organization.yaml` | Original 24 repos in BlackRoad-OS |

---

*Last updated: 2024-12-01*
*Scale: 15 organizations, 180+ repositories, enterprise governance*
