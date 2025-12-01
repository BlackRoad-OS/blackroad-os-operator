from __future__ import annotations

import asyncio
import contextlib
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .catalog import AgentCatalog
from .versioning import get_git_sha
from .llm_service import generate_chat_response, check_llm_health

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CATALOG_PATH = Path(
    os.getenv("CATALOG_PATH", REPO_ROOT / "agent-catalog" / "agents.yaml")
)


def create_app(catalog_path: Path | None = None, enable_watch: bool = True) -> FastAPI:
    catalog = AgentCatalog(catalog_path or DEFAULT_CATALOG_PATH)
    start_time = time.time()
    stop_event = asyncio.Event()
    operator_version = os.getenv("COMMIT_SHA") or get_git_sha(REPO_ROOT) or "unknown"

    from contextlib import asynccontextmanager
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await catalog.load()
        watch_task = None
        if enable_watch:
            watch_task = asyncio.create_task(catalog.watch(stop_event))
        yield
        stop_event.set()
        if enable_watch and watch_task:
            watch_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await watch_task

    app = FastAPI(title="BlackRoad OS Operator", lifespan=lifespan)
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

    # ============================================
    # HERO FLOW #1: Chat with Cece
    # ============================================

    class ChatRequest(BaseModel):
        message: str
        userId: Optional[str] = None
        model: Optional[str] = None

    @app.post("/chat")
    async def chat(request: ChatRequest) -> Dict[str, Any]:
        """Chat with Cece through the Operator Engine."""
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="message is required")

        try:
            response = await generate_chat_response(
                message=request.message.strip(),
                user_id=request.userId,
                model=request.model,
            )
            return response
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/llm/health")
    async def llm_health() -> Dict[str, Any]:
        """Check LLM gateway health."""
        return await check_llm_health()

    return app


app = create_app()
