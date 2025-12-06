# BlackRoad OS Deployment Workflow

## Overview

The `deploy.yml` GitHub Actions workflow provides automated deployment for all BlackRoad OS services across multiple platforms:

- **Cloudflare Workers** (9 workers in `/workers/*`)
- **Cloudflare Pages** (17+ pages in `/pages/*`)
- **Railway** (main operator service)

## Features

### 1. Smart Path Filtering
Only deploys services that have changed:
- Workers deploy only when files in `workers/*/` change
- Pages deploy only when files in `pages/*/` change
- Railway deploys when core service files change

### 2. Parallel Deployment
Uses GitHub Actions matrix strategy to deploy multiple services in parallel:
- All changed workers deploy simultaneously
- All changed pages deploy simultaneously
- Reduces deployment time from sequential to parallel execution

### 3. Dependency Caching
Optimizes build times with multi-level caching:
- Worker-specific `node_modules` cache
- Page-specific `node_modules` cache
- Root-level dependencies cache
- Cache keys based on package.json hashes

### 4. Manual Triggers
Supports workflow_dispatch for on-demand deployments:
- Deploy all services
- Deploy only workers
- Deploy only pages
- Deploy only Railway

## Trigger Conditions

### Automatic Deployment
```yaml
on:
  push:
    branches: [main]
```
Triggers on every push to main branch.

### Manual Deployment
```yaml
on:
  workflow_dispatch:
    inputs:
      deploy_target:
        type: choice
        options: [all, workers, pages, railway]
```
Manually trigger from GitHub Actions UI.

## Required Secrets

Configure these in GitHub Settings > Secrets and variables > Actions:

### Cloudflare (Required)
```bash
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
```

**To get these:**
1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create token with permissions:
   - Account > Cloudflare Pages > Edit
   - Account > Workers Scripts > Edit
   - Zone > Workers Routes > Edit
3. Copy Account ID from any zone's Overview page

### Railway (Optional)
```bash
RAILWAY_TOKEN=<your-railway-token>
```

**To get this:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Run: `railway login`
3. Run: `railway whoami --token`

## Workflow Jobs

### 1. detect-changes
Identifies which services need deployment:
- Uses `dorny/paths-filter` to detect file changes
- Outputs lists of changed workers and pages
- Runs on every deployment

### 2. deploy-workers
Deploys Cloudflare Workers in parallel:
- Matrix strategy: one job per changed worker
- Installs dependencies with caching
- Builds worker (if build script exists)
- Deploys using wrangler CLI
- Outputs deployment info to summary

**Workers deployed:**
- api-gateway
- billing
- cece
- cipher
- identity
- intercept
- router
- sovereignty
- status

### 3. deploy-pages
Deploys Cloudflare Pages in parallel:
- Matrix strategy: one job per changed page
- Installs dependencies with caching
- Builds page (if build script exists)
- Auto-detects output directory (dist/build/out/.next/public)
- Creates Pages project if needed
- Deploys using wrangler CLI

**Pages deployed:**
- api-docs
- brands
- console
- creator
- dashboard
- devops
- education
- finance
- hello
- ideas
- legal
- portals
- portals-unified
- research
- studio
- systems
- unified

### 4. deploy-railway
Deploys main operator service:
- Only runs if Railway token is configured
- Links to production environment
- Deploys with detached mode
- Uses Railway CLI

### 5. summary
Generates deployment report:
- Lists all deployed services
- Shows deployment status
- Displays in GitHub Actions summary

## Usage Examples

### Automatic Deployment
Push to main branch:
```bash
git add .
git commit -m "Update api-gateway worker"
git push origin main
```

Only `api-gateway` worker will deploy.

### Manual Deployment - All Services
1. Go to Actions tab
2. Select "Deploy BlackRoad OS Services"
3. Click "Run workflow"
4. Select `all` from dropdown
5. Click "Run workflow"

### Manual Deployment - Workers Only
1. Same as above
2. Select `workers` from dropdown

### Check Deployment Status
1. Go to Actions tab
2. Click on latest workflow run
3. View job summaries and logs

## Deployment Flow

