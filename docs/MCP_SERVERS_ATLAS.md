# BlackRoad MCP Servers Atlas

> "Give me the map of the whole nervous system so Cece can drive it."

This document defines the canonical MCP (Model Context Protocol) servers that Cece and BlackRoad agents can communicate with.

---

## 0. Canonical Index

Every MCP server Cece is allowed to talk to, with clear purpose and constraints.

```
# Machine-Local
blackroad.mcp.local.operator      # MacBook / dev box
blackroad.mcp.local.git           # Git operations over local repos
blackroad.mcp.local.docker        # Containers & services on dev box
blackroad.mcp.mesh.pi             # Raspberry Pi mesh control
blackroad.mcp.mesh.jetson         # Jetson Orin / edge GPU node

# Infrastructure
blackroad.mcp.infra.railway       # Railway services + envs
blackroad.mcp.infra.cloudflare    # DNS / tunnels / zero trust
blackroad.mcp.infra.vercel        # Frontend deployments
blackroad.mcp.infra.github        # GitHub org + repos

# Business
blackroad.mcp.biz.stripe          # Billing & products
blackroad.mcp.biz.amplitude       # Analytics & funnels
blackroad.mcp.biz.hubspot         # (optional) CRM later

# Experience / Creative
blackroad.mcp.exp.canva           # Brand & decks
blackroad.mcp.exp.figma           # UI & diagrams
blackroad.mcp.exp.fireflies       # Meetings & transcripts
blackroad.mcp.exp.jam             # Debug sessions
blackroad.mcp.exp.khan            # Learning content
blackroad.mcp.exp.biorender       # Scientific visuals
```

---

## 1. Machine-Local MCP Servers

### 1.1 blackroad.mcp.local.operator

**Role:** Cece's hands on your main machine. Very constrained, very logged.

**Tools:**
- `fs_list` - List safe directories and project roots
- `fs_read` - Read small text files inside whitelisted roots
- `fs_write` - Propose edits; writes must be logged to operator ledger
- `run_command` - Run safe shell commands with explicit allowlist

**Constraints:**
- Only allowed roots: `~/BlackRoad-*`, `~/blackroad-*`, `~/Projects/BlackRoad`
- No raw `rm`, `curl | bash`, or arbitrary shell
- Every write emits a ledger event

---

### 1.2 blackroad.mcp.local.git

**Role:** Cece's Git helper on your machine.

**Tools:**
- `git_status` - Show clean/dirty state for a repo
- `git_branch_list` - List branches for a repo
- `git_diff` - Show diff for staged/unstaged changes
- `git_commit` - Create a commit with a human-reviewed message

**Policy:** Cece can propose commit messages, but human approves before pushing.

---

### 1.3 blackroad.mcp.local.docker

**Role:** Control dev containers and services.

**Tools:**
- `docker_list_containers`
- `docker_logs`
- `docker_restart_service` (whitelisted services only)

---

### 1.4 blackroad.mcp.mesh.pi

**Role:** Talk to the Pi mesh (via blackroad-pi-ops).

**Tools:**
- `list_nodes` - List known Pi nodes & their agent status
- `node_status` - Check health of a specific node
- `deploy_agent` - Deploy/upgrade an agent on a Pi node

**Policy:** Only Cece with `operator_role=mesh` AND human "yes" can deploy.

---

### 1.5 blackroad.mcp.mesh.jetson

Same pattern as Pi, specialized for Jetson (GPU workloads, vision, LLM inference).

---

## 2. Cloud / SaaS MCP Servers

### 2.1 blackroad.mcp.infra.vercel

**Role:** Apps + deployments + domains.

**Tools:**
- `list_projects`
- `list_deployments`
- `get_deployment_logs`
- `check_domain_availability`

**Usage:** When deployment fails → get logs → summarize → propose fix.

---

### 2.2 blackroad.mcp.infra.railway

**Role:** Railway services, envs, and metrics.

**Tools:**
- `list_projects`
- `list_services`
- `service_deploy`
- `service_logs`

---

### 2.3 blackroad.mcp.infra.cloudflare

**Role:** DNS, tunnels, Workers.

**Tools:**
- `dns_list_records(domain)`
- `dns_upsert_record(domain, name, type, value)`
- `tunnel_list`
- `tunnel_status`

**Policy:** Only Cece with `role=infra` can propose; human approves DNS changes.

---

### 2.4 blackroad.mcp.infra.github

**Role:** GitHub org and repos.

**Tools:**
- `list_repos(org)`
- `get_repo_readme`
- `list_issues`
- `create_issue` (governed)
- `search_code(query, repo)`

---

### 2.5 blackroad.mcp.biz.stripe

**Role:** Money brain.

**Tools:**
- `list_products`
- `list_prices(product_id)`
- `create_customer` (later)
- `create_checkout_session` (strictly locked behind policy)

**Current mode:** Read-only for designing pricing.

---

### 2.6 blackroad.mcp.biz.amplitude

**Role:** Analytics & event definitions.

**Tools:**
- `list_charts`
- `get_chart(chart_id)`
- `list_events`
- `get_event_definition(event_type)`

---

### 2.7 blackroad.mcp.exp.canva

**Role:** Brand and comms.

**Tools:**
- `search_designs`
- `get_design(design_id)`
- `suggest_edits` / `create_design`

**Intent:** Cece turns infra changes into slides, not just logs.

---

### 2.8 blackroad.mcp.exp.figma

**Role:** UI layout → code.

**Tools:**
- `get_node_screenshot(file_key, node_id)`
- `export_code(file_key, node_id, target="react")`

---

### 2.9 blackroad.mcp.exp.fireflies

**Role:** Meetings as memory.

**Tools:**
- `search_transcripts(query)`
- `get_transcript(meeting_id)`
- `summarize_transcript(meeting_id)`

---

### 2.10 blackroad.mcp.exp.jam

**Role:** Debug cinema.

**Tools:**
- `search_jams(query)`
- `get_jam_details(jam_id)`
- `summarize_jam(jam_id)`

**Workflow:** Record Jam → Cece turns it into issue/plan.

---

### 2.11 blackroad.mcp.exp.khan

**Role:** Learning substrate.

**Tools:**
- `get_assignable_questions(topic, page)`
- `get_assignment_link(topic)`

---

### 2.12 blackroad.mcp.exp.biorender

**Role:** Science metaphors & diagrams.

**Tools:**
- `search_icons(query)`
- `get_icon(icon_id)`

---

## 3. Agent ↔ MCP Server Mapping

| Agent | Primary MCP Servers |
|-------|---------------------|
| @ai-gateway | All (orchestrator) |
| @main-gate | infra.cloudflare, infra.railway |
| @namer | local.operator, infra.github |
| @dns-wizard | infra.cloudflare |
| @cloud-cmd | infra.railway, mesh.* |
| @treasurer | biz.stripe |
| @gatekeeper | infra.cloudflare (zero trust) |
| @key-keeper | local.operator (secrets) |
| @shield | infra.cloudflare |
| @watchman | All (monitoring) |
| @scribe | local.operator (logs) |
| @pathfinder | infra.github |
| @brainstorm | exp.canva, exp.figma |
| @dreamer | exp.fireflies, exp.jam |
| @artist | exp.canva, exp.figma, exp.biorender |
| @checkout-oracle | biz.stripe |
| @listener | biz.stripe, biz.amplitude |
| @bridge | infra.railway, mesh.* |
| @quantum | mesh.jetson |

---

*Created: 2025-12-03*
*Owner: Alexa Louise Amundson*
