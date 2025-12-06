#!/usr/bin/env python3
"""Generate a dynamic snapshot of repository configuration files.

The tool crawls the `config/` directory, computes checksums, and writes a
machine-readable state file that downstream jobs can diff to detect change.

Usage
-----
Run once:
    python scripts/dynamic_config_refresh.py

Continuous (refresh every 60s):
    python scripts/dynamic_config_refresh.py --interval 60

This script only requires PyYAML as an external dependency so it can run inside
Railway, GitHub Actions, or lightweight cron jobs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Sequence

import yaml


@dataclass
class FileState:
    """Immutable snapshot of a config file."""

    path: str
    sha256: str
    size: int
    modified_at: str


@dataclass
class ConfigState:
    """Structured record of the current config surface."""

    generated_at: str
    root: str
    files: List[FileState]
    summary: dict
    manifest: dict | None


def sha256_digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def iter_config_files(root: Path, ignore: Sequence[Path]) -> Iterable[Path]:
    """Yield config files that should participate in the dynamic snapshot."""

    ignored = {p.resolve() for p in ignore}
    for path in sorted(root.rglob("*")):
        if path.is_dir():
            continue
        if path.suffix.lower() not in {".yaml", ".yml", ".json", ".csv"}:
            continue
        resolved = path.resolve()
        if any(resolved == ig or resolved.is_relative_to(ig) for ig in ignored):
            continue
        yield path


def load_manifest(manifest_path: Path) -> dict | None:
    if not manifest_path.exists():
        return None
    with manifest_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def build_state(config_root: Path, manifest_path: Path, output_path: Path) -> ConfigState:
    now = datetime.now(timezone.utc).isoformat()
    ignore = [output_path]
    # Keep the manifest visible in state to make dynamism transparent
    manifest = load_manifest(manifest_path)
    files: List[FileState] = []

    for path in iter_config_files(config_root, ignore=ignore):
        stat = path.stat()
        data = path.read_bytes()
        files.append(
            FileState(
                path=path.relative_to(config_root.parent).as_posix(),
                sha256=sha256_digest(data),
                size=stat.st_size,
                modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            )
        )

    summary = {
        "count": len(files),
        "total_size": sum(f.size for f in files),
        "by_extension": {},
    }
    for f in files:
        ext = Path(f.path).suffix or "<none>"
        summary["by_extension"].setdefault(ext, {"count": 0, "size": 0})
        summary["by_extension"][ext]["count"] += 1
        summary["by_extension"][ext]["size"] += f.size

    return ConfigState(
        generated_at=now,
        root=config_root.resolve().as_posix(),
        files=files,
        summary=summary,
        manifest=manifest,
    )


def write_state(state: ConfigState, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(asdict(state), f, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Snapshot dynamic config state")
    parser.add_argument(
        "--config-dir",
        type=Path,
        default=Path("config"),
        help="Directory containing config sources",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("config/dynamic/state.json"),
        help="Where to write the generated state file",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("config/dynamic/manifest.yaml"),
        help="Dynamic manifest describing refresh intent",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=0,
        help="Refresh interval in seconds. 0 = run once and exit",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    while True:
        state = build_state(args.config_dir, args.manifest, args.output)
        write_state(state, args.output)
        print(
            f"[dynamic-config] captured {state.summary['count']} files "
            f"({state.summary['total_size']} bytes) at {state.generated_at}"
        )
        if args.interval <= 0:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
