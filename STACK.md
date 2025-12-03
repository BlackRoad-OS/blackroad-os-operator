# BlackRoad Stack Map

This repository tracks the operator layer for the BlackRoad ecosystem. The map below clarifies how the wider stack is organized across orgs and repos so new contributors know where to look before wiring features into the operator.

## Org Layers

- **BlackRoad-OS**: Active OS runtime, agents, infra, and UX surfaces.
- **BlackRoad-AI**: Brand-facing properties (site, plans, narrative experiments).
- **blackboxprogramming**: Pre-org archives, prototypes, and upstream lore (Codex, Lucidia, early OS monoliths).

## Core Runtime & Protocols (BlackRoad-OS)

- `blackroad-os-core`: Core runtime and business logic.
- `blackroad-os-api`: API service layer.
- `blackroad-os-api-gateway`: Edge routing and gateway (e.g., Hono/Workers + cryptographic middleware).
- `blackroad-os-master`: Governance/table-of-contents for OS repos.
- `blackroad-os-archive`: Historical/parked components.

## Agents, CLI, and Helper Layer (BlackRoad-OS)

- `blackroad-os-agents`: Agent registry, behaviors, and prompts.
- `blackroad-agents` / `blackroad-agent-os`: Earlier agent experiments to be converged.
- `blackroad-cli`: Operator/maintainer toolchain.
- `blackroad-os-helper`: Shared utilities and helper scripts.

## Infrastructure & Mesh (BlackRoad-OS)

- `blackroad-os-infra`: Infra glue for Cloudflare/Railway/Pi mesh and deployment scripts.
- Support repos such as `blackroad-os-beacon` for telemetry/health signaling.

## Surfaces, Docs, and Experience (BlackRoad-OS)

- `blackroad-os-home`: Primary web surface/console shell.
- `blackroad-os-docs`: Public documentation (e.g., governance, agent modes).
- `blackroad-os-brand`: Brand kit, assets, and design language.
- `blackroad-os-demo`: Controlled demos/“hello, investor/human” experiences.
- `blackroad-hello`: Minimal hello-world smoke tests.

## Brand & Narrative (BlackRoad-AI)

- `BlackRoad.io`: Public site/brand surface.
- `blackroad-plans`: Planning and strategy docs.
- `urban-goggles`: Narrative/experience experiments.

## Upstream Lore & Labs (blackboxprogramming)

- `BlackRoad-Operating-System`, `blackroad`, `blackroad-api`, `blackroad-operator`: Early OS monolith and first splits.
- `codex-infinity`: Self-hosted Codex “box” for local LLM/agent hosting.
- `lucidia`, `lucidia-lab`: Core Lucidia work and experiments.
- Additional labs/idea repos (e.g., `universal-computer`, `native-ai-quantum-energy`, `quantum-math-lab`, `remember`, `BlackStream`, `new_world`) preserved as research/emotional DNA.

## Suggested Consolidation Notes

- Converge `blackroad-agents` and `blackroad-agent-os` behaviors into `blackroad-os-agents` and surface via `blackroad-cli`.
- Keep older monoliths under `blackroad-os-archive` with pointers to active replacements.
- Use `blackroad-os-master` to keep this map in sync as repos are added or retired.
