#!/usr/bin/env python3
"""Lucidia Filesystem MCP Server

Secure filesystem access within allow-listed directories.
Prevents path traversal attacks.

Environment Variables:
    LUCIDIA_FS_ROOT: Root directory for file operations (default: .)
    LUCIDIA_FS_READ_ONLY: Set to "1" for read-only mode

Part of BlackRoad OS MCP infrastructure.
"""

from __future__ import annotations

import os
import pathlib
from typing import List

try:
    from mcp.server import Server
except ImportError:
    Server = None

# Configuration
ROOT = pathlib.Path(os.environ.get("LUCIDIA_FS_ROOT", ".")).resolve()
READ_ONLY = os.environ.get("LUCIDIA_FS_READ_ONLY", "0") == "1"

# Initialize server
server = Server("lucidia-fs") if Server else None


def _resolve_path(path: str) -> pathlib.Path:
    """Resolve path safely within ROOT.

    Raises:
        ValueError: If path escapes ROOT directory
    """
    # Handle absolute paths by making them relative
    if path.startswith("/"):
        path = path[1:]

    target = (ROOT / path).resolve()

    # Security check: ensure path stays within ROOT
    try:
        target.relative_to(ROOT)
    except ValueError:
        raise ValueError(f"Path escapes allowed root: {path}")

    return target


if server:

    @server.tool()
    def read_file(path: str) -> str:
        """Read contents of a file.

        Args:
            path: Path relative to allowed root

        Returns:
            File contents as string
        """
        target = _resolve_path(path)
        if not target.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if not target.is_file():
            raise ValueError(f"Not a file: {path}")
        return target.read_text()

    @server.tool()
    def write_file(path: str, content: str) -> str:
        """Write content to a file.

        Args:
            path: Path relative to allowed root
            content: Content to write

        Returns:
            "ok" on success
        """
        if READ_ONLY:
            raise PermissionError("Server is in read-only mode")

        target = _resolve_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
        return "ok"

    @server.tool()
    def list_directory(path: str = ".") -> List[str]:
        """List contents of a directory.

        Args:
            path: Path relative to allowed root (default: root itself)

        Returns:
            List of filenames/directory names
        """
        target = _resolve_path(path)
        if not target.exists():
            raise FileNotFoundError(f"Directory not found: {path}")
        if not target.is_dir():
            raise ValueError(f"Not a directory: {path}")

        items = []
        for item in sorted(target.iterdir()):
            name = item.name
            if item.is_dir():
                name += "/"
            items.append(name)
        return items

    @server.tool()
    def file_info(path: str) -> dict:
        """Get information about a file or directory.

        Args:
            path: Path relative to allowed root

        Returns:
            Dict with size, type, modified time
        """
        target = _resolve_path(path)
        if not target.exists():
            raise FileNotFoundError(f"Not found: {path}")

        stat = target.stat()
        return {
            "path": path,
            "type": "directory" if target.is_dir() else "file",
            "size": stat.st_size,
            "modified": stat.st_mtime,
            "readable": os.access(target, os.R_OK),
            "writable": os.access(target, os.W_OK) and not READ_ONLY
        }

    @server.tool()
    def search_files(pattern: str, path: str = ".") -> List[str]:
        """Search for files matching a glob pattern.

        Args:
            pattern: Glob pattern (e.g., "*.py", "**/*.md")
            path: Directory to search in

        Returns:
            List of matching file paths
        """
        target = _resolve_path(path)
        if not target.is_dir():
            raise ValueError(f"Not a directory: {path}")

        matches = []
        for match in target.glob(pattern):
            try:
                rel = match.relative_to(ROOT)
                matches.append(str(rel))
            except ValueError:
                continue

        return sorted(matches)[:100]  # Limit results

    @server.tool()
    def delete_file(path: str) -> str:
        """Delete a file.

        Args:
            path: Path relative to allowed root

        Returns:
            "ok" on success
        """
        if READ_ONLY:
            raise PermissionError("Server is in read-only mode")

        target = _resolve_path(path)
        if not target.exists():
            raise FileNotFoundError(f"File not found: {path}")
        if target.is_dir():
            raise ValueError("Cannot delete directory with this tool")

        target.unlink()
        return "ok"


def main() -> None:
    """Run the MCP server."""
    if not server:
        raise RuntimeError("mcp package not installed: pip install mcp")
    server.run()


if __name__ == "__main__":
    main()
