#!/usr/bin/env python3
"""
GitHub Organization and Repository Scanner
Scans all orgs/repos for amundsonalexa@gmail.com

Owner: Alexa Louise Amundson (amundsonalexa@gmail.com)
"""

import asyncio
import json
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

# Known important orgs
KNOWN_ORGS = [
    "BlackRoad-OS",
    "blackboxprogramming",
]

# Repos that should definitely exist
CRITICAL_REPOS = [
    "BlackRoad-OS/blackroad-os-operator",
    "BlackRoad-OS/blackroad-os-agents",
]


@dataclass
class GitHubEntity:
    name: str
    type: str  # org, repo
    status: str  # active, archived, empty
    url: str
    visibility: str = "public"
    last_updated: Optional[str] = None
    recommendation: str = "review"
    details: Dict[str, Any] = field(default_factory=dict)


async def scan_with_cli() -> tuple[List[GitHubEntity], List[GitHubEntity]]:
    """Scan using gh CLI."""
    orgs = []
    repos = []

    # Get orgs
    try:
        proc = subprocess.run(
            ["gh", "org", "list"],
            capture_output=True,
            text=True,
            timeout=30
        )

        if proc.returncode == 0:
            for line in proc.stdout.strip().split("\n"):
                if line:
                    orgs.append(GitHubEntity(
                        name=line,
                        type="org",
                        status="active",
                        url=f"https://github.com/{line}",
                        recommendation="keep" if line in KNOWN_ORGS else "review"
                    ))
    except Exception as e:
        print(f"  Error listing orgs: {e}")

    # Get repos
    try:
        proc = subprocess.run(
            ["gh", "repo", "list", "--limit", "200", "--json",
             "name,owner,visibility,updatedAt,isArchived,isEmpty,description"],
            capture_output=True,
            text=True,
            timeout=60
        )

        if proc.returncode == 0:
            data = json.loads(proc.stdout)
            for repo in data:
                full_name = f"{repo['owner']['login']}/{repo['name']}"

                if repo.get("isArchived"):
                    status = "archived"
                elif repo.get("isEmpty"):
                    status = "empty"
                else:
                    status = "active"

                is_critical = full_name in CRITICAL_REPOS

                repos.append(GitHubEntity(
                    name=full_name,
                    type="repo",
                    status=status,
                    url=f"https://github.com/{full_name}",
                    visibility=repo.get("visibility", "public"),
                    last_updated=repo.get("updatedAt"),
                    recommendation="keep" if is_critical else "review",
                    details={
                        "description": repo.get("description"),
                        "isEmpty": repo.get("isEmpty"),
                    }
                ))
    except Exception as e:
        print(f"  Error listing repos: {e}")

    # Also get repos from each org
    for org in orgs:
        try:
            proc = subprocess.run(
                ["gh", "repo", "list", org.name, "--limit", "100", "--json",
                 "name,visibility,updatedAt,isArchived,isEmpty"],
                capture_output=True,
                text=True,
                timeout=60
            )

            if proc.returncode == 0:
                data = json.loads(proc.stdout)
                for repo in data:
                    full_name = f"{org.name}/{repo['name']}"

                    # Skip if already added
                    if any(r.name == full_name for r in repos):
                        continue

                    if repo.get("isArchived"):
                        status = "archived"
                    elif repo.get("isEmpty"):
                        status = "empty"
                    else:
                        status = "active"

                    is_critical = full_name in CRITICAL_REPOS

                    repos.append(GitHubEntity(
                        name=full_name,
                        type="repo",
                        status=status,
                        url=f"https://github.com/{full_name}",
                        visibility=repo.get("visibility", "public"),
                        last_updated=repo.get("updatedAt"),
                        recommendation="keep" if is_critical else "review",
                        details={"org": org.name}
                    ))
        except Exception as e:
            print(f"  Error listing repos for {org.name}: {e}")

    return orgs, repos


