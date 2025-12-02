#!/usr/bin/env python3
"""
BlackRoad Infrastructure Scanner
Scans all endpoints and services across:
- Railway projects
- Cloudflare Workers/Pages/DNS
- GitHub orgs/repos
- DigitalOcean droplets

Owner: Alexa Louise Amundson (amundsonalexa@gmail.com)
"""

import asyncio
import json
import os
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

# =============================================================================
# CONFIGURATION
# =============================================================================

OWNER_EMAIL = "amundsonalexa@gmail.com"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "infra" / "scans"

# Known good endpoints to keep
KNOWN_GOOD = {
    "railway": [
        "blackroad-cece-operator",
    ],
    "cloudflare_workers": [
        "blackroad-gateway",
        "blackroad-router",
        "blackroad-status",
        "cece",
    ],
}

# Random names that indicate failed/test deployments
RANDOM_NAME_PATTERNS = [
    "wonderful-", "fabulous-", "noble-", "sincere-", "gregarious-",
    "merry-", "fulfilling-", "discerning-", "steadfast-", "intuitive-",
    "impartial-", "loyal-", "innovative-", "gentle-", "alert-",
    "thriving-", "terrific-", "secure-", "NA-",
]


@dataclass
class ServiceStatus:
    name: str
    platform: str
    status: str  # running, stopped, failed, unknown
    url: Optional[str] = None
    last_deploy: Optional[str] = None
    health_check: Optional[str] = None
    recommendation: str = "review"  # keep, delete, review
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ScanResult:
    timestamp: str
    owner: str
    railway: List[ServiceStatus] = field(default_factory=list)
    cloudflare: List[ServiceStatus] = field(default_factory=list)
    github: List[ServiceStatus] = field(default_factory=list)
    digitalocean: List[ServiceStatus] = field(default_factory=list)
    summary: Dict[str, Any] = field(default_factory=dict)


# =============================================================================
# RAILWAY SCANNER
# =============================================================================

async def scan_railway() -> List[ServiceStatus]:
    """Scan Railway projects using CLI."""
    results = []

    try:
        # Get project list
        proc = subprocess.run(
            ["railway", "list"],
            capture_output=True,
            text=True,
            timeout=30
        )

        if proc.returncode != 0:
            print(f"  Warning: railway list failed: {proc.stderr}")
            return results

        # Parse output
        lines = proc.stdout.strip().split("\n")
        current_org = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if it's an org header
            if line.endswith(", Inc.") or line.endswith(" Inc"):
                current_org = line
                continue

            project_name = line

            # Determine recommendation
            is_random = any(project_name.lower().startswith(p.lower()) for p in RANDOM_NAME_PATTERNS)
            is_known_good = project_name in KNOWN_GOOD.get("railway", [])

            if is_known_good:
                recommendation = "keep"
            elif is_random:
                recommendation = "delete"
            else:
                recommendation = "review"

            # Try to check if it's running
            status = "unknown"
            url = None
            health = None

            # Construct likely URL
            url_slug = project_name.lower().replace(" ", "-").replace("_", "-")
            test_url = f"https://{url_slug}-production.up.railway.app/health"

            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(test_url)
                    if resp.status_code == 200:
                        status = "running"
                        url = test_url.replace("/health", "")
                        health = "healthy"
                    elif resp.status_code == 404:
                        status = "running"
                        url = test_url.replace("/health", "")
                        health = "no-health-endpoint"
                    else:
                        status = "error"
                        health = f"http-{resp.status_code}"
            except:
                pass

            results.append(ServiceStatus(
                name=project_name,
                platform="railway",
                status=status,
                url=url,
                health_check=health,
                recommendation=recommendation,
                details={"org": current_org}
            ))

    except Exception as e:
        print(f"  Error scanning Railway: {e}")

    return results


# =============================================================================
# CLOUDFLARE SCANNER
# =============================================================================

async def scan_cloudflare() -> List[ServiceStatus]:
    """Scan Cloudflare Workers and Pages."""
    results = []

    cf_token = os.getenv("CLOUDFLARE_API_TOKEN")
    cf_account = os.getenv("CLOUDFLARE_ACCOUNT_ID")

    if not cf_token or not cf_account:
        print("  Warning: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set")
        # Try wrangler instead
        try:
            proc = subprocess.run(
                ["wrangler", "deployments", "list"],
                capture_output=True,
                text=True,
                timeout=30
            )
            # Parse wrangler output if available
        except:
            pass
        return results

    headers = {
        "Authorization": f"Bearer {cf_token}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get Workers
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/workers/scripts",
                headers=headers
            )

            if resp.status_code == 200:
                data = resp.json()
                for worker in data.get("result", []):
                    name = worker.get("id", "unknown")
                    is_known = name in KNOWN_GOOD.get("cloudflare_workers", [])

                    # Check if worker is accessible
                    worker_url = f"https://{name}.amundsonalexa.workers.dev"
                    health = None
                    status = "deployed"

                    try:
                        health_resp = await client.get(f"{worker_url}/health", timeout=5.0)
                        if health_resp.status_code == 200:
                            health = "healthy"
                        else:
                            health = f"http-{health_resp.status_code}"
                    except:
                        health = "unreachable"

                    results.append(ServiceStatus(
                        name=name,
                        platform="cloudflare-worker",
                        status=status,
                        url=worker_url,
                        health_check=health,
                        recommendation="keep" if is_known else "review",
                        details=worker
                    ))

            # Get Pages projects
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/pages/projects",
                headers=headers
            )

            if resp.status_code == 200:
                data = resp.json()
                for page in data.get("result", []):
                    name = page.get("name", "unknown")
                    subdomain = page.get("subdomain", "")

                    results.append(ServiceStatus(
                        name=name,
                        platform="cloudflare-pages",
                        status="deployed",
                        url=f"https://{subdomain}" if subdomain else None,
                        recommendation="review",
                        details=page
                    ))

    except Exception as e:
        print(f"  Error scanning Cloudflare: {e}")

    return results


