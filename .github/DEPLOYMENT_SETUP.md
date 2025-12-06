# BlackRoad OS Deployment Setup Guide

## Quick Start

### 1. Configure GitHub Secrets

Go to: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

#### Required for Cloudflare Workers & Pages:
```
Name: CLOUDFLARE_API_TOKEN
Value: <your-cloudflare-api-token>
```

```
Name: CLOUDFLARE_ACCOUNT_ID
Value: <your-cloudflare-account-id>
```

#### Optional for Railway:
```
Name: RAILWAY_TOKEN
Value: <your-railway-token>
```

---

## Getting Cloudflare Credentials

### 1. Get API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on your profile icon (top right) > **My Profile**
3. Navigate to **API Tokens** tab
4. Click **Create Token**
5. Use the **Edit Cloudflare Workers** template OR create custom with:
   - **Account** > **Cloudflare Pages** > **Edit**
   - **Account** > **Workers Scripts** > **Edit**
   - **Zone** > **Workers Routes** > **Edit**
6. Click **Continue to summary** > **Create Token**
7. Copy the token (you won't see it again!)

### 2. Get Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on any zone/domain (e.g., blackroad.io)
3. Scroll down the Overview page
4. Copy **Account ID** from the right sidebar

---

## Getting Railway Token

### Option 1: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Get your token
railway whoami --token
```

### Option 2: From Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your profile > **Account Settings**
3. Navigate to **Tokens** tab
4. Click **Create Token**
5. Give it a name (e.g., "GitHub Actions")
6. Copy the token

---

## Verify Setup

### Test Secrets Configuration

1. Go to **Actions** tab in GitHub
2. Click **Deploy BlackRoad OS Services**
3. Click **Run workflow**
4. Select `workers` from dropdown
5. Click **Run workflow**

If configured correctly:
- Workflow will start
- Workers will build and deploy
- You'll see deployment summary

### Check Deployment Logs

```bash
# View recent workflow runs
gh run list --workflow=deploy.yml

# View specific run
gh run view <run-id>

# Watch live
gh run watch
```

---

## Service Inventory

### Cloudflare Workers (9 total)
Located in `/workers/*/`

- `api-gateway` - Main API edge router
- `auth` - Authentication service
- `billing` - Billing and payments
- `cece` - AI agent worker
- `cipher` - Encryption/decryption
- `identity` - Identity management
- `intercept` - Request interceptor
- `router` - Traffic router
- `sovereignty` - Access control
- `status` - Status page worker

### Cloudflare Pages (17 total)
Located in `/pages/*/`

- `api-docs` - API documentation
- `brands` - Brand management
- `console` - Admin console
- `creator` - Creator portal
- `dashboard` - Main dashboard
- `devops` - DevOps portal
- `education` - Education hub
- `finance` - Finance portal
- `hello` - Landing page
- `ideas` - Ideas board
- `legal` - Legal documents
- `portals` - Portal hub
- `portals-unified` - Unified portals
- `research` - Research hub
- `studio` - Studio interface
- `systems` - Systems dashboard
- `unified` - Unified interface

### Railway Services
Main operator service in project root

---

## Deployment Triggers

### Automatic (on push to main)
```bash
git add .
git commit -m "Update api-gateway worker"
git push origin main
```

**Result:** Only `api-gateway` deploys (smart path detection)

### Manual (deploy all)
1. Go to **Actions** > **Deploy BlackRoad OS Services**
2. Click **Run workflow**
3. Select `all`
4. Click **Run workflow**

**Result:** All workers, pages, and Railway deploy

### Manual (deploy specific type)
Same as above, but select:
- `workers` - Deploy only Cloudflare Workers
- `pages` - Deploy only Cloudflare Pages
- `railway` - Deploy only Railway service

---

## Troubleshooting

### "Secrets not configured" error

**Problem:** Workflow can't find CLOUDFLARE_API_TOKEN

**Solution:**
1. Verify secret name is exact: `CLOUDFLARE_API_TOKEN` (case-sensitive)
2. Re-create the secret
3. Try re-running the workflow

### Worker deployment fails

**Check wrangler.toml:**
```bash
cat workers/<worker-name>/wrangler.toml
```

**Test locally:**
```bash
cd workers/<worker-name>
npm install
npx wrangler deploy --dry-run
```

### Page deployment fails

**Check build:**
```bash
cd pages/<page-name>
npm install
npm run build
ls -la dist/  # or build/, out/, etc.
```

**Common issues:**
- Missing `build` script in package.json
- Build fails due to missing dependencies
- Wrong output directory

### Railway deployment fails

**Check token:**
```bash
railway whoami --token
```

**Test connection:**
```bash
railway link --environment production
railway status
```

---

## Monitoring Deployments

### GitHub Actions UI
- Real-time logs for each job
- Deployment summaries
- Success/failure indicators

### Cloudflare Dashboard
**Workers:**
- Dashboard > Workers & Pages
- Click on worker name
- View deployments and logs

**Pages:**
- Dashboard > Workers & Pages > Pages
- Click on project name
- View deployments and builds

### Railway Dashboard
- railway.app > Your Project
- Click on service
- View **Deployments** tab

---

## Best Practices

### 1. Test Locally First
```bash
cd workers/api-gateway
npm run build
npx wrangler deploy --dry-run
```

### 2. Use Feature Branches
```bash
git checkout -b feature/update-api
# Make changes
git push origin feature/update-api
# Create PR (doesn't trigger deployment)
# Review and merge to main (triggers deployment)
```

### 3. Monitor After Deploy
- Check GitHub Actions summary
- Verify in Cloudflare/Railway dashboard
- Test the deployed service

### 4. Rollback if Needed
```bash
# Git revert
git revert HEAD
git push origin main

# Or Cloudflare rollback
cd workers/api-gateway
npx wrangler rollback
```

---

## Status Badge

Add to README.md:
```markdown
[![Deploy](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml/badge.svg)](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml)
```

---

## Need Help?

- **Workflow file:** `.github/workflows/deploy.yml`
- **Documentation:** `docs/DEPLOYMENT_WORKFLOW.md`
- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **Railway Docs:** https://docs.railway.app/
- **Review Queue:** blackroad.systems@gmail.com
