from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Optional


def get_git_sha(repo_root: Path) -> Optional[str]:
    try:
        return (
            subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo_root)
            .decode()
            .strip()
        )
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        return None