# =============================================================================
# GITHUB SCANNER
# =============================================================================

async def scan_github() -> List[ServiceStatus]:
    """Scan GitHub orgs and repos."""
    results = []

    gh_token = os.getenv("GITHUB_TOKEN")

    if not gh_token:
        print("  Warning: GITHUB_TOKEN not set, using gh CLI")
        try:
            # Use gh CLI to list orgs
            proc = subprocess.run(
                ["gh", "org", "list"],
                capture_output=True,
                text=True,
                timeout=30
            )

            if proc.returncode == 0:
                orgs = proc.stdout.strip().split("\n")
                for org in orgs:
                    if org:
                        results.append(ServiceStatus(
                            name=org,
                            platform="github-org",
                            status="active",
                            url=f"https://github.com/{org}",
                            recommendation="review"
                        ))

            # List repos for user
            proc = subprocess.run(
                ["gh", "repo", "list", "--limit", "100", "--json", "name,owner,updatedAt,isArchived"],
                capture_output=True,
                text=True,
                timeout=60
            )

            if proc.returncode == 0:
                repos = json.loads(proc.stdout)
                for repo in repos:
                    status = "archived" if repo.get("isArchived") else "active"
                    results.append(ServiceStatus(
                        name=f"{repo['owner']['login']}/{repo['name']}",
                        platform="github-repo",
                        status=status,
                        url=f"https://github.com/{repo['owner']['login']}/{repo['name']}",
                        last_deploy=repo.get("updatedAt"),
                        recommendation="review",
                        details=repo
                    ))
        except Exception as e:
            print(f"  Error with gh CLI: {e}")

        return results

    # Use API directly
    headers = {
        "Authorization": f"token {gh_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get user's orgs
            resp = await client.get(
                "https://api.github.com/user/orgs",
                headers=headers
            )

            if resp.status_code == 200:
                for org in resp.json():
                    results.append(ServiceStatus(
                        name=org["login"],
                        platform="github-org",
                        status="active",
                        url=org["html_url"],
                        recommendation="review",
                        details=org
                    ))

            # Get user's repos
            resp = await client.get(
                "https://api.github.com/user/repos?per_page=100",
                headers=headers
            )

            if resp.status_code == 200:
                for repo in resp.json():
                    status = "archived" if repo.get("archived") else "active"
                    results.append(ServiceStatus(
                        name=repo["full_name"],
                        platform="github-repo",
                        status=status,
                        url=repo["html_url"],
                        last_deploy=repo.get("updated_at"),
                        recommendation="review",
                        details={"id": repo["id"], "private": repo["private"]}
                    ))

    except Exception as e:
        print(f"  Error scanning GitHub: {e}")

    return results


# =============================================================================
# DIGITALOCEAN SCANNER
# =============================================================================

async def scan_digitalocean() -> List[ServiceStatus]:
    """Scan DigitalOcean droplets and apps."""
    results = []

    do_token = os.getenv("DIGITALOCEAN_ACCESS_TOKEN")

    if not do_token:
        print("  Warning: DIGITALOCEAN_ACCESS_TOKEN not set")
        return results

    headers = {
        "Authorization": f"Bearer {do_token}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get droplets
            resp = await client.get(
                "https://api.digitalocean.com/v2/droplets",
                headers=headers
            )

            if resp.status_code == 200:
                data = resp.json()
                for droplet in data.get("droplets", []):
                    ip = None
                    for net in droplet.get("networks", {}).get("v4", []):
                        if net.get("type") == "public":
                            ip = net.get("ip_address")
                            break

                    results.append(ServiceStatus(
                        name=droplet["name"],
                        platform="digitalocean-droplet",
                        status=droplet["status"],
                        url=f"http://{ip}" if ip else None,
                        recommendation="review",
                        details={
                            "id": droplet["id"],
                            "region": droplet["region"]["slug"],
                            "size": droplet["size_slug"],
                            "ip": ip
                        }
                    ))

            # Get Apps
            resp = await client.get(
                "https://api.digitalocean.com/v2/apps",
                headers=headers
            )

            if resp.status_code == 200:
                data = resp.json()
                for app in data.get("apps", []):
                    results.append(ServiceStatus(
                        name=app.get("spec", {}).get("name", "unknown"),
                        platform="digitalocean-app",
                        status=app.get("phase", "unknown"),
                        url=app.get("live_url"),
                        recommendation="review",
                        details=app
                    ))

    except Exception as e:
        print(f"  Error scanning DigitalOcean: {e}")

    return results


# =============================================================================
# MAIN SCANNER
# =============================================================================

async def run_full_scan() -> ScanResult:
    """Run full infrastructure scan."""
    print("=" * 60)
    print("BlackRoad Infrastructure Scanner")
    print(f"Owner: {OWNER_EMAIL}")
    print(f"Time: {datetime.utcnow().isoformat()}Z")
    print("=" * 60)

    result = ScanResult(
        timestamp=datetime.utcnow().isoformat() + "Z",
        owner=OWNER_EMAIL
    )

    # Scan all platforms
    print("\n[1/4] Scanning Railway...")
    result.railway = await scan_railway()
    print(f"  Found {len(result.railway)} projects")

    print("\n[2/4] Scanning Cloudflare...")
    result.cloudflare = await scan_cloudflare()
    print(f"  Found {len(result.cloudflare)} services")

    print("\n[3/4] Scanning GitHub...")
    result.github = await scan_github()
    print(f"  Found {len(result.github)} repos/orgs")

    print("\n[4/4] Scanning DigitalOcean...")
    result.digitalocean = await scan_digitalocean()
    print(f"  Found {len(result.digitalocean)} resources")

    # Generate summary
    all_services = result.railway + result.cloudflare + result.github + result.digitalocean

    result.summary = {
        "total": len(all_services),
        "by_platform": {},
        "by_recommendation": {"keep": 0, "delete": 0, "review": 0},
        "by_status": {},
    }

    for svc in all_services:
        # By platform
        result.summary["by_platform"][svc.platform] = \
            result.summary["by_platform"].get(svc.platform, 0) + 1

        # By recommendation
        result.summary["by_recommendation"][svc.recommendation] = \
            result.summary["by_recommendation"].get(svc.recommendation, 0) + 1

        # By status
        result.summary["by_status"][svc.status] = \
            result.summary["by_status"].get(svc.status, 0) + 1

    return result


def print_report(result: ScanResult):
    """Print scan report."""
    print("\n" + "=" * 60)
    print("SCAN REPORT")
    print("=" * 60)

    print(f"\nTotal services: {result.summary['total']}")

    print("\nBy Platform:")
    for platform, count in sorted(result.summary["by_platform"].items()):
        print(f"  {platform}: {count}")

    print("\nBy Recommendation:")
    for rec, count in result.summary["by_recommendation"].items():
        emoji = {"keep": "✓", "delete": "✗", "review": "?"}[rec]
        print(f"  {emoji} {rec}: {count}")

    # Show items to delete
    to_delete = [s for s in result.railway + result.cloudflare + result.digitalocean
                 if s.recommendation == "delete"]

    if to_delete:
        print("\n" + "-" * 40)
        print("RECOMMENDED FOR DELETION:")
        print("-" * 40)
        for svc in to_delete:
            print(f"  [{svc.platform}] {svc.name}")

    # Show items to review
    to_review = [s for s in result.railway + result.cloudflare + result.digitalocean
                 if s.recommendation == "review"]

    if to_review:
        print("\n" + "-" * 40)
        print("NEEDS REVIEW:")
        print("-" * 40)
        for svc in to_review[:20]:  # Show first 20
            status_emoji = {"running": "●", "stopped": "○", "failed": "✗"}.get(svc.status, "?")
            print(f"  {status_emoji} [{svc.platform}] {svc.name}")
        if len(to_review) > 20:
            print(f"  ... and {len(to_review) - 20} more")


def save_report(result: ScanResult):
    """Save scan report to file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"scan_{timestamp}.json"

    # Convert to dict for JSON
    data = {
        "timestamp": result.timestamp,
        "owner": result.owner,
        "summary": result.summary,
        "railway": [vars(s) for s in result.railway],
        "cloudflare": [vars(s) for s in result.cloudflare],
        "github": [vars(s) for s in result.github],
        "digitalocean": [vars(s) for s in result.digitalocean],
    }

    with open(output_file, "w") as f:
        json.dump(data, f, indent=2, default=str)

    print(f"\nReport saved to: {output_file}")
    return output_file


async def main():
    result = await run_full_scan()
    print_report(result)
    save_report(result)

    # Return exit code based on items needing attention
    to_delete = sum(1 for s in result.railway + result.cloudflare + result.digitalocean
                    if s.recommendation == "delete")
    return 1 if to_delete > 0 else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
