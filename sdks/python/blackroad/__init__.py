# BlackRoad OS Python SDK
# AI Governance Platform
#
# @blackroad_name: Python SDK
# @operator: alexa.operator.v1

"""
BlackRoad OS Python SDK

The official Python SDK for BlackRoad OS - an AI governance and agent orchestration platform.

Example usage:
    from blackroad import BlackRoad

    client = BlackRoad(api_key="your-api-key")

    # Chat with an agent
    response = await client.chat("Hello, how can you help me?")
    print(response.message)

    # List agents
    agents = await client.agents.list()
    for agent in agents:
        print(f"{agent.id}: {agent.name}")

    # Evaluate a policy
    result = await client.governance.evaluate(
        action="agents:invoke",
        subject={"user_id": "user-123"},
        resource={"type": "agent", "id": "agent-456"},
    )
    print(f"Decision: {result.decision}")
"""

from .client import BlackRoad, BlackRoadAsync
from .models import (
    Agent,
    AgentStatus,
    ChatRequest,
    ChatResponse,
    PolicyEvaluation,
    PolicyResult,
    LedgerEvent,
    CollaborationSession,
)

__version__ = "0.1.0"
__all__ = [
    "BlackRoad",
    "BlackRoadAsync",
    "Agent",
    "AgentStatus",
    "ChatRequest",
    "ChatResponse",
    "PolicyEvaluation",
    "PolicyResult",
    "LedgerEvent",
    "CollaborationSession",
]
