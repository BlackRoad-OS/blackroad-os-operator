# Recovery Playbook: Droplet 159.65.43.12, Raspberry Pi, and Cloudflare Tunnel

Owner: Alexa Amundson  
Context: DigitalOcean droplet `159.65.43.12`, primary Raspberry Pi (`192.168.4.49`), and Cloudflare Tunnel `52915859-da18-4aa6-add5-7bd9fcac2e0b` are offline. This playbook provides a rapid checklist to bring them back online without changing credentials.

---

## 1) DigitalOcean Droplet `159.65.43.12` (codex-infinity)

1. **Preflight**
   - Confirm SSH key `~/.ssh/id_ed25519` is loaded: `ssh-add -l | grep id_ed25519`.
   - Verify fingerprints match inventory:
     - `ed25519: AAAAC3NzaC1lZDI1NTE5AAAAIM/N1UdHNhVhDpk6Ba7K0L8lqPY3oc//VRGfpEkY+1EK`
     - `rsa: SHA256:b3uikwBkwnxpMTZjWBFaNgscsWXHRRG3Snj9QYke+ok=`
2. **Connectivity check**
   - `ping -c 4 159.65.43.12`
   - `ssh root@159.65.43.12 uptime` (expect refusal if droplet is powered off).
3. **Power/console** (from DO control panel)
   - Power on droplet, watch serial console for boot errors.
   - If kernel panic: rebuild from snapshot `codex-infinity` (latest).
4. **Post-boot hardening**
   - `apt update && apt upgrade -y`
   - Ensure fail2ban + ufw allow SSH (22) and app ports (e.g., 8080/443 if used by tunnel origin).
5. **Services to start**
   - Start any origin services expected behind the tunnel (api/core/operator/prism). If Railway handles origins, ensure reverse proxy on droplet only runs `cloudflared`.
6. **Monitoring**
   - Add a cron health ping: `*/5 * * * * curl -fsS http://localhost:8080/health || systemctl restart <service>` (replace service name as needed).

## 2) Raspberry Pi (`192.168.4.49`, aliases: alice-pi, raspberrypi)

1. **Network bring-up**
   - Physically power cycle; ensure Ethernet to `192.168.4.1` gateway.
   - From LAN: `ping -c 4 192.168.4.49`.
   - If DHCP conflict, set static IP by running `sudo nano /etc/dhcpcd.conf` to `192.168.4.49/24` with router `192.168.4.1`.
2. **SSH access**
   - `ssh alice@192.168.4.49` using `~/.ssh/id_ed25519`; fingerprint should match inventory `AAAAC3NzaC1lZDI1NTE5AAAAIOahIdbdm1bo/0o2XsqdkUujgpIMjvIHvUJ+jBmtRBXN`.
3. **Pi services**
   - Run unified setup to restore gateway + agent stack:
     - `sudo bash /workspace/blackroad-os-operator/infra/pi/blackroad-pi-unified.sh`
   - Start cloudflared (see section 3) and ensure MQTT/dashboard scripts still exist under `/opt/blackroad` or repo clone.
4. **Verification**
   - `systemctl status dnsmasq` and `sudo tail -f /var/log/dnsmasq.log` to ensure DNS sinkhole running.
   - `curl -I https://blackroad-intercept.amundsonalexa.workers.dev` from the Pi to confirm outbound connectivity.

## 3) Cloudflare Tunnel `52915859-da18-4aa6-add5-7bd9fcac2e0b`

1. **Config file** (expected on droplet or Pi at `/etc/cloudflared/config.yml`)

```yaml
tunnel: 52915859-da18-4aa6-add5-7bd9fcac2e0b
credentials-file: /root/.cloudflared/52915859-da18-4aa6-add5-7bd9fcac2e0b.json
ingress:
  - hostname: blackroad.systems
    service: https://localhost:8080
  - hostname: api.blackroad.systems
    service: https://blackroad-os-api-gateway.up.railway.app
  - hostname: core.blackroad.systems
    service: https://blackroad-os-core.up.railway.app
  - hostname: operator.blackroad.systems
    service: https://blackroad-os-operator.up.railway.app
  - hostname: prism.blackroad.systems
    service: https://blackroad-os-prism-console.up.railway.app
  - hostname: brand.blackroad.systems
    service: https://blackroad-os-brand.up.railway.app
  - hostname: docs.blackroad.systems
    service: https://blackroad-os-docs.up.railway.app
  - service: http_status:404
```

2. **Start/enable service**
   - `sudo systemctl enable cloudflared && sudo systemctl start cloudflared`
   - Check: `systemctl status cloudflared` and `journalctl -u cloudflared -n 100`
3. **Validation**
   - `cloudflared tunnel list | grep 52915859` (should show `RUNNING`).
   - `curl -I https://blackroad.systems` should return `HTTP 200/301` (no 522).
   - Use Cloudflare dashboard → Zero Trust → Tunnels to verify active connector with same UUID.
4. **Fallback**
   - If credentials missing, re-authenticate: `cloudflared login` (opens browser) then `cloudflared tunnel run 52915859-da18-4aa6-add5-7bd9fcac2e0b`.

## 4) Cutover Checklist

- [ ] Droplet responds to ping/SSH and has security updates applied.
- [ ] Raspberry Pi reachable at `192.168.4.49` with gateway services running.
- [ ] `cloudflared` service running with ingress rules above.
- [ ] `blackroad.systems` and subdomains return 200/301 (no 522).
- [ ] Document final state in `INFRA_STATUS.md` and `INFRASTRUCTURE_INVENTORY.md` after recovery.
