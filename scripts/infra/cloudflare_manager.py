#!/usr/bin/env python3
"""
Cloudflare Infrastructure Manager
Manages Workers, Pages, KV, D1, and DNS for BlackRoad.

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

ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

# Known workers to keep
PROTECTED_WORKERS = [
    "blackroad-gateway",
    "blackroad-router",
    "blackroad-status",
    "blackroad-identity",
    "blackroad-cipher",
    "blackroad-billing",
    "blackroad-sovereignty",
    "blackroad-intercept",
    "cece",
]

# Known zones
KNOWN_ZONES = [
    "blackroad.io",
    "amundsonalexa.workers.dev",
]


@dataclass
class CloudflareResource:
    name: str
    type: str  # worker, page, kv, d1, zone, dns
    status: str
    url: Optional[str] = None
    recommendation: str = "review"
    details: Dict[str, Any] = field(default_factory=dict)


async def get_cf_client() -> Optional[httpx.AsyncClient]:
    """Get authenticated Cloudflare client."""
    if not API_TOKEN:
        print("Warning: CLOUDFLARE_API_TOKEN not set")
        return None

    return httpx.AsyncClient(
        headers={
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        },
        timeout=30.0
    )


async def scan_workers() -> List[CloudflareResource]:
    """Scan Cloudflare Workers."""
    resources = []

    client = await get_cf_client()
    if not client or not ACCOUNT_ID:
        # Fall back to wrangler
        try:
            proc = subprocess.run(
                ["wrangler", "deployments", "list", "--json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            # Parse if successful
        except:
            pass
        return resources

    try:
        async with client:
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts"
            )

            if resp.status_code == 200:
                data = resp.json()
                for worker in data.get("result", []):
                    name = worker.get("id", "unknown")
                    is_protected = name in PROTECTED_WORKERS

                    # Check worker health
                    worker_url = f"https://{name}.amundsonalexa.workers.dev"
                    status = "deployed"

                    try:
                        health_resp = await client.get(f"{worker_url}/health", timeout=5.0)
                        if health_resp.status_code == 200:
                            status = "healthy"
                        else:
                            status = f"http-{health_resp.status_code}"
                    except:
                        status = "unreachable"

                    resources.append(CloudflareResource(
                        name=name,
                        type="worker",
                        status=status,
                        url=worker_url,
                        recommendation="keep" if is_protected else "review",
                        details={
                            "modified_on": worker.get("modified_on"),
                            "created_on": worker.get("created_on"),
                        }
                    ))

    except Exception as e:
        print(f"Error scanning workers: {e}")

    return resources


async def scan_pages() -> List[CloudflareResource]:
    """Scan Cloudflare Pages."""
    resources = []

    client = await get_cf_client()
    if not client or not ACCOUNT_ID:
        return resources

    try:
        async with client:
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects"
            )

            if resp.status_code == 200:
                data = resp.json()
                for page in data.get("result", []):
                    name = page.get("name", "unknown")
                    subdomain = page.get("subdomain", "")

                    resources.append(CloudflareResource(
                        name=name,
                        type="page",
                        status="deployed",
                        url=f"https://{subdomain}" if subdomain else None,
                        recommendation="review",
                        details={
                            "production_branch": page.get("production_branch"),
                            "created_on": page.get("created_on"),
                        }
                    ))

    except Exception as e:
        print(f"Error scanning pages: {e}")

    return resources


async def scan_kv_namespaces() -> List[CloudflareResource]:
    """Scan KV namespaces."""
    resources = []

    client = await get_cf_client()
    if not client or not ACCOUNT_ID:
        return resources

    try:
        async with client:
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces"
            )

            if resp.status_code == 200:
                data = resp.json()
                for kv in data.get("result", []):
                    resources.append(CloudflareResource(
                        name=kv.get("title", "unknown"),
                        type="kv",
                        status="active",
                        recommendation="review",
                        details={"id": kv.get("id")}
                    ))

    except Exception as e:
        print(f"Error scanning KV: {e}")

    return resources


async def scan_d1_databases() -> List[CloudflareResource]:
    """Scan D1 databases."""
    resources = []

    client = await get_cf_client()
    if not client or not ACCOUNT_ID:
        return resources

    try:
        async with client:
            resp = await client.get(
                f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database"
            )

            if resp.status_code == 200:
                data = resp.json()
                for db in data.get("result", []):
                    resources.append(CloudflareResource(
                        name=db.get("name", "unknown"),
                        type="d1",
                        status="active",
                        recommendation="review",
                        details={
                            "uuid": db.get("uuid"),
                            "created_at": db.get("created_at"),
                        }
                    ))

    except Exception as e:
        print(f"Error scanning D1: {e}")

    return resources


async def scan_zones() -> List[CloudflareResource]:
    """Scan DNS zones."""
    resources = []

    client = await get_cf_client()
    if not client:
        return resources

    try:
        async with client:
            resp = await client.get(
                "https://api.cloudflare.com/client/v4/zones"
            )

            if resp.status_code == 200:
                data = resp.json()
                for zone in data.get("result", []):
                    resources.append(CloudflareResource(
                        name=zone.get("name", "unknown"),
                        type="zone",
                        status=zone.get("status", "unknown"),
                        recommendation="keep" if zone.get("name") in KNOWN_ZONES else "review",
                        details={
                            "id": zone.get("id"),
                            "plan": zone.get("plan", {}).get("name"),
                        }
                    ))

    except Exception as e:
        print(f"Error scanning zones: {e}")

    return resources


def print_report(resources: List[CloudflareResource]):
    """Print resource report."""
    print("\n" + "=" * 70)
    print("CLOUDFLARE RESOURCES")
    print("=" * 70)

    # Group by type
    by_type: Dict[str, List[CloudflareResource]] = {}
    for r in resources:
        if r.type not in by_type:
            by_type[r.type] = []
        by_type[r.type].append(r)

    for rtype, items in sorted(by_type.items()):
        print(f"\n{rtype.upper()} ({len(items)}):")
        print("-" * 40)

        for r in items:
            status_emoji = {
                "healthy": "✓",
                "deployed": "●",
                "active": "●",
                "unreachable": "?",
            }.get(r.status, "○")

            rec_mark = {"keep": "K", "delete": "D", "review": "?"}[r.recommendation]
            print(f"  {status_emoji} [{rec_mark}] {r.name}")
            if r.url:
                print(f"      {r.url}")

    # Summary
    print("\n" + "=" * 70)
    print(f"Total: {len(resources)} resources")
    print(f"  Workers: {len(by_type.get('worker', []))}")
    print(f"  Pages: {len(by_type.get('page', []))}")
    print(f"  KV: {len(by_type.get('kv', []))}")
    print(f"  D1: {len(by_type.get('d1', []))}")
    print(f"  Zones: {len(by_type.get('zone', []))}")


async def main():
    print("Cloudflare Infrastructure Manager")
    print(f"Account: {ACCOUNT_ID or 'NOT SET'}")
    print()

    all_resources = []

    print("[1/5] Scanning Workers...")
    workers = await scan_workers()
    all_resources.extend(workers)
    print(f"  Found {len(workers)} workers")

    print("[2/5] Scanning Pages...")
    pages = await scan_pages()
    all_resources.extend(pages)
    print(f"  Found {len(pages)} pages")

    print("[3/5] Scanning KV Namespaces...")
    kv = await scan_kv_namespaces()
    all_resources.extend(kv)
    print(f"  Found {len(kv)} KV namespaces")

    print("[4/5] Scanning D1 Databases...")
    d1 = await scan_d1_databases()
    all_resources.extend(d1)
    print(f"  Found {len(d1)} D1 databases")

    print("[5/5] Scanning DNS Zones...")
    zones = await scan_zones()
    all_resources.extend(zones)
    print(f"  Found {len(zones)} zones")

    print_report(all_resources)

    # Save to JSON
    output_dir = Path("/Users/alexa/blackroad-os-operator/infra/scans")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "cloudflare_resources.json"
    with open(output_file, "w") as f:
        json.dump([vars(r) for r in all_resources], f, indent=2)

    print(f"\nData saved to: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
