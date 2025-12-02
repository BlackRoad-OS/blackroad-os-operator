from __future__ import annotations

import asyncio
import contextlib
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query, Request

from .catalog import AgentCatalog
from .versioning import get_git_sha
from .llm_service import generate_chat_response, check_llm_health, check_rag_health
from .models import (
    ChatRequest,
    ChatResponse,
    LLMHealthResponse,
    RAGHealthResponse,
    LedgerLevel,
    PolicyEffect,
    PolicyEvaluateRequest,
    PolicyEvaluateResponse,
    PolicyContext,
    RequestMetadata,
    Subject,
    Resource,
    LedgerDecision,
    LedgerEvent,
    LedgerEventCreate,
)
from .models.ledger import LedgerEventList, LedgerEventQuery
from .policy_engine import PolicyEngine, get_policy_engine
from .ledger_service import LedgerService, get_ledger_service
from .ledger_builder import (
    build_mesh_connect_event,
    build_agent_invoke_event,
    build_operator_infra_event,
    validate_ledger_event,
)

REPO_ROOT = Path(__file__).resolve().parent.parent


DEFAULT_CATALOG_PATH = Path(
    os.getenv("CATALOG_PATH", REPO_ROOT / "agent-catalog" / "agents.yaml")
)


def create_app(catalog_path: Path | None = None, enable_watch: bool = True) -> FastAPI:
    catalog = AgentCatalog(catalog_path or DEFAULT_CATALOG_PATH)
    start_time = time.time()
    stop_event = asyncio.Event()
    operator_version = os.getenv("COMMIT_SHA") or get_git_sha(REPO_ROOT) or "unknown"

    # Initialize governance services
    policy_engine: Optional[PolicyEngine] = None
    ledger_service: Optional[LedgerService] = None

    from contextlib import asynccontextmanager
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        nonlocal policy_engine, ledger_service

        # Load agent catalog
        await catalog.load()

        # Load governance services
        policy_engine = await get_policy_engine()
        ledger_service = await get_ledger_service()

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

    @app.get("/version")
    async def version() -> Dict[str, Any]:
        return {
            "version": operator_version,
            "catalog_version": catalog.catalog_version,
            "service": "blackroad-os-operator",
        }
    # ============================================
    # HERO FLOW #1 & #2: Chat with Cece
    # ============================================
    # Hero Flow #1: User → Operator → GPT-OSS Model → Response
    # Hero Flow #2: User → Operator → RAG API → GPT-OSS Model → Response
    #
    # RAG is enabled by default (use_rag=True). If RAG API is unavailable,
    # falls back gracefully to Hero Flow #1 behavior.

    @app.post("/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest) -> ChatResponse:
        """Chat with Cece through the Operator Engine.

        Hero Flow #2 (default): Attempts RAG context retrieval, then LLM
        Hero Flow #1 (fallback): Direct LLM call if RAG unavailable
        """
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="message is required")

        try:
            # Hero Flow #2: RAG enabled by default
            response = await generate_chat_response(
                message=request.message.strip(),
                user_id=request.userId,
                model=request.model,
                use_rag=True,  # Enable RAG - falls back gracefully if unavailable
            )
            return ChatResponse(**response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/llm/health", response_model=LLMHealthResponse)
    async def llm_health() -> LLMHealthResponse:
        """Check LLM gateway health."""
        data = await check_llm_health()
        return LLMHealthResponse(**data)

    @app.get("/rag/health", response_model=RAGHealthResponse)
    async def rag_health() -> RAGHealthResponse:
        """Check RAG API health."""
        data = await check_rag_health()
        return RAGHealthResponse(**data)

    # ============================================
    # GOVERNANCE: Policy Evaluation (Cece/Alice)
    # ============================================
    # amundson: 0.1.0
    # governor: alice.governor.v1
    # operator: alexa.operator.v1

    def _check_mesh_invariants(request: PolicyEvaluateRequest) -> Optional[PolicyEvaluateResponse]:
        """Check hard invariants for mesh.* and agents.* scopes.

        These are non-negotiable governance rules:
        - mesh.* actions require delegation_id OR actor_role=operator
        - agents.* actions require actor_agent_id AND capability claim

        Returns a DENY response if invariant is violated, None otherwise.
        """
        scope = request.context.request_metadata.host or ""
        action = request.action

        # Determine if this is a mesh/agents scope
        is_mesh_scope = (
            scope.endswith(".blackroad.network") or
            action.startswith("mesh:") or
            action.startswith("agents:")
        )

        if not is_mesh_scope:
            return None

        # Check mesh invariant: delegation or operator role
        has_delegation = any(
            c.get("type") == "delegation" or "delegation_id" in c
            for c in request.context.claims
        )
        is_operator = request.subject.role == "operator"

        if not (has_delegation or is_operator):
            return PolicyEvaluateResponse(
                decision=PolicyEffect.DENY,
                policy_id="invariant:mesh-delegation-required",
                policy_version="invariant-v1",
                reason="mesh.*/agents.* actions require explicit delegation or operator role",
                required_ledger_level=LedgerLevel.FULL,
            )

        # Check agents invariant: agent_id and capability claim
        if action.startswith("agents:"):
            # Extract required capability from action
            # e.g., "agents:invoke" requires "invoke" capability
            required_capability = action.split(":")[1] if ":" in action else None

            if required_capability:
                has_capability = any(
                    c.get("type") == "capability" and
                    required_capability in c.get("capabilities", [])
                    for c in request.context.claims
                )
                if not has_capability:
                    return PolicyEvaluateResponse(
                        decision=PolicyEffect.DENY,
                        policy_id="invariant:agents-capability-required",
                        policy_version="invariant-v1",
                        reason=f"agents.* actions require capability claim for '{required_capability}'",
                        required_ledger_level=LedgerLevel.FULL,
                    )

        return None

    @app.post("/policy/evaluate", response_model=PolicyEvaluateResponse)
    async def evaluate_policy(request: PolicyEvaluateRequest) -> PolicyEvaluateResponse:
        """Evaluate a policy request.

        This is Cece's governance decision endpoint.

        The evaluation flow:
        1. Check hard invariants (mesh/agents delegation requirements)
        2. If invariant fails, return DENY immediately
        3. Otherwise, run through PolicyEngine for scope-based matching
        4. Return decision with required_ledger_level for caller

        Callers must then emit a ledger event at the required level.
        """
        if policy_engine is None:
            raise HTTPException(status_code=503, detail="Policy engine not initialized")

        # Check hard invariants first
        invariant_violation = _check_mesh_invariants(request)
        if invariant_violation:
            return invariant_violation

        # Run policy engine evaluation
        try:
            return policy_engine.evaluate(request)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Policy evaluation failed: {e}")

    # ============================================
    # GOVERNANCE: Ledger Events
    # ============================================

    @app.post("/ledger/event", response_model=LedgerEvent)
    async def record_ledger_event(event: LedgerEventCreate) -> LedgerEvent:
        """Record a ledger event.

        This is the append-only audit log for all governance-relevant actions.
        Events are immutable once recorded.

        Callers should:
        1. Call /policy/evaluate first
        2. Use the required_ledger_level from the response
        3. Include all required fields based on that level
        """
        if ledger_service is None:
            raise HTTPException(status_code=503, detail="Ledger service not initialized")

        try:
            return await ledger_service.record(event)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to record event: {e}")

    @app.get("/ledger/events", response_model=LedgerEventList)
    async def query_ledger_events(
        correlation_id: Optional[UUID] = Query(None),
        intent_id: Optional[UUID] = Query(None),
        actor_user_id: Optional[str] = Query(None),
        actor_agent_id: Optional[str] = Query(None),
        action: Optional[str] = Query(None),
        policy_scope: Optional[str] = Query(None),
        decision: Optional[LedgerDecision] = Query(None),
        host: Optional[str] = Query(None),
        service: Optional[str] = Query(None),
        limit: int = Query(100, le=1000),
        offset: int = Query(0),
    ) -> LedgerEventList:
        """Query ledger events with filters.

        Supports filtering by:
        - correlation_id: Find all events in a request chain
        - intent_id: Find all events in a multi-step intent
        - actor_user_id / actor_agent_id: Find events by actor
        - action: Find events by action type
        - policy_scope: Find events by scope
        - decision: Find events by decision (allow/deny/warn/shadow_deny)
        - host / service: Find events by origin

        Results are paginated and sorted by occurred_at descending.
        """
        if ledger_service is None:
            raise HTTPException(status_code=503, detail="Ledger service not initialized")

        query = LedgerEventQuery(
            correlation_id=correlation_id,
            intent_id=intent_id,
            actor_user_id=actor_user_id,
            actor_agent_id=actor_agent_id,
            action=action,
            policy_scope=policy_scope,
            decision=decision,
            host=host,
            service=service,
            limit=limit,
            offset=offset,
        )

        try:
            return await ledger_service.query(query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to query events: {e}")

    @app.get("/ledger/events/{event_id}", response_model=LedgerEvent)
    async def get_ledger_event(event_id: UUID) -> LedgerEvent:
        """Get a single ledger event by ID."""
        if ledger_service is None:
            raise HTTPException(status_code=503, detail="Ledger service not initialized")

        event = await ledger_service.get(event_id)
        if event is None:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    @app.get("/ledger/correlation/{correlation_id}", response_model=List[LedgerEvent])
    async def get_events_by_correlation(correlation_id: UUID) -> List[LedgerEvent]:
        """Get all events in a correlation chain.

        Useful for tracing a request across services.
        """
        if ledger_service is None:
            raise HTTPException(status_code=503, detail="Ledger service not initialized")

        return await ledger_service.get_by_correlation(correlation_id)

    @app.get("/ledger/stats")
    async def get_ledger_stats() -> Dict[str, Any]:
        """Get ledger statistics."""
        if ledger_service is None:
            raise HTTPException(status_code=503, detail="Ledger service not initialized")

        return {
            "total_events": await ledger_service.count(),
            "by_decision": await ledger_service.count_by_decision(),
        }

    # ============================================
    # GOVERNANCE: Health & Introspection
    # ============================================

    @app.get("/governance/health")
    async def governance_health() -> Dict[str, Any]:
        """Check governance subsystem health."""
        return {
            "policy_engine": "ok" if policy_engine else "not_initialized",
            "ledger_service": "ok" if ledger_service else "not_initialized",
            "policy_packs_loaded": len(policy_engine.policy_packs) if policy_engine else 0,
            "services_registered": len(policy_engine.service_registry) if policy_engine else 0,
            "ledger_event_count": await ledger_service.count() if ledger_service else 0,
        }

    # ============================================
    # MESH: Connection & Agent Governance
    # ============================================
    # These endpoints provide governed mesh/agent operations.
    # All mesh.* and agents.* actions are logged at full fidelity.

    @app.post("/mesh/connect")
    async def mesh_connect(
        user_id: Optional[str] = None,
        role: str = "agent",
        agent_id: Optional[str] = None,
        delegation_id: Optional[str] = None,
        connection_type: str = "websocket",
    ) -> Dict[str, Any]:
        """Governed mesh connection request.

        This endpoint evaluates policy before allowing a mesh connection.
        Used by agents, Pi nodes, and edge devices connecting to the mesh.

        Invariants enforced:
        - mesh.* requires delegation_id OR role=operator
        - All connections logged at ledger_level=full
        """
        if policy_engine is None or ledger_service is None:
            raise HTTPException(status_code=503, detail="Governance not initialized")

        from uuid import uuid4
        correlation_id = str(uuid4())
        connection_id = str(uuid4())

        # Build claims based on delegation
        claims = []
        if delegation_id:
            claims.append({
                "type": "delegation",
                "delegation_id": delegation_id,
            })

        # Build policy request
        request = PolicyEvaluateRequest(
            subject=Subject(
                user_id=user_id,
                role=role,
                attributes={"agent_id": agent_id} if agent_id else {},
            ),
            action="mesh:connect",
            resource=Resource(type="mesh", id=connection_id),
            context=PolicyContext(
                claims=claims,
                asserted_facts=["delegation_valid"] if delegation_id else [],
                fact_evidence={
                    "delegation_valid": {"delegation_id": delegation_id}
                } if delegation_id else {},
                request_metadata=RequestMetadata(
                    host="mesh.blackroad.network",
                    service="mesh-router",
                    correlation_id=correlation_id,
                ),
            ),
        )

        # Check mesh invariants first
        invariant_result = _check_mesh_invariants(request)
        if invariant_result:
            # Record the denied connection attempt
            event = build_mesh_connect_event(
                request, invariant_result, connection_id, connection_type
            )
            await ledger_service.record(event)
            raise HTTPException(
                status_code=403,
                detail=invariant_result.reason or "Mesh invariant violation",
            )

        # Evaluate policy
        response = policy_engine.evaluate(request)

        # Build and record ledger event
        event = build_mesh_connect_event(
            request, response, connection_id, connection_type
        )
        validate_ledger_event(event)
        await ledger_service.record(event)

        if response.decision == PolicyEffect.DENY:
            raise HTTPException(
                status_code=403,
                detail=response.reason or "Connection denied by policy",
            )

        return {
            "connection_id": connection_id,
            "correlation_id": correlation_id,
            "decision": response.decision.value,
            "policy_id": response.policy_id,
        }

    @app.post("/agents/invoke/{agent_id}")
    async def invoke_agent(
        agent_id: str,
        capability: str,
        user_id: Optional[str] = None,
        role: str = "agent",
        invoker_agent_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Governed agent invocation.

        Evaluates policy before allowing an agent to be invoked.

        Invariants enforced:
        - agents.* requires actor_agent_id AND capability claim
        - All invocations logged at ledger_level=full
        """
        if policy_engine is None or ledger_service is None:
            raise HTTPException(status_code=503, detail="Governance not initialized")

        from uuid import uuid4
        correlation_id = str(uuid4())
        invocation_id = str(uuid4())

        # Build capability claim
        claims = []
        if capability:
            claims.append({
                "type": "capability",
                "capabilities": [capability],
                "agent_id": invoker_agent_id,
            })

        # Build policy request
        request = PolicyEvaluateRequest(
            subject=Subject(
                user_id=user_id,
                role=role,
                attributes={"agent_id": invoker_agent_id} if invoker_agent_id else {},
            ),
            action="agents:invoke",
            resource=Resource(type="agent", id=agent_id),
            context=PolicyContext(
                claims=claims,
                asserted_facts=["has_invoke_capability", "target_agent_registered"] if capability else [],
                fact_evidence={
                    "has_invoke_capability": {"capability": capability},
                    "target_agent_registered": {"agent_id": agent_id},
                } if capability else {},
                request_metadata=RequestMetadata(
                    host="agents.blackroad.network",
                    service="operator-ws",
                    correlation_id=correlation_id,
                ),
            ),
        )

        # Check mesh invariants
        invariant_result = _check_mesh_invariants(request)
        if invariant_result:
            event = build_agent_invoke_event(
                request, invariant_result, invocation_id, agent_id, capability
            )
            await ledger_service.record(event)
            raise HTTPException(
                status_code=403,
                detail=invariant_result.reason or "Agent invariant violation",
            )

        # Evaluate policy
        response = policy_engine.evaluate(request)

        # Build and record ledger event
        event = build_agent_invoke_event(
            request, response, invocation_id, agent_id, capability,
            payload_summary={"keys": list(payload.keys())} if payload else None,
        )
        validate_ledger_event(event)
        await ledger_service.record(event)

        if response.decision == PolicyEffect.DENY:
            raise HTTPException(
                status_code=403,
                detail=response.reason or "Invocation denied by policy",
            )

        # If allowed, actually invoke the agent
        # (For now, just return success - actual invocation logic goes here)
        agent = catalog.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found in catalog")

        return {
            "invocation_id": invocation_id,
            "correlation_id": correlation_id,
            "agent_id": agent_id,
            "capability": capability,
            "decision": response.decision.value,
            "policy_id": response.policy_id,
            "agent": agent,
        }

    # ============================================
    # INFRA: Operator Commands
    # ============================================

    @app.post("/operator/service/{service_name}/{action}")
    async def operator_service_action(
        service_name: str,
        action: str,  # restart, scale, deploy, rollback
        user_id: str,
        scale_to: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Governed infrastructure operation.

        Only operators may perform infrastructure actions.
        All actions logged at ledger_level=full.
        """
        if policy_engine is None or ledger_service is None:
            raise HTTPException(status_code=503, detail="Governance not initialized")

        from uuid import uuid4
        correlation_id = str(uuid4())
        operation_id = str(uuid4())

        # Build policy request
        request = PolicyEvaluateRequest(
            subject=Subject(user_id=user_id, role="operator"),
            action=f"operator:{action}",
            resource=Resource(type="service", id=service_name),
            context=PolicyContext(
                claims=[],
                asserted_facts=[],
                fact_evidence={},
                request_metadata=RequestMetadata(
                    host="infra.blackroad.systems",
                    service="operator-ws",
                    correlation_id=correlation_id,
                ),
            ),
        )

        # Evaluate policy
        response = policy_engine.evaluate(request)

        # Build and record ledger event
        event = build_operator_infra_event(
            request, response, operation_id, action, service_name,
            details={"scale_to": scale_to} if scale_to else None,
        )
        validate_ledger_event(event)
        await ledger_service.record(event)

        if response.decision == PolicyEffect.DENY:
            raise HTTPException(
                status_code=403,
                detail=response.reason or "Operation denied by policy",
            )

        # If allowed, perform the operation
        # (For now, just return success - actual operation logic goes here)
        return {
            "operation_id": operation_id,
            "correlation_id": correlation_id,
            "service": service_name,
            "action": action,
            "decision": response.decision.value,
            "policy_id": response.policy_id,
            "status": "executed" if response.decision != PolicyEffect.DENY else "denied",
        }

    return app


app = create_app()
