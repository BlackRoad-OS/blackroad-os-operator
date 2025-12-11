# BlackRoad OS Secrets Configuration Guide

This document outlines all secrets and environment variables required for the BlackRoad OS Operator and its integrations.

## GitHub Actions Secrets

Set these secrets in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

### Core Infrastructure

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `RAILWAY_TOKEN` | Railway deployment token | Yes | [Railway Dashboard](https://railway.app/account/tokens) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers permissions | Yes | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Yes | [Cloudflare Dashboard](https://dash.cloudflare.com/) |

### DigitalOcean

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `DO_API_TOKEN` | DigitalOcean API token | Yes | [DO API Tokens](https://cloud.digitalocean.com/account/api/tokens) |
| `DIGITALOCEAN_SSH_KEY` | SSH private key for droplet access | Yes | Generate with `ssh-keygen` |
| `DO_SPACES_KEY` | Spaces access key | Optional | [DO Spaces Keys](https://cloud.digitalocean.com/account/api/tokens) |
| `DO_SPACES_SECRET` | Spaces secret key | Optional | [DO Spaces Keys](https://cloud.digitalocean.com/account/api/tokens) |

### Asana Integration

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `ASANA_ACCESS_TOKEN` | Personal access token or OAuth token | Yes | [Asana Developer Console](https://app.asana.com/0/developer-console) |
| `ASANA_WORKSPACE_ID` | Your Asana workspace GID | Yes | Use API: `GET /workspaces` |
| `ASANA_DEPLOYMENTS_PROJECT` | GID of deployments tracking project | Yes | Use API: `GET /projects` |
| `ASANA_WORKER_API_KEY` | API key for the Asana worker | Optional | Generate a secure key |

### Shellfish Integration

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `SHELLFISH_API_KEY` | API key for Shellfish worker | Yes | Generate a secure key |
| `SHELLFISH_SIGNING_SECRET` | Secret for webhook signatures | Yes | Generate with `openssl rand -hex 32` |
| `PROD_SSH_KEY` | SSH key for production servers | Yes | Generate with `ssh-keygen` |
| `STAGING_SSH_KEY` | SSH key for staging servers | Optional | Generate with `ssh-keygen` |

### Notion Integration

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `NOTION_TOKEN` | Notion internal integration token | Yes | [Notion Integrations](https://www.notion.so/my-integrations) |
| `NOTION_WORKSPACE_ID` | Workspace ID | Optional | From Notion URL |
| `NOTION_DEPLOYMENTS_DATABASE_ID` | Deployments database ID | Optional | From database URL |

### Linear Integration

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `LINEAR_API_KEY` | Linear API key | Yes | [Linear Settings](https://linear.app/settings/api) |
| `LINEAR_ORG_ID` | Organization ID | Optional | Use API |
| `LINEAR_INFRA_TEAM_ID` | Infrastructure team ID | Optional | Use API |

### Vercel

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `VERCEL_TOKEN` | Vercel deployment token | Optional | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | Optional | [Vercel Dashboard](https://vercel.com/) |

### Messaging & Notifications

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `SLACK_DEPLOYMENTS_WEBHOOK` | Slack webhook for #deployments | Optional | [Slack Apps](https://api.slack.com/apps) |
| `SLACK_ALERTS_WEBHOOK` | Slack webhook for #alerts | Optional | [Slack Apps](https://api.slack.com/apps) |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Optional | Discord Server Settings > Integrations |

### AI/LLM Services

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `OPENAI_API_KEY` | OpenAI API key | Yes | [OpenAI Dashboard](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes | [Anthropic Console](https://console.anthropic.com/) |

### Payments (Stripe)

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Optional | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Optional | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |

### Observability

| Secret | Description | Required | Where to Get |
|--------|-------------|----------|--------------|
| `SENTRY_DSN` | Sentry project DSN | Optional | [Sentry Settings](https://sentry.io/settings/) |
| `DATADOG_API_KEY` | DataDog API key | Optional | [DataDog API Keys](https://app.datadoghq.com/organization-settings/api-keys) |
| `POSTHOG_API_KEY` | PostHog project API key | Optional | [PostHog Settings](https://app.posthog.com/project/settings) |

---

## Cloudflare Worker Secrets

Set these using `wrangler secret put <SECRET_NAME>` from the worker directory.

### asana-manager worker
```bash
cd workers/asana-manager
wrangler secret put ASANA_ACCESS_TOKEN
wrangler secret put ASANA_WORKSPACE_ID
```

### shellfish worker
```bash
cd workers/shellfish
wrangler secret put SHELLFISH_API_KEY
wrangler secret put SHELLFISH_SIGNING_SECRET
```

### digitalocean-manager worker
```bash
cd workers/digitalocean-manager
wrangler secret put DO_API_TOKEN
```

---

## Local Development

1. Copy the env template:
   ```bash
   cp operator.env.example .env
   ```

2. Fill in your development values in `.env`

3. Never commit `.env` to version control

---

## Security Best Practices

1. **Rotate secrets regularly** - Set calendar reminders to rotate API keys quarterly
2. **Use least privilege** - Create tokens with minimal required permissions
3. **Audit access** - Review who has access to secrets periodically
4. **Use environment-specific secrets** - Don't use production secrets in development
5. **Enable 2FA** - Enable two-factor authentication on all service accounts

---

## Quick Setup Checklist

### Minimum Required (MVP)
- [ ] `RAILWAY_TOKEN`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

### Full Deployment Sync
- [ ] `ASANA_ACCESS_TOKEN`
- [ ] `ASANA_WORKSPACE_ID`
- [ ] `NOTION_TOKEN`
- [ ] `LINEAR_API_KEY`
- [ ] `SLACK_DEPLOYMENTS_WEBHOOK`

### DigitalOcean Management
- [ ] `DO_API_TOKEN`
- [ ] `DIGITALOCEAN_SSH_KEY`

### Shellfish Terminal Access
- [ ] `SHELLFISH_API_KEY`
- [ ] `SHELLFISH_SIGNING_SECRET`
- [ ] `PROD_SSH_KEY`

---

## Troubleshooting

### "Unauthorized" errors
- Check that your token hasn't expired
- Verify the token has the required scopes/permissions
- Ensure the secret name matches exactly (case-sensitive)

### Workflow failing to find secrets
- Confirm the secret is set at the repository level (not environment)
- Check for typos in secret names
- Verify the workflow has permission to access secrets

### Cloudflare worker errors
- Run `wrangler secret list` to verify secrets are set
- Check wrangler.toml for correct secret bindings
- Verify the worker has been deployed after setting secrets
