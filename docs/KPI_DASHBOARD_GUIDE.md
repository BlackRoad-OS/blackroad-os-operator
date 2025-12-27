# BlackRoad OS - KPI Dashboard Guide

## Overview

Cryptographically verified KPI dashboard with real-time metrics collection and PS-SHA-∞ verification.

**Live Dashboard:** https://kpi.blackroad.io (after deployment)

## Features

- ✅ **Real-time metrics** - Auto-refreshes every 60 seconds
- ✅ **Cryptographic verification** - PS-SHA-∞ hash validation
- ✅ **Comprehensive KPIs** - Code, infrastructure, agents, APIs, GitHub
- ✅ **Beautiful UI** - Gradient design with BlackRoad brand colors
- ✅ **Mobile responsive** - Works on all devices
- ✅ **Zero dependencies** - Pure HTML/CSS/JS

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KPI Dashboard System                      │
└─────────────────────────────────────────────────────────────┘

1. Data Collection (scripts/collect-kpi-data.py)
   ├── Scans local repository for code metrics
   ├── Queries GitHub API for org/repo data
   ├── Counts infrastructure files (Terraform, K8s, Docker)
   ├── Analyzes agent catalog YAML
   └── Generates PS-SHA-∞ verification hash

2. Data Storage (metrics/data/)
   ├── kpi-data-YYYY-MM-DD.json (daily snapshots)
   └── latest.json (current metrics for dashboard)

3. Dashboard (pages/kpi-dashboard/index.html)
   ├── Fetches latest.json via HTTP
   ├── Displays metrics in responsive cards
   ├── Shows verification hash
   └── Auto-refreshes every 60s

4. Deployment (Cloudflare Pages)
   └── Serves static HTML + JSON data
```

## Verified Metrics (Dec 23, 2025)

### Code
- **1,161,185 LOC** across 19,713 files
- **210 commits** in operator repo
- **56 repositories** across 15 GitHub organizations
- **Languages:** Python, TypeScript, JavaScript, Go, C/C++

### Infrastructure
- **26 Cloudflare Workers** (edge computing)
- **33 Cloudflare Pages** (static sites)
- **16 Cloudflare Zones** (DNS)
- **52 CI/CD workflows** (GitHub Actions)
- **7 Terraform modules**
- **60 integrations**

### Agents & APIs
- **29 total agents** (from agent-catalog/agents.yaml)
- **API routes** detected in Python & TypeScript
- **60 API domains** (integration configs)

### GitHub
- **15 organizations**
- **56 total repositories**

## Quick Start

### 1. Collect Metrics

```bash
# From blackroad-os-operator directory
python3 scripts/collect-kpi-data.py
```

**Output:**
- `metrics/data/kpi-data-2025-12-23.json` - Daily snapshot
- `metrics/data/latest.json` - Current metrics for dashboard

### 2. View Dashboard Locally

```bash
# Start local server
cd pages/kpi-dashboard
python3 -m http.server 8000
```

Visit: http://localhost:8000

**Note:** You'll need to copy `metrics/data/latest.json` to `pages/kpi-dashboard/metrics/data/latest.json` for local testing.

### 3. Deploy to Cloudflare Pages

```bash
# Option A: Manual deployment
wrangler pages deploy pages/kpi-dashboard --project-name=kpi-blackroad

# Option B: Automated via GitHub Actions (recommended)
git add .
git commit -m "Update KPI dashboard"
git push origin main
```

## Automated Daily Updates

### Cron Job Setup

```bash
# Edit crontab
crontab -e

# Add daily collection at 2 AM UTC
0 2 * * * cd /path/to/blackroad-os-operator && python3 scripts/collect-kpi-data.py
```

### GitHub Action (Recommended)

Create `.github/workflows/kpi-collector.yml`:

```yaml
name: Daily KPI Collection

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install pyyaml  # if needed

      - name: Collect KPI data
        run: python3 scripts/collect-kpi-data.py

      - name: Commit & push
        run: |
          git config user.name "KPI Bot"
          git config user.email "bot@blackroad.io"
          git add metrics/data/
          git commit -m "📊 Daily KPI update $(date +%Y-%m-%d)"
          git push
```

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

**Advantages:**
- Free tier: Unlimited requests
- Global CDN
- Automatic HTTPS
- Custom domains
- Auto-deploy on git push

**Setup:**

1. **Via Wrangler CLI:**
```bash
wrangler pages deploy pages/kpi-dashboard --project-name=kpi-blackroad
```

2. **Via Cloudflare Dashboard:**
   - Go to Cloudflare Dashboard > Workers & Pages
   - Click "Create application" > "Pages"
   - Connect your GitHub repo
   - Set build settings:
     - Build output directory: `pages/kpi-dashboard`
     - No build command needed (static HTML)
   - Deploy

3. **Custom Domain:**
```bash
# Add custom domain
wrangler pages project create kpi-blackroad
wrangler pages deployment list --project-name=kpi-blackroad
```

Then in Cloudflare Dashboard:
- Pages > kpi-blackroad > Custom domains
- Add: `kpi.blackroad.io`

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd pages/kpi-dashboard
netlify deploy --prod
```

### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd pages/kpi-dashboard
vercel --prod
```

### Option 4: GitHub Pages

```yaml
# .github/workflows/deploy-dashboard.yml
name: Deploy KPI Dashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./pages/kpi-dashboard
```

## Verification System

### PS-SHA-∞ Protocol

The dashboard uses a simplified PS-SHA-∞ verification:

1. **Data Collection** - Gather all KPI metrics
2. **Serialization** - Convert to deterministic JSON (sorted keys)
3. **Hash Generation** - SHA-256 of serialized data
4. **Display** - Show first 16 chars + "..." on dashboard

**Full verification:**

```bash
# Get verification hash from dashboard
HASH="e640ac56b3ea5a55..."

# Recompute hash locally
python3 scripts/collect-kpi-data.py
jq -S . metrics/data/latest.json | shasum -a 256

# Hashes should match
```

## Dashboard Metrics

### Code Metrics
| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Total LOC | `find` + `wc -l` | On collection |
| Total Files | `find` count | On collection |
| Commits | `git log` count | On collection |
| Contributors | `git log` unique authors | On collection |

### Infrastructure
| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Cloudflare Workers | `workers/` directory count | On collection |
| Cloudflare Pages | `pages/` directory count | On collection |
| Workflows | `.github/workflows/*.yml` | On collection |
| Docker | `Dockerfile*` count | On collection |

### Agents
| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Total Agents | `agent-catalog/agents.yaml` | On collection |
| Operator-Level | YAML `operatorLevel: true` | On collection |

### GitHub
| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Organizations | Hardcoded list (15) | Manual |
| Repositories | `gh repo list` per org | On collection |

## Customization

### Brand Colors

Edit `pages/kpi-dashboard/index.html` CSS variables:

```css
:root {
    --accent-orange: #FF9D00;
    --accent-pink: #FF0066;
    --accent-purple: #7700FF;
    --accent-blue: #0066FF;
    --accent-green: #00ff88;
}
```

### Auto-Refresh Interval

Change refresh rate (default: 60 seconds):

```javascript
// In index.html, change this line:
setInterval(loadMetrics, 60000);  // 60000ms = 60s
```

### Add New Metrics

1. **Update collector** (`scripts/collect-kpi-data.py`):
```python
def collect_new_metrics() -> Dict[str, Any]:
    return {"new_metric": 123}

# Add to main data dict:
data["new_category"] = collect_new_metrics()
```

2. **Update dashboard** (`pages/kpi-dashboard/index.html`):
```html
<!-- Add metric card -->
<div class="metric-card">
    <h2>📊 New Metric</h2>
    <div class="metric-value" id="new-metric">0</div>
    <div class="metric-label">Description</div>
</div>

<!-- Add JavaScript -->
<script>
document.getElementById('new-metric').textContent = data.new_category.new_metric;
</script>
```

## Troubleshooting

### Dashboard shows "Loading..." forever

**Cause:** `latest.json` not found

**Fix:**
```bash
python3 scripts/collect-kpi-data.py
# Ensure metrics/data/latest.json exists
```

### Metrics are zero

**Cause:** Scripts not finding files

**Fix:**
```bash
# Check you're in the right directory
pwd  # Should be blackroad-os-operator

# Test file counts manually
find . -name "*.py" | wc -l
```

### Hash verification fails

**Cause:** Data changed between collection and verification

**Fix:**
```bash
# Recollect data
python3 scripts/collect-kpi-data.py

# Verify immediately
cat metrics/data/latest.json | jq -S . | shasum -a 256
```

### GitHub repo counts are 0

**Cause:** `gh` CLI not installed or authenticated

**Fix:**
```bash
# Install gh CLI
brew install gh  # macOS
# or: https://cli.github.com/

# Authenticate
gh auth login
```

## Maintenance

### Daily
- ✅ Automated collection via cron/GitHub Actions
- ✅ Auto-deploy to Cloudflare Pages on push

### Weekly
- Review metrics for anomalies
- Check verification hashes

### Monthly
- Archive old `kpi-data-*.json` files
- Review and expand KPI coverage

## Security

### Data Privacy
- ✅ No sensitive data in metrics (API keys, passwords, etc.)
- ✅ All data is public-safe (repo counts, LOC, etc.)
- ✅ Verification hash is cryptographically sound

### Access Control
- Dashboard is public (no auth required)
- Collection scripts run with user permissions
- GitHub API uses personal access token (if configured)

## Performance

### Collection Time
- Local metrics: ~2-5 seconds
- GitHub API queries: ~5-10 seconds per org
- Total: ~30-60 seconds for full collection

### Dashboard Load Time
- Initial load: <1 second
- Auto-refresh: <100ms (JSON fetch only)

## Future Enhancements

- [ ] Historical trend charts (Chart.js)
- [ ] Comparison with previous periods
- [ ] Email/Slack alerts on threshold breaches
- [ ] Real-time websocket updates
- [ ] Export to PDF/CSV
- [ ] Multi-repo aggregation dashboard

## Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **GitHub CLI:** https://cli.github.com/
- **PS-SHA-∞ Spec:** (internal BlackRoad documentation)

## Support

- **Issues:** https://github.com/BlackRoad-OS/blackroad-os-operator/issues
- **Email:** blackroad.systems@gmail.com
- **Review Queue:** Linear

---

**Version:** 1.0.0
**Last Updated:** December 23, 2025
**Author:** Alexa Amundson
**License:** BlackRoad OS License
