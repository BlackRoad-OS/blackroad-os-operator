from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT / "controller"))

from controller.services.git_remotes import list_git_remotes, parse_git_remote_output


def test_parse_git_remote_output_combines_push_and_fetch() -> None:
    output = """
origin https://example.com/one.git (fetch)
origin ssh://example.com/one.git (push)
backup git@example.org:backup.git (fetch)
backup git@example.org:backup.git (push)
    """.strip()

    remotes = parse_git_remote_output(output)

    assert len(remotes) == 2
    assert remotes[0].name == "backup"
    assert remotes[0].fetch == "git@example.org:backup.git"
    assert remotes[0].push == "git@example.org:backup.git"
    assert remotes[1].name == "origin"
    assert remotes[1].fetch == "https://example.com/one.git"
    assert remotes[1].push == "ssh://example.com/one.git"


def test_list_git_remotes_reads_repository(tmp_path) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
    subprocess.run(["git", "remote", "add", "origin", "https://example.com/demo.git"], cwd=repo, check=True)

    remotes = list_git_remotes(repo)

    assert len(remotes) == 1
    assert remotes[0].name == "origin"
    assert remotes[0].fetch == "https://example.com/demo.git"
    assert remotes[0].push == "https://example.com/demo.git"


def test_list_git_remotes_missing_path_raises(tmp_path) -> None:
    missing = tmp_path / "missing"

    with pytest.raises(FileNotFoundError):
        list_git_remotes(missing)