```
┌─────────────────────────────────────────┐
│  Push to main or manual trigger        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  detect-changes                         │
│  - Filter changed paths                 │
│  - Detect workers/pages to deploy       │
└────────┬──────────────┬─────────────────┘
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ Workers      │  │ Pages        │
│ (parallel)   │  │ (parallel)   │
│              │  │              │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Worker 1 │ │  │ │ Page 1   │ │
│ └──────────┘ │  │ └──────────┘ │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Worker 2 │ │  │ │ Page 2   │ │
│ └──────────┘ │  │ └──────────┘ │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Worker N │ │  │ │ Page N   │ │
│ └──────────┘ │  │ └──────────┘ │
└──────┬───────┘  └──────┬───────┘
       │                  │
       └────────┬─────────┘
                │
                ▼
       ┌─────────────────┐
       │ Railway (main)  │
       └────────┬─────────┘
                │
                ▼
       ┌─────────────────┐
       │ Summary Report  │
       └─────────────────┘
```

## Optimization Features

### 1. Fail-Fast: False
```yaml
strategy:
  fail-fast: false
```
One failed deployment doesn't cancel others.

### 2. Prefer Offline
```yaml
npm ci --prefer-offline --no-audit
```
Uses local cache when available.

### 3. Conditional Steps
```yaml
if: grep -q '"build"' package.json
```
Only runs build if script exists.

### 4. Multi-Level Cache
```yaml
cache: 'npm'
cache-dependency-path: 'workers/${{ matrix.worker }}/package*.json'
```
Caches at worker/page level for maximum efficiency.

## Troubleshooting

### Worker Deployment Fails

**Check wrangler.toml:**
```bash
cat workers/api-gateway/wrangler.toml
```

**Test locally:**
```bash
cd workers/api-gateway
npm install
wrangler deploy --dry-run
```

### Page Deployment Fails

**Check build output:**
```bash
cd pages/dashboard
npm run build
ls -la dist/  # or build/, out/, etc.
```

**Test locally:**
```bash
npx wrangler pages dev dist/
```

### Railway Deployment Fails

**Check Railway token:**
```bash
railway whoami --token
```

**Test link:**
```bash
railway link --environment production
railway status
```

### Secrets Not Working

**Verify in GitHub:**
1. Settings > Secrets and variables > Actions
2. Check secret names match exactly
3. Re-create if needed

## Monitoring

### GitHub Actions Summary
Each deployment shows:
- Service name
- Deployment status
- Output directory (for pages)
- Success/failure indicators

### Cloudflare Dashboard
Check deployments:
- Workers: Cloudflare Dashboard > Workers & Pages
- Pages: Cloudflare Dashboard > Workers & Pages > Pages

### Railway Dashboard
- railway.app > Your Project > Deployments
- View logs and status

## Best Practices

### 1. Test Before Pushing
```bash
# Test worker locally
cd workers/api-gateway
npm run build
wrangler deploy --dry-run

# Test page locally
cd pages/dashboard
npm run build
npx wrangler pages dev dist/
```

### 2. Use Feature Branches
```bash
git checkout -b feature/update-worker
# Make changes
git push origin feature/update-worker
# Create PR - won't trigger deployment
# Merge to main - triggers deployment
```

### 3. Monitor Deployments
- Watch GitHub Actions after each push
- Check Cloudflare/Railway dashboards
- Verify services are running

### 4. Rollback if Needed
```bash
# Revert commit
git revert HEAD
git push origin main

# Or deploy previous version manually
cd workers/api-gateway
wrangler rollback
```

## Status Badges

Add to your README.md:

```markdown
[![Deploy BlackRoad OS Services](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml/badge.svg)](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml)
```

Shows live deployment status.

## Related Files

- `.github/workflows/deploy.yml` - Main workflow file
- `.github/workflows/auto-deploy.yml` - Legacy single-service deployment
- `workers/*/wrangler.toml` - Worker configurations
- `pages/*/package.json` - Page build configurations

## Future Enhancements

- [ ] Add deployment notifications (Slack/Discord)
- [ ] Integrate with Linear for deployment tracking
- [ ] Add smoke tests after deployment
- [ ] Deploy to preview environments
- [ ] Add rollback automation
- [ ] Integration with PS-SHA∞ verification
