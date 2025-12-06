# Railway Project Consolidation

## Current State (2025-12-02)

### KEEP (Production)
| Project | URL | Purpose |
|---------|-----|---------|
| `blackroad-cece-operator` | https://blackroad-cece-operator-production.up.railway.app | Primary Cece backend |
| `blackroad-os-operator` | https://blackroad-os-operator-production.up.railway.app | Legacy (consolidate) |

### DELETE (Random test projects - 22 total)
These were auto-created by Railway when deploying with random names:
```
secure-grace
wonderful-celebration
fabulous-connection
noble-gentleness
sincere-recreation
gregarious-wonder
merry-warmth
fulfilling-spirit
discerning-expression
steadfast-delight
intuitive-endurance
impartial-vision
loyal-tranquility
innovative-cooperation
gentle-reprieve
alert-enjoyment
thriving-blessing
terrific-truth
NA-6 (x2)
NA-4
NA-3
```

### REVIEW (May be useful - 16 total)
| Project | Decision |
|---------|----------|
| Operator Engine (x2) | DELETE - duplicates |
| Orchestrator | DELETE - old experiment |
| blackroad-os-core | DELETE - superseded by operator |
| Prism Console | KEEP if using, else DELETE |
| Lucidia Core | KEEP if using, else DELETE |
| railway-blackroad-os | DELETE - old |
| blackroad-os-api | DELETE - superseded |
| blackroad-login | DELETE - not in use |
| Docusaurus Documentation Hub | KEEP if docs needed |
| BlackRoad API | DELETE - superseded |
| BlackRoad Portal | DELETE - superseded |
| lucidia-platform | KEEP if using |
| blackroad-operating-system | DELETE - old name |
| blackroad-os-prism-console | DELETE - duplicate |
| blackroad-os-docs | KEEP if docs needed |

---

## Consolidation Plan

### Step 1: Stop Auto-Deploy on Old Projects

For each project you want to delete, FIRST disable auto-deploy:

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click the project
3. Go to Settings → Deploys
4. Disable "Auto Deploy"
5. This prevents new deploys from creating more projects

### Step 2: Delete Random Projects

Delete all 22 random-name projects:
1. Click project → Settings → Danger Zone → Delete

### Step 3: Consolidate to Single Operator

Keep only `blackroad-cece-operator` as the primary backend:

1. Delete `blackroad-os-operator` (it's a duplicate)
2. Ensure Cece worker points to correct URL
3. Update any other services pointing to old URLs

### Step 4: Clean Up "Review" Projects

Delete unless actively using:
- Operator Engine (both)
- Orchestrator
- blackroad-os-core
- railway-blackroad-os
- blackroad-os-api
- blackroad-login
- BlackRoad API
- BlackRoad Portal
- blackroad-operating-system
- blackroad-os-prism-console

Keep if needed:
- Prism Console (if using UI)
- Lucidia Core (if using)
- lucidia-platform (if using)
- Docusaurus Documentation Hub (if docs needed)
- blackroad-os-docs (if docs needed)

---

## After Consolidation

Final Railway state should be:

| Project | Purpose | URL |
|---------|---------|-----|
| `blackroad-cece-operator` | Primary backend | https://blackroad-cece-operator-production.up.railway.app |
| `blackroad-os-docs` | Documentation (optional) | - |

Everything else → DELETED

---

## Preventing Future Mess

1. **Only deploy via GitHub Actions** - don't use `railway up` manually
2. **Link projects properly** - always `railway link` before deploying
3. **Use explicit service names** - `railway up --service blackroad-operator`
4. **Disable auto-deploy** on projects you don't want auto-updating

---

*Owner: Alexa Louise Amundson*
*Updated: 2025-12-02*
