"""Utilities for inspecting git remotes in local working copies."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import subprocess
from typing import Dict, List


@dataclass
class GitRemote:
    """Represents a git remote entry."""

    name: str
    fetch: str | None = None
    push: str | None = None

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "fetch": self.fetch,
            "push": self.push,
        }


def parse_git_remote_output(output: str) -> List[GitRemote]:
    """Parse ``git remote -v`` output into a list of remotes.

    The command returns two lines per remote (fetch/push). We combine them into a
    single ``GitRemote`` entry keyed by remote name.
    """

    remotes: Dict[str, GitRemote] = {}

    for raw_line in output.splitlines():
        parts = raw_line.strip().split()
        if len(parts) < 3:
            continue

        name, url, direction = parts[0], parts[1], parts[2].strip("()")
        remote = remotes.setdefault(name, GitRemote(name=name))

        if direction == "fetch":
            remote.fetch = url
        elif direction == "push":
            remote.push = url

    return [remotes[key] for key in sorted(remotes.keys())]


def list_git_remotes(repo_path: str | Path) -> List[GitRemote]:
    """Return remotes for the given repository path.

    Raises ``FileNotFoundError`` when the path does not exist and ``RuntimeError``
    if git returns a non-zero exit code.
    """

    repo = Path(repo_path).expanduser().resolve()
    if not repo.exists():
        raise FileNotFoundError(f"Repository path does not exist: {repo}")

    cmd = ["git", "-C", str(repo), "remote", "-v"]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "Unable to list remotes")

    return parse_git_remote_output(result.stdout)
