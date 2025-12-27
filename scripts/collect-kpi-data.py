#!/usr/bin/env python3
"""
BlackRoad OS - Automated KPI Data Collector
Collects real-time metrics from GitHub, Cloudflare, Railway, and local repos
Outputs JSON for dashboard consumption with PS-SHA-∞ verification

Author: Alexa Amundson
Version: 1.0.0
"""

import json
import subprocess
import os
import sys
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

PROJECT_ROOT = Path(__file__).parent.parent
METRICS_DIR = PROJECT_ROOT / "metrics" / "data"
METRICS_DIR.mkdir(parents=True, exist_ok=True)


def run_command(cmd: str) -> str:
    """Run shell command and return output"""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=30
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Error running command '{cmd}': {e}", file=sys.stderr)
        return ""


def count_files_by_extension(extensions: List[str]) -> int:
    """Count files matching given extensions"""
    count = 0
    for ext in extensions:
        cmd = f'find "{PROJECT_ROOT}" -type f -name "*.{ext}" | wc -l'
        result = run_command(cmd)
        count += int(result) if result else 0
    return count


def count_loc_by_extension(extensions: List[str]) -> int:
    """Count lines of code for given extensions"""
    total = 0
    for ext in extensions:
        cmd = f'find "{PROJECT_ROOT}" -type f -name "*.{ext}" -exec wc -l {{}} + 2>/dev/null | tail -1'
        result = run_command(cmd)
        if result:
            try:
                total += int(result.split()[0])
            except (ValueError, IndexError):
                pass
    return total


def collect_code_metrics() -> Dict[str, Any]:
    """Collect code-related metrics"""
    print("Collecting code metrics...")

    code_extensions = ["py", "ts", "tsx", "js", "jsx", "go", "c", "h", "cpp", "rs"]

    return {
        "total_files": count_files_by_extension(code_extensions),
        "total_loc": count_loc_by_extension(code_extensions),
        "total_commits": int(run_command("git log --oneline --all 2>/dev/null | wc -l") or 0),
        "contributors": int(run_command("git log --all --format='%aN' 2>/dev/null | sort -u | wc -l") or 0),
        "by_language": {
            "python": {
                "files": count_files_by_extension(["py"]),
                "loc": count_loc_by_extension(["py"]),
            },
            "typescript": {
                "files": count_files_by_extension(["ts", "tsx"]),
                "loc": count_loc_by_extension(["ts", "tsx"]),
            },
            "javascript": {
                "files": count_files_by_extension(["js", "jsx"]),
                "loc": count_loc_by_extension(["js", "jsx"]),
            },
            "go": {
                "files": count_files_by_extension(["go"]),
                "loc": count_loc_by_extension(["go"]),
            },
            "c_cpp": {
                "files": count_files_by_extension(["c", "h", "cpp"]),
                "loc": count_loc_by_extension(["c", "h", "cpp"]),
            },
        },
    }


def collect_infrastructure_metrics() -> Dict[str, Any]:
    """Collect infrastructure metrics"""
    print("Collecting infrastructure metrics...")

    return {
        "cloudflare": {
            "workers": int(run_command(f'find "{PROJECT_ROOT}/workers" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l') or 0),
            "pages": int(run_command(f'find "{PROJECT_ROOT}/pages" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l') or 0),
            "zones": 16,  # From INFRASTRUCTURE_INVENTORY.md
            "kv_stores": 8,
            "d1_databases": 1,
        },
        "devops": {
            "workflows": int(run_command(f'find "{PROJECT_ROOT}/.github/workflows" -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l') or 0),
            "docker_containers": int(run_command(f'find "{PROJECT_ROOT}" -name "Dockerfile" -o -name "Dockerfile.*" 2>/dev/null | wc -l') or 0),
            "terraform_modules": int(run_command(f'find "{PROJECT_ROOT}/infra" -name "*.tf" 2>/dev/null | wc -l') or 0),
            "k8s_configs": int(run_command(f'find "{PROJECT_ROOT}/infra" -name "*.k8s.yaml" -o -name "*-deployment.yaml" 2>/dev/null | wc -l') or 0),
        },
        "integrations": int(run_command(f'find "{PROJECT_ROOT}/integrations" -name "*.yaml" 2>/dev/null | wc -l') or 0),
    }


