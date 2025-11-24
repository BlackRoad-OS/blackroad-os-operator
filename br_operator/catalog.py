from __future__ import annotations

import asyncio
import hashlib
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

import yaml
from watchfiles import awatch


class AgentCatalog:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._agents: Dict[str, Dict[str, Any]] = {}
        self._file_sha: str = ""
        self._error: Optional[str] = None
        self._lock = asyncio.Lock()

    @property
    def agents(self) -> Iterable[Dict[str, Any]]:
        return self._agents.values()

    @property
    def catalog_version(self) -> str:
        return self._file_sha[:7] if self._file_sha else "unknown"

    @property
    def status(self) -> str:
        return "ok" if self._error is None else "error"

    @property
    def error(self) -> Optional[str]:
        return self._error

    async def load(self) -> None:
        async with self._lock:
            try:
                content = await asyncio.to_thread(self.path.read_text, encoding="utf-8")
            except FileNotFoundError as exc:
                self._agents = {}
                self._file_sha = ""
                self._error = f"catalog not found: {exc}"
                return

            self._file_sha = hashlib.sha256(content.encode("utf-8")).hexdigest()

            try:
                parsed = yaml.safe_load(content) or []
                if not isinstance(parsed, list):
                    raise ValueError("agents.yaml must contain a list of agents")

                agents: Dict[str, Dict[str, Any]] = {}
                for entry in parsed:
                    if not isinstance(entry, dict):
                        raise ValueError("each agent must be an object")
                    agent_id = entry.get("id")
                    if not agent_id:
                        raise ValueError("agent entry missing 'id'")
                    agents[str(agent_id)] = entry
            except Exception as exc:  # noqa: BLE001
                self._agents = {}
                self._error = f"catalog parse error: {exc}"
                return

            self._agents = agents
            self._error = None

    async def watch(self, stop_event: asyncio.Event) -> None:
        target = self.path if self.path.exists() else self.path.parent
        while not stop_event.is_set():
            try:
                async for changes in awatch(target):
                    watched_paths = {Path(change[1]).resolve() for change in changes}
                    if self.path.resolve() in watched_paths:
                        await self.load()
            except Exception as exc:
                print(f"Error in awatch loop: {exc}")
                async with self._lock:
                    self._error = f"watch error: {exc}"
                await asyncio.sleep(1)  # avoid tight error loop
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        return self._agents.get(agent_id)
