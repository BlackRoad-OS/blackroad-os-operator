# BlackRoad SSH Infrastructure - VERIFIED 2025-12-26

## All Working SSH Connections

### Raspberry Pi Mesh (Local Network)
```bash
ssh alice@alice        # 192.168.4.49 - alice user
ssh lucidia@lucidia    # 192.168.4.38 - lucidia user (Tailscale: 100.66.235.47)
ssh aria64             # 192.168.4.64 - pi user
ssh pi@192.168.4.74    # 192.168.4.74 - octavia (Pironman case)
```

### DigitalOcean Droplet
```bash
ssh shellfish          # 174.138.44.45 - root user
```

## Node Details

| Hostname | IP Address | User | Additional IPs | Notes |
|----------|-----------|------|----------------|-------|
| alice | 192.168.4.49 | alice | 172.17.0.1, 10.42.1.0, 169.254.91.111 | Kubernetes master |
| lucidia | 192.168.4.38 | lucidia | 100.66.235.47 (Tailscale), 172.17.0.1, 172.19.0.1, 172.18.0.1 | Docker networks |
| aria | 192.168.4.64 | pi | 172.18.0.1, 172.17.0.1 | BlackRoad Node with custom prompt |
| octavia | 192.168.4.74 | pi | - | Pironman case, Debian 6.12.47 |
| shellfish | 174.138.44.45 | root | 10.10.0.5, 10.116.0.2, 172.17.0.1, 172.18.0.1 | DigitalOcean droplet |

## SSH Config Summary

All connections configured in `~/.ssh/config` with proper identity files:
- alice: `id_do_ed25519`
- lucidia: `id_do_ed25519`
- aria64: `br_mesh_ed25519`
- octavia: `id_octavia`
- shellfish: `id_do_ed25519`

## Network Topology

```
Internet
  │
  ├─ shellfish (DigitalOcean: 174.138.44.45)
  │
Local Network (192.168.4.0/22)
  │
  ├─ alice (192.168.4.49) - Kubernetes master
  ├─ lucidia (192.168.4.38) - Tailscale node
  ├─ aria (192.168.4.64) - BlackRoad node
  └─ octavia (192.168.4.74) - Pironman Pi
```

## Verification Commands

Test all connections:
```bash
for host in "alice@alice" "lucidia@lucidia" "aria64" "pi@192.168.4.74" "shellfish"; do
  echo "=== Testing $host ==="
  ssh $host 'hostname && whoami && hostname -I'
done
```

Last verified: 2025-12-26 15:36 CST
