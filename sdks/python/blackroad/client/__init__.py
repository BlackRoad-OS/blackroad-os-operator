# BlackRoad OS Python SDK - Client
#
# @blackroad_name: SDK Client
# @operator: alexa.operator.v1

from __future__ import annotations

from typing import Any, Dict, List, Optional, AsyncIterator
from dataclasses import dataclass
import httpx


@dataclass
class ClientConfig:
    """Configuration for BlackRoad client."""

    api_key: Optional[str] = None
    base_url: str = "https://api.blackroad.io/v1"
    timeout: float = 30.0
    max_retries: int = 3


class AgentsResource:
    """Agents API resource."""

    def __init__(self, client: BlackRoadAsync):
        self._client = client

    async def list(self, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """List all agents."""
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        return await self._client._request("GET", "/agents", params=params)

    async def get(self, agent_id: str) -> Dict[str, Any]:
        """Get an agent by ID."""
        return await self._client._request("GET", f"/agents/{agent_id}")

    async def create(self, name: str, type: str = "custom", **kwargs: Any) -> Dict[str, Any]:
        """Create a new agent."""
        data = {"name": name, "type": type, **kwargs}
        return await self._client._request("POST", "/agents", json=data)

    async def invoke(
        self,
        agent_id: str,
        input: str | Dict[str, Any],
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Invoke an agent."""
        data = {"input": input, **kwargs}
        return await self._client._request("POST", f"/agents/{agent_id}/invoke", json=data)

    async def stream(
        self,
        agent_id: str,
        input: str | Dict[str, Any],
        **kwargs: Any,
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream agent response."""
        data = {"input": input, **kwargs}
        async for chunk in self._client._stream("POST", f"/agents/{agent_id}/stream", json=data):
            yield chunk


class GovernanceResource:
    """Governance API resource."""

    def __init__(self, client: BlackRoadAsync):
        self._client = client

    async def evaluate(
        self,
        action: str,
        subject: Dict[str, Any],
        resource: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Evaluate a policy."""
        data = {
            "action": action,
            "subject": subject,
            "resource": resource,
            "context": context or {},
        }
        return await self._client._request("POST", "/governance/evaluate", json=data)

    async def list_policies(self, scope: Optional[str] = None) -> Dict[str, Any]:
        """List policies."""
        params = {}
        if scope:
            params["scope"] = scope
        return await self._client._request("GET", "/governance/policies", params=params)


class LedgerResource:
    """Ledger API resource."""

    def __init__(self, client: BlackRoadAsync):
        self._client = client

    async def query(
        self,
        limit: int = 100,
        **filters: Any,
    ) -> Dict[str, Any]:
        """Query ledger events."""
        params = {"limit": limit, **filters}
        return await self._client._request("GET", "/ledger/events", params=params)

    async def get(self, event_id: str) -> Dict[str, Any]:
        """Get a ledger event."""
        return await self._client._request("GET", f"/ledger/events/{event_id}")

    async def verify(
        self,
        start_hash: Optional[str] = None,
        end_hash: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Verify ledger integrity."""
        data = {}
        if start_hash:
            data["start_hash"] = start_hash
        if end_hash:
            data["end_hash"] = end_hash
        return await self._client._request("POST", "/ledger/verify", json=data)


class CollaborationResource:
    """Collaboration API resource."""

    def __init__(self, client: BlackRoadAsync):
        self._client = client

    async def create_session(
        self,
        name: str,
        crdt_type: str = "rga",
        max_participants: int = 30000,
    ) -> Dict[str, Any]:
        """Create a collaboration session."""
        data = {
            "name": name,
            "crdt_type": crdt_type,
            "max_participants": max_participants,
        }
        return await self._client._request("POST", "/collab/sessions", json=data)

    async def join_session(
        self,
        session_id: str,
        entity_id: str,
        entity_type: str = "agent",
        role: str = "editor",
    ) -> Dict[str, Any]:
        """Join a collaboration session."""
        data = {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "role": role,
        }
        return await self._client._request("POST", f"/collab/sessions/{session_id}/join", json=data)

    async def apply_operation(
        self,
        session_id: str,
        operation: Dict[str, Any],
        participant_id: str,
    ) -> Dict[str, Any]:
        """Apply an operation to a session."""
        data = {
            "operation": operation,
            "participant_id": participant_id,
        }
        return await self._client._request("POST", f"/collab/sessions/{session_id}/operations", json=data)


class BlackRoadAsync:
    """Async BlackRoad client."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.blackroad.io/v1",
        timeout: float = 30.0,
    ):
        self.config = ClientConfig(
            api_key=api_key,
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )
        self._http: Optional[httpx.AsyncClient] = None

        # Resources
        self.agents = AgentsResource(self)
        self.governance = GovernanceResource(self)
        self.ledger = LedgerResource(self)
        self.collaboration = CollaborationResource(self)

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http is None or self._http.is_closed:
            headers = {"Content-Type": "application/json"}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"

            self._http = httpx.AsyncClient(
                base_url=self.config.base_url,
                headers=headers,
                timeout=self.config.timeout,
            )
        return self._http

    async def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Make an HTTP request."""
        client = await self._get_client()
        response = await client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json()

    async def _stream(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> AsyncIterator[Dict[str, Any]]:
        """Make a streaming HTTP request."""
        import json

        client = await self._get_client()
        async with client.stream(method, path, **kwargs) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data != "[DONE]":
                        yield json.loads(data)

    async def chat(
        self,
        message: str,
        user_id: Optional[str] = None,
        model: Optional[str] = None,
        use_rag: bool = True,
    ) -> Dict[str, Any]:
        """Chat with the default agent."""
        data = {
            "message": message,
            "use_rag": use_rag,
        }
        if user_id:
            data["userId"] = user_id
        if model:
            data["model"] = model
        return await self._request("POST", "/chat", json=data)

    async def close(self) -> None:
        """Close the client."""
        if self._http:
            await self._http.aclose()

    async def __aenter__(self) -> BlackRoadAsync:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()


class BlackRoad:
    """Synchronous BlackRoad client wrapper."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.blackroad.io/v1",
        timeout: float = 30.0,
    ):
        import asyncio

        self._async_client = BlackRoadAsync(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
        )
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def _get_loop(self):
        import asyncio
        if self._loop is None or self._loop.is_closed():
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
        return self._loop

    def _run(self, coro):
        return self._get_loop().run_until_complete(coro)

    @property
    def agents(self):
        return SyncAgentsResource(self._async_client.agents, self._run)

    @property
    def governance(self):
        return SyncGovernanceResource(self._async_client.governance, self._run)

    @property
    def ledger(self):
        return SyncLedgerResource(self._async_client.ledger, self._run)

    def chat(self, message: str, **kwargs) -> Dict[str, Any]:
        return self._run(self._async_client.chat(message, **kwargs))

    def close(self) -> None:
        self._run(self._async_client.close())


class SyncAgentsResource:
    def __init__(self, async_resource, runner):
        self._async = async_resource
        self._run = runner

    def list(self, **kwargs):
        return self._run(self._async.list(**kwargs))

    def get(self, agent_id: str):
        return self._run(self._async.get(agent_id))

    def create(self, name: str, **kwargs):
        return self._run(self._async.create(name, **kwargs))

    def invoke(self, agent_id: str, input, **kwargs):
        return self._run(self._async.invoke(agent_id, input, **kwargs))


class SyncGovernanceResource:
    def __init__(self, async_resource, runner):
        self._async = async_resource
        self._run = runner

    def evaluate(self, **kwargs):
        return self._run(self._async.evaluate(**kwargs))

    def list_policies(self, **kwargs):
        return self._run(self._async.list_policies(**kwargs))


class SyncLedgerResource:
    def __init__(self, async_resource, runner):
        self._async = async_resource
        self._run = runner

    def query(self, **kwargs):
        return self._run(self._async.query(**kwargs))

    def get(self, event_id: str):
        return self._run(self._async.get(event_id))

    def verify(self, **kwargs):
        return self._run(self._async.verify(**kwargs))
