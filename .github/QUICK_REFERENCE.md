# Deployment Quick Reference

## 🚀 Quick Commands

### Test Locally
```bash
# Test single worker
./scripts/test-deploy-local.sh workers api-gateway

# Test all
./scripts/test-deploy-local.sh all
```

### Manual Deploy via CLI
```bash
# Deploy everything
gh workflow run deploy.yml -f deploy_target=all

# Deploy only workers
gh workflow run deploy.yml -f deploy_target=workers
```

### Check Status
```bash
# List recent runs
gh run list --workflow=deploy.yml

# Watch live
gh run watch
```

## 🔑 Required Secrets

```
CLOUDFLARE_API_TOKEN      ← Get from Cloudflare Dashboard
CLOUDFLARE_ACCOUNT_ID     ← Get from Cloudflare Dashboard
RAILWAY_TOKEN            ← Optional, get from Railway CLI
```

## 📋 Service Counts

- **Workers:** 9 (in `workers/*/`)
- **Pages:** 17 (in `pages/*/`)
- **Railway:** 1 (root)

## 🎯 Deployment Triggers

| Action | Result |
|--------|--------|
| Push to main | Auto-deploy changed services |
| Manual "all" | Deploy everything |
| Manual "workers" | Deploy all workers |
| Manual "pages" | Deploy all pages |

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Secrets error | Check Settings > Secrets |
| Worker fails | Test locally: `cd workers/<name> && wrangler deploy --dry-run` |
| Page fails | Check build: `cd pages/<name> && npm run build` |
| Railway fails | Verify token: `railway whoami --token` |

## 📚 Documentation

- **Setup:** `.github/DEPLOYMENT_SETUP.md`
- **Details:** `docs/DEPLOYMENT_WORKFLOW.md`
- **Summary:** `DEPLOYMENT_SUMMARY.md`
- **Workflow:** `.github/workflows/deploy.yml`

## 🔗 Quick Links

- [GitHub Actions](https://github.com/blackboxprogramming/blackroad-os-operator/actions)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Railway Dashboard](https://railway.app)

## ⚡ Optimization Tips

1. **Only change what's needed** - Path filtering deploys only changed services
2. **Test locally first** - Use `test-deploy-local.sh` before pushing
3. **Use feature branches** - PRs don't trigger deployment
4. **Monitor after deploy** - Check Actions tab and dashboards

## 🎨 Status Badge

```markdown
[![Deploy](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml/badge.svg)](https://github.com/blackboxprogramming/blackroad-os-operator/actions/workflows/deploy.yml)
```
