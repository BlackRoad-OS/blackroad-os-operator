# BlackRoad DNS Checklist

## Pre-Launch DNS Cleanup

### Step 1: Remove Legacy Records

Delete any A/AAAA records pointing to old IPs:

```
# Records to DELETE (if they exist):
A     @           159.65.43.12      # Old DO droplet
A     app         159.65.43.12
A     api         159.65.43.12
AAAA  @           (any)
AAAA  app         (any)
```

### Step 2: Add Tunnel CNAMEs

After creating the tunnel, add these CNAME records:

```bash
# Get your tunnel ID
cloudflared tunnel list

# Add DNS routes (creates CNAMEs automatically)
cloudflared tunnel route dns blackroad-primary app.blackroad.io
cloudflared tunnel route dns blackroad-primary api.blackroad.io
cloudflared tunnel route dns blackroad-primary console.blackroad.io
cloudflared tunnel route dns blackroad-primary dashboard.blackroad.io
cloudflared tunnel route dns blackroad-primary studio.blackroad.io
cloudflared tunnel route dns blackroad-primary finance.blackroad.io
cloudflared tunnel route dns blackroad-primary cece.blackroad.io
cloudflared tunnel route dns blackroad-primary identity.blackroad.io
```

### Step 3: Verify DNS Resolution

```bash
# Each should return CNAME to tunnel
for h in app api console dashboard studio finance cece identity; do
  echo "=== $h.blackroad.io ==="
  dig +short CNAME $h.blackroad.io
done
```

---

## Current DNS State (blackroad.io)

Run this to check current state:

```bash
dig blackroad.io ANY +short
```

### Expected Records

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | app | [tunnel-id].cfargotunnel.com | Orange |
| CNAME | api | [tunnel-id].cfargotunnel.com | Orange |
| CNAME | console | [tunnel-id].cfargotunnel.com | Orange |
| CNAME | dashboard | [tunnel-id].cfargotunnel.com | Orange |
| CNAME | cece | blackroad-cece.amundsonalexa.workers.dev | Orange |
| TXT | @ | openai-domain-verification=... | - |
| TXT | @ | atlassian-domain-verification=... | - |
| MX | @ | (mail records) | - |

---

## Validation Script

```bash
#!/bin/bash
# validate-dns.sh

echo "=== BlackRoad DNS Validation ==="

domains=(
  "blackroad.io"
  "app.blackroad.io"
  "api.blackroad.io"
  "console.blackroad.io"
  "dashboard.blackroad.io"
  "cece.blackroad.io"
)

for domain in "${domains[@]}"; do
  echo ""
  echo "--- $domain ---"

  # Check if resolves
  ip=$(dig +short A $domain | head -1)
  cname=$(dig +short CNAME $domain | head -1)

  if [ -n "$cname" ]; then
    echo "CNAME: $cname"
  elif [ -n "$ip" ]; then
    echo "A: $ip"
  else
    echo "NO RECORD"
  fi

  # Check HTTP response
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$domain" 2>/dev/null)
  echo "HTTP: $status"
done
```

---

## Orange vs Gray Cloud Rules

| Scenario | Cloud Status | Why |
|----------|--------------|-----|
| Tunnel CNAME | Orange | Always proxied for Zero Trust |
| Workers subdomain | Orange | Proxied through CF |
| External service | Gray | Direct, no CF proxy |
| MX records | Gray (auto) | Mail must be direct |

---

## Troubleshooting

### "Too many redirects"
- Check SSL/TLS mode in Cloudflare: should be "Full" or "Full (strict)"
- Ensure origin isn't forcing HTTPS redirect

### "522 Connection timed out"
- Tunnel not running: `systemctl status blackroad-tunnel`
- Check ingress config matches service ports

### "Access denied" (403)
- Zero Trust policy blocking: check Access app in dashboard
- Service token missing from request

### DNS not updating
- Wait 5 minutes (TTL)
- Flush local DNS: `sudo dscacheutil -flushcache`
- Check with different DNS: `dig @8.8.8.8 app.blackroad.io`

---

*Created: 2025-12-03*
