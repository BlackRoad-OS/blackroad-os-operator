# BlackRoad GitHub Secrets Setup

Configure these secrets in each BlackRoad repository for automated deployments.

## Required Secrets

### For ALL Repositories

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers & Pages permissions | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `848cf0b18d51e0170e0d1537aec3505a` |

### For Repositories with Railway Services

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `RAILWAY_TOKEN` | Railway API token | [Railway Dashboard](https://railway.app/account/tokens) |

### For Cross-Repository Triggers

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `CROSS_REPO_TOKEN` | GitHub PAT with repo scope | [GitHub Settings](https://github.com/settings/tokens) |

## Quick Setup Script

Run this to set secrets on all BlackRoad repos:

```bash
#!/bin/bash
# Set these values first
CLOUDFLARE_TOKEN="your-cloudflare-token"
RAILWAY_TOKEN="your-railway-token"
CROSS_REPO_TOKEN="your-github-pat"

REPOS=(
  "BlackRoad-OS/blackroad-os-operator"
  "BlackRoad-OS/blackroad-os-web"
  "BlackRoad-OS/blackroad-os-api"
  "BlackRoad-OS/blackroad-os-prism-console"
  "BlackRoad-OS/blackroad-os-brand"
  "BlackRoad-OS/blackroad-os-docs"
  "BlackRoad-OS/blackroad-os-agents"
  "BlackRoad-OS/blackroad-os-infra"
)

for repo in "${REPOS[@]}"; do
  echo "Setting secrets for $repo..."

  gh secret set CLOUDFLARE_API_TOKEN --repo "$repo" --body "$CLOUDFLARE_TOKEN"
  gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$repo" --body "848cf0b18d51e0170e0d1537aec3505a"
  gh secret set RAILWAY_TOKEN --repo "$repo" --body "$RAILWAY_TOKEN"
  gh secret set CROSS_REPO_TOKEN --repo "$repo" --body "$CROSS_REPO_TOKEN"

  echo "✅ $repo configured"
done
```

## Cloudflare API Token Permissions

Create a token with these permissions:

```
Account > Cloudflare Pages > Edit
Account > Workers Scripts > Edit
Account > Workers KV Storage > Edit
Account > Workers Routes > Edit
Zone > Zone > Read (all zones)
Zone > DNS > Edit (all zones)
```

## Verifying Setup

Check if secrets are set:

```bash
gh secret list --repo BlackRoad-OS/blackroad-os-operator
```

## Workflow Integration

After setting secrets, any PR merged to `main` will automatically:

1. Detect what changed (workers, pages, railway)
2. Deploy affected components
3. Run health checks on all domains
4. Report status in GitHub Actions summary

## Domain Routing

All domains route through this infrastructure:

| Domain | Components |
|--------|------------|
| blackroad.io | router, api-gateway, blackroad-os-web |
| api.blackroad.io | api-gateway |
| cece.blackroad.io | cece worker |
| blackroadai.com | blackroadai-router, blackroad-os-web |
| blackroad.network | blackroad-network-router, blackroad-os-web |
| blackroadquantum.com | blackroadquantum-router, blackroad-os-web |
| lucidia.earth | lucidia-earth-router, blackroad-os-web |
| lucidia.studio | lucidia-studio-router, blackroad-os-web |

## Troubleshooting

### Deployment fails with "Authentication error"
- Verify `CLOUDFLARE_API_TOKEN` is set correctly
- Check token hasn't expired
- Ensure token has correct permissions

### Railway deployment fails
- Verify `RAILWAY_TOKEN` is set
- Check project is linked in railway.toml

### Cross-repo triggers don't work
- Verify `CROSS_REPO_TOKEN` is a GitHub PAT with `repo` scope
- Check the PAT hasn't expired
