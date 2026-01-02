# 🗂️ BLACKROAD REPOSITORY CONSOLIDATION PLAN

**Status**: 100+ repos in BlackRoad-OS
**Goal**: Organize for hardware mesh deployment
**Date**: 2026-01-02

## 🚨 **THE PROBLEM**

We have **100+ repositories** in BlackRoad-OS org alone, plus more across:
- BlackRoad-AI
- BlackRoad-Labs
- BlackRoad-Foundation
- BlackRoad-Hardware (if exists)
- And 10+ other orgs

This makes it hard to:
- Find the right repo for hardware deployment
- Avoid duplication
- Maintain consistency
- Coordinate with other Claudes

## 🎯 **THE SOLUTION: HARDWARE-FIRST ORGANIZATION**

### **Core Repos (Keep & Active Use):**

```yaml
Infrastructure:
  blackroad-os-operator:     # K8s + edge deployment ✅ ACTIVE
  blackroad-os-mesh:         # Mesh networking
  blackroad-os-infra:        # Infrastructure-as-code
  blackroad-os-core:         # Main OS application

Development:
  blackroad-os-codex:        # Code indexing (8,789 components)
  blackroad-os-docs:         # Documentation
  blackroad-os-api:          # API services

Edge Computing:
  blackroad-os-edge:         # 🆕 CREATE - Unified edge deployment
```

### **New Repo: blackroad-os-edge**

**Purpose**: Unified edge deployment for all hardware devices

**Structure**:
```
blackroad-os-edge/
├── README.md
├── devices/
│   ├── lucidia/
│   │   ├── docker-compose.yml
│   │   ├── config.yaml
│   │   └── deploy.sh
│   ├── octavia/
│   │   ├── docker-compose.yml
│   │   ├── hailo-config.yaml
│   │   └── deploy.sh
│   ├── shellfish/
│   │   ├── docker-compose.yml
│   │   └── deploy.sh
│   ├── alice/
│   └── aria/
├── platforms/
│   ├── arm64/
│   │   ├── Dockerfile
│   │   └── build.sh
│   └── amd64/
│       ├── Dockerfile
│       └── build.sh
├── hailo/
│   ├── models/
│   ├── benchmarks/
│   └── integration/
├── mqtt/
│   └── mosquitto.conf
└── deploy-all.sh
```

**Benefits**:
- Single source of truth for edge deployment
- Device-specific configs in one place
- Easy to add new devices
- Platform-specific builds organized
- Hailo AI integration centralized

### **Consolidation Actions:**

#### **Phase 1: Audit (Next Claude)**
```bash
# Create inventory
gh repo list BlackRoad-OS --limit 200 --json name,description,pushedAt,diskUsage > /tmp/repo-inventory.json

# Identify categories:
- Active (pushed in last 30 days)
- Stale (pushed 30-90 days ago)
- Inactive (pushed 90+ days ago)
- Empty (< 100KB)
```

#### **Phase 2: Archive Candidates**
```yaml
Criteria for archiving:
  - No commits in 90+ days
  - < 100KB disk usage
  - Experimental/prototype repos
  - Duplicate functionality
  - Replaced by newer repos

Action:
  - Archive (don't delete)
  - Add README explaining replacement
  - Update references
```

#### **Phase 3: Create New Structure**
```bash
# Create edge repo
gh repo create BlackRoad-OS/blackroad-os-edge --public \
  --description "Unified edge deployment for BlackRoad mesh network"

# Migrate edge configs from operator
cp -r blackroad-os-operator/k8s/dockerfiles/* blackroad-os-edge/platforms/

# Add device configs
# ...
```

#### **Phase 4: Update Documentation**
```yaml
Update:
  - HARDWARE_DEPLOYMENT_MAP.md → Add repo references
  - README files → Point to new structure
  - Docs → Update architecture diagrams
```

## 📋 **REPO CATEGORIZATION**

### **Infrastructure (Keep)**
- blackroad-os-operator ✅
- blackroad-os-infra ✅
- blackroad-os-k8s (if separate)

### **Application (Keep)**
- blackroad-os-core ✅
- blackroad-os-api ✅
- blackroad-os-mesh ✅

