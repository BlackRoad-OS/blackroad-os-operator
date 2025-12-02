#!/usr/bin/env python3
"""
Railway Cleanup Script
Identifies and optionally deletes failed/test Railway projects.

Owner: Alexa Louise Amundson (amundsonalexa@gmail.com)
"""

import asyncio
import json
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Optional

import httpx

# =============================================================================
# CONFIGURATION
# =============================================================================

# Projects to NEVER delete
PROTECTED_PROJECTS = [
    "blackroad-cece-operator",
    "blackroad-os-operator",  # Keep for now, may consolidate later
]

# Random name patterns that indicate failed deployments
RANDOM_NAME_PATTERNS = [
    "wonderful-", "fabulous-", "noble-", "sincere-", "gregarious-",
    "merry-", "fulfilling-", "discerning-", "steadfast-", "intuitive-",
    "impartial-", "loyal-", "innovative-", "gentle-", "alert-",
    "thriving-", "terrific-", "secure-", "NA-",
]

# Projects that might be useful (review before delete)
MAYBE_USEFUL = [
    "Operator Engine",
    "Lucidia Core",
    "Prism Console",
    "blackroad-os-core",
    "blackroad-os-api",
    "blackroad-login",
    "blackroad-os-docs",
    "lucidia-platform",
    "BlackRoad API",
    "BlackRoad Portal",
]


@dataclass
class RailwayProject:
    name: str
    org: Optional[str]
    status: str  # running, stopped, unknown
    url: Optional[str]
    health: Optional[str]
    recommendation: str  # keep, delete, review
    reason: str


async def check_project_health(project_name: str) -> tuple[str, str, str]:
    """Check if a Railway project is running and healthy."""
    # Construct likely URL
    url_slug = project_name.lower().replace(" ", "-").replace("_", "-")
    test_url = f"https://{url_slug}-production.up.railway.app"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Try health endpoint first
            resp = await client.get(f"{test_url}/health")
            if resp.status_code == 200:
                return "running", test_url, "healthy"
            elif resp.status_code == 404:
                # Try root
                resp = await client.get(test_url)
                if resp.status_code < 500:
                    return "running", test_url, "no-health-endpoint"
            return "error", test_url, f"http-{resp.status_code}"
    except httpx.TimeoutException:
        return "timeout", test_url, "timeout"
    except Exception as e:
        return "unknown", None, str(e)


def classify_project(name: str) -> tuple[str, str]:
    """Classify a project as keep/delete/review with reason."""
    name_lower = name.lower()

    # Protected - never delete
    if name in PROTECTED_PROJECTS:
        return "keep", "protected project"

    # Random names - definitely delete
    for pattern in RANDOM_NAME_PATTERNS:
        if name_lower.startswith(pattern.lower()):
            return "delete", f"random name pattern: {pattern}"

    # Maybe useful - review
    if name in MAYBE_USEFUL:
        return "review", "potentially useful project"

    # Default to review
    return "review", "unclassified project"


async def scan_railway_projects() -> List[RailwayProject]:
    """Scan all Railway projects."""
    projects = []

    try:
        proc = subprocess.run(
            ["railway", "list"],
            capture_output=True,
            text=True,
            timeout=30
        )

        if proc.returncode != 0:
            print(f"Error: railway list failed: {proc.stderr}")
            return projects

        lines = proc.stdout.strip().split("\n")
        current_org = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.endswith(", Inc.") or line.endswith(" Inc"):
                current_org = line
                continue

            project_name = line
            recommendation, reason = classify_project(project_name)

            # Check health for non-delete projects
            if recommendation != "delete":
                status, url, health = await check_project_health(project_name)
            else:
                status, url, health = "unknown", None, None

            projects.append(RailwayProject(
                name=project_name,
                org=current_org,
                status=status,
                url=url,
                health=health,
                recommendation=recommendation,
                reason=reason
            ))

    except Exception as e:
        print(f"Error scanning Railway: {e}")

    return projects