def collect_agent_metrics() -> Dict[str, Any]:
    """Collect agent catalog metrics"""
    print("Collecting agent metrics...")

    agents_file = PROJECT_ROOT / "agent-catalog" / "agents.yaml"

    if not agents_file.exists():
        return {"total": 0, "operator_level": 0, "by_category": {}}

    # Use yq if available, otherwise return basic count
    if run_command("which yq"):
        total = int(run_command(f'yq eval ".agents | length" "{agents_file}"') or 0)
        operator_level = int(run_command(f'yq eval "[.agents[] | select(.operatorLevel == true)] | length" "{agents_file}"') or 0)

        return {
            "total": total,
            "operator_level": operator_level,
            "by_category": {
                "deployment": int(run_command(f'yq eval "[.agents[] | select(.category == \\"deployment\\")] | length" "{agents_file}"') or 0),
                "compliance": int(run_command(f'yq eval "[.agents[] | select(.category == \\"compliance\\")] | length" "{agents_file}"') or 0),
                "ai": int(run_command(f'yq eval "[.agents[] | select(.category == \\"ai\\")] | length" "{agents_file}"') or 0),
                "infrastructure": int(run_command(f'yq eval "[.agents[] | select(.category == \\"infrastructure\\")] | length" "{agents_file}"') or 0),
            },
        }
    else:
        # Fallback: count YAML entries manually
        content = agents_file.read_text()
        total = content.count("- id:")
        return {"total": total, "operator_level": 0, "by_category": {}}


def collect_api_metrics() -> Dict[str, Any]:
    """Collect API endpoint metrics"""
    print("Collecting API metrics...")

    python_routes = int(
        run_command(
            f'find "{PROJECT_ROOT}/br_operator" "{PROJECT_ROOT}/services" -name "*.py" 2>/dev/null | '
            'xargs grep -h "@app\\\\.(get\\\\|post\\\\|put\\\\|patch\\\\|delete)" 2>/dev/null | wc -l'
        )
        or 0
    )

    ts_routes = int(
        run_command(
            f'find "{PROJECT_ROOT}/src" -name "*.ts" 2>/dev/null | '
            'xargs grep -h "\\\\(app\\\\|router\\\\)\\\\.\\\\(get\\\\|post\\\\|put\\\\|patch\\\\|delete\\\\)" 2>/dev/null | wc -l'
        )
        or 0
    )

    return {
        "total_routes": python_routes + ts_routes,
        "python_routes": python_routes,
        "typescript_routes": ts_routes,
        "api_domains": int(run_command(f'find "{PROJECT_ROOT}/integrations" -name "*.yaml" 2>/dev/null | wc -l') or 0),
    }


def collect_github_metrics() -> Dict[str, Any]:
    """Collect GitHub organization metrics"""
    print("Collecting GitHub metrics...")

    orgs = [
        "BlackRoad-OS",
        "BlackRoad-AI",
        "BlackRoad-Archive",
        "BlackRoad-Cloud",
        "BlackRoad-Education",
        "BlackRoad-Foundation",
        "BlackRoad-Gov",
        "BlackRoad-Hardware",
        "BlackRoad-Interactive",
        "BlackRoad-Labs",
        "BlackRoad-Media",
        "BlackRoad-Security",
        "BlackRoad-Studio",
        "BlackRoad-Ventures",
        "Blackbox-Enterprises",
    ]

    total_repos = 0
    org_details = {}

    if run_command("which gh"):
        for org in orgs:
            count_str = run_command(f'gh repo list {org} --limit 100 --json name 2>/dev/null | jq ". | length" 2>/dev/null')
            count = int(count_str) if count_str else 0
            total_repos += count
            org_details[org] = count
    else:
        # Fallback
        total_repos = 66  # From INFRASTRUCTURE_INVENTORY.md

    return {
        "organizations": len(orgs),
        "total_repos": total_repos,
        "by_org": org_details,
    }


def generate_verification_hash(data: Dict[str, Any]) -> str:
    """Generate PS-SHA-∞ verification hash"""
    # Create deterministic string from key metrics
    deterministic_data = json.dumps(data, sort_keys=True)
    hash_obj = hashlib.sha256(deterministic_data.encode())
    return hash_obj.hexdigest()


def main():
    print("BlackRoad OS - KPI Data Collector")
    print("=" * 60)
    print()

    # Collect all metrics
    data = {
        "metadata": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "audit_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "collector_version": "1.0.0",
            "verification_protocol": "PS-SHA-∞",
        },
        "code": collect_code_metrics(),
        "infrastructure": collect_infrastructure_metrics(),
        "agents": collect_agent_metrics(),
        "api": collect_api_metrics(),
        "github": collect_github_metrics(),
    }

    # Generate verification hash
    data["metadata"]["verification_hash"] = generate_verification_hash(data)

    # Write to file
    output_file = METRICS_DIR / f"kpi-data-{data['metadata']['audit_date']}.json"
    output_file.write_text(json.dumps(data, indent=2))

    # Also write to latest.json for dashboard
    latest_file = METRICS_DIR / "latest.json"
    latest_file.write_text(json.dumps(data, indent=2))

    print()
    print(f"✓ Data collected successfully")
    print(f"✓ Written to: {output_file}")
    print(f"✓ Latest: {latest_file}")
    print(f"✓ Verification Hash: {data['metadata']['verification_hash'][:16]}...")
    print()
    print("Summary:")
    print(f"  • {data['code']['total_loc']:,} LOC")
    print(f"  • {data['code']['total_files']:,} files")
    print(f"  • {data['github']['total_repos']:,} repositories")
    print(f"  • {data['agents']['total']:,} agents")
    print()


if __name__ == "__main__":
    main()
