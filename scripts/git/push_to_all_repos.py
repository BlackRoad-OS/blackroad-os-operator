#!/usr/bin/env python3
"""Push the current branch to all known BlackRoad repositories.

This script reads the GitHub inventory from
`integrations/devtools/github-organization.yaml` and pushes the current branch
(or a supplied branch name) to every listed repository. It is intentionally
safe-by-default: the dry-run mode is enabled unless `--execute` is provided.

Examples:
    # Preview the remotes/commands without writing anything
    ./scripts/git/push_to_all_repos.py

    # Push the current branch to all repos under the BlackRoad-OS org
    ./scripts/git/push_to_all_repos.py --execute

    # Push a specific branch name and include the current repo in the fan-out
    ./scripts/git/push_to_all_repos.py --execute --branch main --include-current
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from typing import Dict, Iterable, List

import yaml

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "integrations" / "devtools" / "github-organization.yaml"


def run(cmd: List[str]) -> None:
    subprocess.run(cmd, check=True)


def git_output(cmd: List[str]) -> str:
    return subprocess.check_output(["git", *cmd], text=True).strip()


def remote_exists(name: str) -> bool:
    result = subprocess.run(["git", "remote", "get-url", name], capture_output=True)
    return result.returncode == 0


def add_remote(name: str, url: str, dry_run: bool) -> None:
    if dry_run:
        print(f"[dry-run] git remote add {name} {url}")
        return

    run(["git", "remote", "add", name, url])


def push_remote(remote: str, source_branch: str, target_branch: str, force: bool, dry_run: bool) -> None:
    push_args = ["git", "push", remote, f"{source_branch}:{target_branch}"]
    if force:
        push_args.append("--force-with-lease")

    if dry_run:
        print(f"[dry-run] {' '.join(push_args)}")
        return

    run(push_args)


def load_repositories(path: Path) -> List[str]:
    data = yaml.safe_load(path.read_text()) or {}
    repos: Dict[str, object] = data.get("repositories", {})
    return list(repos.keys())


def build_remote_url(org: str, repo: str, protocol: str) -> str:
    if protocol == "ssh":
        return f"git@github.com:{org}/{repo}.git"
    if protocol == "https":
        return f"https://github.com/{org}/{repo}.git"
    raise ValueError(f"Unsupported protocol: {protocol}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Push the current branch to all BlackRoad repos")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="Path to GitHub org inventory YAML")
    parser.add_argument("--org", default="BlackRoad-OS", help="GitHub organization name")
    parser.add_argument("--branch", help="Branch name to push (defaults to current branch)")
    parser.add_argument("--remote-prefix", default="fanout-", help="Prefix for generated remote names")
    parser.add_argument("--protocol", choices=["ssh", "https"], default="ssh", help="Git remote protocol")
    parser.add_argument("--include-current", action="store_true", help="Include this repo in the push fan-out")
    parser.add_argument("--force", action="store_true", help="Use --force-with-lease when pushing")
    parser.add_argument("--execute", action="store_true", help="Perform pushes (otherwise dry-run)")
    parser.add_argument("--target", action="append", help="Explicit repository names to push (overrides config)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dry_run = not args.execute

    config_path = args.config
    if not config_path.exists():
        raise SystemExit(f"Config file not found: {config_path}")

    repositories: Iterable[str]
    if args.target:
        repositories = args.target
    else:
        repositories = load_repositories(config_path)

    current_repo = ROOT.name
    if not args.include_current:
        repositories = [repo for repo in repositories if repo != current_repo]

    current_branch = args.branch or git_output(["rev-parse", "--abbrev-ref", "HEAD"])

    repo_list = list(repositories)
    print(f"Preparing to push branch '{current_branch}' to {len(repo_list)} repositories...")

    for repo in repo_list:
        remote_name = f"{args.remote_prefix}{repo}"
        remote_url = build_remote_url(args.org, repo, args.protocol)

        if not remote_exists(remote_name):
            add_remote(remote_name, remote_url, dry_run)

        push_remote(remote_name, current_branch, args.branch or current_branch, args.force, dry_run)

    if dry_run:
        print("Dry-run complete. Re-run with --execute to perform pushes.")


if __name__ == "__main__":
    main()