def print_report(orgs: List[GitHubEntity], repos: List[GitHubEntity]):
    """Print scan report."""
    print("\n" + "=" * 70)
    print("GITHUB RESOURCES")
    print("=" * 70)

    # Orgs
    print(f"\nORGANIZATIONS ({len(orgs)}):")
    print("-" * 40)
    for org in orgs:
        mark = "✓" if org.recommendation == "keep" else "?"
        print(f"  {mark} {org.name}")
        print(f"      {org.url}")

    # Group repos by org
    repos_by_org: Dict[str, List[GitHubEntity]] = {"personal": []}
    for repo in repos:
        org = repo.details.get("org") or repo.name.split("/")[0]
        if org not in repos_by_org:
            repos_by_org[org] = []
        repos_by_org[org].append(repo)

    print(f"\nREPOSITORIES ({len(repos)}):")
    print("-" * 40)

    for org_name, org_repos in sorted(repos_by_org.items()):
        print(f"\n  [{org_name}] ({len(org_repos)} repos)")

        # Sort by status and name
        org_repos.sort(key=lambda r: (r.status != "active", r.name))

        for repo in org_repos[:15]:  # Show first 15 per org
            status_emoji = {
                "active": "●",
                "archived": "○",
                "empty": "◌",
            }.get(repo.status, "?")

            vis = "🔒" if repo.visibility == "private" else ""
            print(f"    {status_emoji} {repo.name.split('/')[-1]} {vis}")

        if len(org_repos) > 15:
            print(f"    ... and {len(org_repos) - 15} more")

    # Summary stats
    active = len([r for r in repos if r.status == "active"])
    archived = len([r for r in repos if r.status == "archived"])
    empty = len([r for r in repos if r.status == "empty"])
    private = len([r for r in repos if r.visibility == "private"])

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Organizations: {len(orgs)}")
    print(f"  Repositories:  {len(repos)}")
    print(f"    - Active:    {active}")
    print(f"    - Archived:  {archived}")
    print(f"    - Empty:     {empty}")
    print(f"    - Private:   {private}")


def find_cleanup_candidates(repos: List[GitHubEntity]) -> List[GitHubEntity]:
    """Find repos that might be good candidates for cleanup."""
    candidates = []

    for repo in repos:
        # Empty repos
        if repo.status == "empty":
            repo.recommendation = "delete"
            candidates.append(repo)
            continue

        # Very old with no recent activity
        if repo.last_updated:
            try:
                updated = datetime.fromisoformat(repo.last_updated.replace("Z", "+00:00"))
                age_days = (datetime.now(updated.tzinfo) - updated).days

                if age_days > 365 and repo.status != "active":
                    repo.recommendation = "review"
                    repo.details["stale_days"] = age_days
                    candidates.append(repo)
            except:
                pass

    return candidates


async def main():
    print("GitHub Scanner")
    print(f"Scanning for: amundsonalexa@gmail.com")
    print()

    print("Scanning organizations and repositories...")
    orgs, repos = await scan_with_cli()

    print_report(orgs, repos)

    # Find cleanup candidates
    candidates = find_cleanup_candidates(repos)
    if candidates:
        print("\n" + "-" * 40)
        print("CLEANUP CANDIDATES:")
        print("-" * 40)

        empty = [c for c in candidates if c.status == "empty"]
        stale = [c for c in candidates if c.details.get("stale_days")]

        if empty:
            print(f"\nEmpty repositories ({len(empty)}):")
            for repo in empty:
                print(f"  ◌ {repo.name}")

        if stale:
            print(f"\nStale repositories ({len(stale)}):")
            for repo in stale:
                days = repo.details.get("stale_days", 0)
                print(f"  ○ {repo.name} ({days} days)")

    # Save to JSON
    output_dir = Path("/Users/alexa/blackroad-os-operator/infra/scans")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "github_resources.json"
    with open(output_file, "w") as f:
        json.dump({
            "orgs": [vars(o) for o in orgs],
            "repos": [vars(r) for r in repos],
            "cleanup_candidates": [vars(c) for c in candidates],
        }, f, indent=2)

    print(f"\nData saved to: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