def print_projects(projects: List[RailwayProject]):
    """Print project list with recommendations."""
    print("\n" + "=" * 70)
    print("RAILWAY PROJECTS")
    print("=" * 70)

    # Group by recommendation
    keep = [p for p in projects if p.recommendation == "keep"]
    delete = [p for p in projects if p.recommendation == "delete"]
    review = [p for p in projects if p.recommendation == "review"]

    if keep:
        print("\n✓ KEEP (protected):")
        print("-" * 40)
        for p in keep:
            status = f"[{p.status}]" if p.status else ""
            print(f"  {p.name} {status}")
            if p.url:
                print(f"    URL: {p.url}")

    if delete:
        print("\n✗ DELETE (random/test projects):")
        print("-" * 40)
        for p in delete:
            print(f"  {p.name}")
            print(f"    Reason: {p.reason}")

    if review:
        print("\n? REVIEW (decide manually):")
        print("-" * 40)
        for p in review:
            status = f"[{p.status}]" if p.status else "[?]"
            health = f" - {p.health}" if p.health else ""
            print(f"  {status} {p.name}{health}")
            if p.url:
                print(f"    URL: {p.url}")

    print("\n" + "=" * 70)
    print(f"Summary: {len(keep)} keep, {len(delete)} delete, {len(review)} review")
    print("=" * 70)


def generate_delete_script(projects: List[RailwayProject]) -> str:
    """Generate a shell script to delete projects."""
    to_delete = [p for p in projects if p.recommendation == "delete"]

    if not to_delete:
        return "# No projects to delete"

    lines = [
        "#!/bin/bash",
        "# Railway Cleanup Script",
        "# Generated by railway_cleanup.py",
        f"# {len(to_delete)} projects marked for deletion",
        "",
        "set -e",
        "",
        "echo 'Railway Project Cleanup'",
        "echo '========================'",
        "",
        "# WARNING: This will delete the following projects:",
    ]

    for p in to_delete:
        lines.append(f"#   - {p.name}")

    lines.extend([
        "",
        "read -p 'Are you sure you want to delete these projects? (yes/no): ' confirm",
        "if [ \"$confirm\" != \"yes\" ]; then",
        "    echo 'Aborted.'",
        "    exit 1",
        "fi",
        "",
    ])

    for p in to_delete:
        # Railway CLI doesn't have direct delete, need to use dashboard or API
        # But we can generate the commands that would work
        lines.extend([
            f"echo 'Deleting: {p.name}'",
            f"# railway delete --project \"{p.name}\" --yes  # Not supported by CLI",
            f"# Use Railway Dashboard: https://railway.app/project/XXX/settings",
            "",
        ])

    lines.extend([
        "echo ''",
        "echo 'NOTE: Railway CLI does not support project deletion.'",
        "echo 'Please delete manually via Railway Dashboard.'",
        "echo ''",
        "echo 'Projects to delete:'",
    ])

    for p in to_delete:
        lines.append(f"echo '  - {p.name}'")

    lines.extend([
        "",
        "echo ''",
        "echo 'Go to: https://railway.app/dashboard'",
    ])

    return "\n".join(lines)


async def main():
    print("Railway Cleanup Tool")
    print(f"Scanning projects...")

    projects = await scan_railway_projects()
    print_projects(projects)

    # Generate delete script
    to_delete = [p for p in projects if p.recommendation == "delete"]

    if to_delete:
        script = generate_delete_script(projects)
        script_path = "/Users/alexa/blackroad-os-operator/scripts/infra/railway_delete.sh"

        with open(script_path, "w") as f:
            f.write(script)

        print(f"\nDelete script saved to: {script_path}")
        print("\nTo delete projects, you'll need to use the Railway Dashboard:")
        print("  https://railway.app/dashboard")
        print("\nProjects to delete:")
        for p in to_delete:
            print(f"  - {p.name}")

    # Also output JSON for programmatic use
    json_path = "/Users/alexa/blackroad-os-operator/infra/scans/railway_projects.json"
    import os
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w") as f:
        json.dump([vars(p) for p in projects], f, indent=2)

    print(f"\nProject data saved to: {json_path}")


if __name__ == "__main__":
    asyncio.run(main())
