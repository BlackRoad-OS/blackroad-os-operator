from __future__ import annotations

import asyncio
import contextlib
import os
import time
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from .catalog import AgentCatalog
from .versioning import get_git_sha

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CATALOG_PATH = Path(
    os.getenv("CATALOG_PATH", REPO_ROOT / "agent-catalog" / "agents.yaml")
)


def create_app(catalog_path: Path | None = None, enable_watch: bool = True) -> FastAPI:
    catalog = AgentCatalog(catalog_path or DEFAULT_CATALOG_PATH)
    app = FastAPI(title="BlackRoad OS Operator")
    start_time = time.time()
    stop_event = asyncio.Event()
    operator_version = os.getenv("COMMIT_SHA") or get_git_sha(REPO_ROOT) or "unknown"

    @app.on_event("startup")
    async def startup() -> None:  # pragma: no cover - wiring
        await catalog.load()
        if enable_watch:
            app.state.catalog_watch = asyncio.create_task(catalog.watch(stop_event))

    @app.on_event("shutdown")
    async def shutdown() -> None:  # pragma: no cover - wiring
        stop_event.set()
        watch_task: asyncio.Task | None = getattr(app.state, "catalog_watch", None)
        if watch_task:
            watch_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await watch_task

    @app.middleware("http")
    async def add_version_headers(request: Request, call_next):  # type: ignore[override]
        response = await call_next(request)
        response.headers["X-Agent-Operator-Version"] = operator_version
        response.headers["X-Catalog-Version"] = catalog.catalog_version
        return response

    @app.get("/agents")
    async def list_agents() -> Dict[str, Any]:
        return {"agents": list(catalog.agents)}

    @app.get("/agents/{agent_id}")
    async def get_agent(agent_id: str) -> Dict[str, Any]:
        agent = catalog.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="agent not found")
        return agent

    @app.get("/health")
    async def health() -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "status": "ok",
            "catalog": catalog.status,
            "uptime_seconds": round(time.time() - start_time, 3),
        }
        if catalog.error:
            payload["catalog_error"] = catalog.error
        return payload

    return app


app = create_app()
