#!/usr/bin/env python3
"""BlackRoad Identity MCP Server

Query and manage agents in the BlackRoad identity system.
Connects to the blackroad-identity Cloudflare Worker.

Environment Variables:
    BLACKROAD_IDENTITY_URL: Identity worker URL
    BLACKROAD_API_KEY: Optional API key for authenticated requests

Part of BlackRoad OS MCP infrastructure.
"""

from __future__ import annotations

import os
import json
from typing import Any, Dict, List, Optional

try:
    import requests
    session = requests.Session()
except ImportError:
    requests = None
    session = None

try:
    from mcp.server import Server
except ImportError:
    Server = None

# Configuration
IDENTITY_URL = os.environ.get(
    "BLACKROAD_IDENTITY_URL",
    "https://blackroad-identity.amundsonalexa.workers.dev"
)
API_KEY = os.environ.get("BLACKROAD_API_KEY", "")

# Initialize server
server = Server("blackroad-identity") if Server else None


def _request(method: str, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
    """Make request to identity worker."""
    if session is None:
        raise RuntimeError("requests library not installed")

    url = f"{IDENTITY_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    if method == "GET":
        response = session.get(url, headers=headers, timeout=30)
    elif method == "POST":
        response = session.post(url, json=data or {}, headers=headers, timeout=30)
    else:
        raise ValueError(f"Unsupported method: {method}")

    response.raise_for_status()
    return response.json()


if server:

    @server.tool()
    def get_agent(agent_id: str) -> Dict[str, Any]:
        """Get agent by ID.

        Args:
            agent_id: The agent's ID (e.g., "br-0001" or full ID)

        Returns:
            Agent record with identity, lineage, capabilities
        """
        return _request("GET", f"/agents/{agent_id}")

    @server.tool()
    def introspect_agent(agent_id: str) -> Dict[str, Any]:
        """Get agent's SelfModel (introspection).

        The agent looks at itself and returns its identity,
        lineage, capabilities, state, and recent activity.

        Args:
            agent_id: The agent's ID

        Returns:
            SelfModel with identity, lineage, capabilities, state, recent_activity
        """
        return _request("GET", f"/agents/{agent_id}/introspect")

    @server.tool()
    def list_agents(limit: int = 50) -> List[Dict[str, Any]]:
        """List all registered agents.

        Args:
            limit: Maximum number of agents to return

        Returns:
            List of agent summaries
        """
        result = _request("GET", f"/agents?limit={limit}")
        return result.get("agents", [])

    @server.tool()
    def search_agents(query: str) -> List[Dict[str, Any]]:
        """Search agents by name, type, or personality.

        Args:
            query: Search query

        Returns:
            List of matching agents
        """
        result = _request("GET", f"/agents/search?q={query}")
        return result.get("agents", [])

    @server.tool()
    def register_agent(
        agent_id: str,
        agent_type: str = "agent",
        provider: str = "blackroad",
        personality: Optional[str] = None
    ) -> Dict[str, Any]:
        """Register a new agent in the identity system.

        Args:
            agent_id: Unique identifier for the agent
            agent_type: Type of agent (e.g., "assistant", "tool", "portal")
            provider: Origin provider (e.g., "openai", "anthropic", "blackroad")
            personality: Optional personality description

        Returns:
            Registration result with assigned IDs
        """
        return _request("POST", "/handshake", {
            "agent_id": agent_id,
            "agent_type": agent_type,
            "provider": provider,
            "personality": personality
        })

    @server.tool()
    def agent_heartbeat(agent_id: str) -> Dict[str, Any]:
        """Send heartbeat for an agent.

        Updates last_seen and increments heartbeat count.

        Args:
            agent_id: The agent's ID

        Returns:
            Updated agent state
        """
        return _request("POST", f"/agents/{agent_id}/heartbeat", {})

    @server.tool()
    def get_stats() -> Dict[str, Any]:
        """Get identity system statistics.

        Returns:
            Call counts, agent counts, system metrics
        """
        return _request("GET", "/stats")

    @server.tool()
    def whoami() -> Dict[str, Any]:
        """Get identity of the current caller.

        Returns sovereignty verification and caller info.
        """
        return _request("GET", "/whoami")


def main() -> None:
    """Run the MCP server."""
    if not server:
        raise RuntimeError("mcp package not installed: pip install mcp")
    server.run()


if __name__ == "__main__":
    main()