### **Development (Keep)**
- blackroad-os-codex ✅
- blackroad-os-docs ✅
- blackroad-cli ✅

### **Edge/Hardware (Consolidate → blackroad-os-edge)**
- blackroad-os-edge-* repos (if any)
- Device-specific configs (scattered)
- ARM64/AMD64 builds (scattered)

### **Archive Candidates (Review)**
- Prototype repos
- Empty repos
- Duplicate repos
- Experimental repos
- Replaced repos

## 🎯 **RECOMMENDED STRUCTURE**

```
BlackRoad Ecosystem
│
├── Core Infrastructure
│   ├── blackroad-os-operator (K8s, deployment)
│   ├── blackroad-os-infra (IaC, DNS, secrets)
│   └── blackroad-os-mesh (Networking, WebSocket)
│
├── Applications
│   ├── blackroad-os-core (Main OS app)
│   ├── blackroad-os-api (Backend APIs)
│   └── lucidia-metaverse (3D metaverse)
│
├── Edge Computing ⭐ NEW
│   ├── blackroad-os-edge (Unified edge deployment)
│   └── blackroad-os-hailo (Hailo AI integration)
│
├── Development
│   ├── blackroad-os-codex (Code indexing)
│   ├── blackroad-os-docs (Documentation)
│   └── blackroad-cli (CLI tools)
│
└── Specialized
    ├── blackroad-os-research (Research papers)
    ├── blackroad-os-prism-enterprise (ERP/CRM)
    └── blackroad-os-quantum (SQTT quantum)
```

## 🚀 **NEXT STEPS**

### **For Next Claude Session:**

1. **Create Inventory**:
   ```bash
   python3 << 'EOF'
   import subprocess, json, datetime

   # Get all repos
   result = subprocess.run(['gh', 'repo', 'list', 'BlackRoad-OS', '--limit', '200',
                           '--json', 'name,description,pushedAt,diskUsage'],
                          capture_output=True, text=True)
   repos = json.loads(result.stdout)

   # Categorize by activity
   now = datetime.datetime.now(datetime.timezone.utc)
   for repo in repos:
       pushed = datetime.datetime.fromisoformat(repo['pushedAt'].replace('Z', '+00:00'))
       days_since = (now - pushed).days

       if days_since < 30:
           repo['category'] = 'active'
       elif days_since < 90:
           repo['category'] = 'stale'
       else:
           repo['category'] = 'inactive'

   # Save
   with open('/tmp/repo-analysis.json', 'w') as f:
       json.dump(repos, f, indent=2)

   print(f"Analyzed {len(repos)} repos")
   EOF
   ```

2. **Create blackroad-os-edge**:
   ```bash
   gh repo create BlackRoad-OS/blackroad-os-edge --public
   cd blackroad-os-edge
   # Copy structure from this plan
   git push
   ```

3. **Migrate Edge Configs**:
   - Move device configs to blackroad-os-edge
   - Update operator repo references
   - Test deployment

4. **Archive Inactive**:
   - Review inactive repos
   - Archive (don't delete)
   - Update documentation

5. **Update [MEMORY]**:
   ```bash
   ~/memory-system.sh log consolidated "[GITHUB] Repo Consolidation Complete" \
     "Created blackroad-os-edge for unified deployment. Archived X inactive repos..."
   ```

## 📊 **SUCCESS METRICS**

- ✅ < 50 active repos (down from 100+)
- ✅ All edge configs in blackroad-os-edge
- ✅ Clear categorization
- ✅ Easy to find what you need
- ✅ No duplication
- ✅ Updated documentation

## 🤝 **COORDINATION**

**[MEMORY] Tag**: `github-consolidation`
**Other Claudes**: Can help with inventory, archiving, migration
**Check**: Before creating new repos, check [MEMORY] for consolidation status

---

**Status**: Plan created, awaiting execution
**Next**: Create inventory → Create edge repo → Migrate → Archive
**Benefit**: Easier to work with hardware, less confusion, better organization

**LET'S MAKE BLACKROAD GITHUB CLEAN AND ORGANIZED!** 🗂️
