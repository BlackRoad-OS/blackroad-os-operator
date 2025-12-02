# BlackRoad OS Python SDK - Models
#
# @blackroad_name: SDK Models
# @operator: alexa.operator.v1

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================
# ENUMS
# ============================================

class AgentStatus(str, Enum):
    INITIALIZING = "initializing"
    READY = "ready"
    BUSY = "busy"
    PAUSED = "paused"
    ERROR = "error"
    TERMINATED = "terminated"


class AgentType(str, Enum):
    LUCIDIA = "lucidia"
    BEACON = "beacon"
    CUSTOM = "custom"
    PACK = "pack"


class PolicyEffect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    ESCALATE = "escalate"


class TrinaryValue(int, Enum):
    DENY = -1
    NEUTRAL = 0
    ALLOW = 1


class SessionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSING = "closing"
    CLOSED = "closed"


class ParticipantRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    OBSERVER = "observer"


# ============================================
# AGENT MODELS
# ============================================

class Agent(BaseModel):
    """An AI agent in BlackRoad OS."""

    id: str
    name: str
    type: AgentType = AgentType.CUSTOM
    status: AgentStatus = AgentStatus.READY
    config: Dict[str, Any] = Field(default_factory=dict)
    capabilities: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AgentInvocation(BaseModel):
    """Agent invocation request."""

    input: str | Dict[str, Any]
    context: Dict[str, Any] = Field(default_factory=dict)
    tools: List[str] = Field(default_factory=list)
    max_tokens: int = 4096
    timeout_ms: int = 60000


class AgentResponse(BaseModel):
    """Agent invocation response."""

    output: str | Dict[str, Any]
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    usage: Dict[str, int] = Field(default_factory=dict)


# ============================================
# CHAT MODELS
# ============================================

class ChatRequest(BaseModel):
    """Chat request."""

    message: str
    userId: Optional[str] = None
    model: Optional[str] = None
    use_rag: bool = True


class ChatResponse(BaseModel):
    """Chat response."""

    response: str
    model: str
    tokens_used: int = 0
    rag_context_used: bool = False
    sources: List[Dict[str, Any]] = Field(default_factory=list)


# ============================================
# GOVERNANCE MODELS
# ============================================

class Subject(BaseModel):
    """Policy subject (actor)."""

    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    role: str = "user"
    attributes: Dict[str, Any] = Field(default_factory=dict)


class Resource(BaseModel):
    """Policy resource (target)."""

    type: str
    id: str
    attributes: Dict[str, Any] = Field(default_factory=dict)


class PolicyContext(BaseModel):
    """Policy evaluation context."""

    claims: List[Dict[str, Any]] = Field(default_factory=list)
    asserted_facts: List[str] = Field(default_factory=list)
    fact_evidence: Dict[str, Any] = Field(default_factory=dict)


class PolicyEvaluation(BaseModel):
    """Policy evaluation request."""

    action: str
    subject: Subject
    resource: Resource
    context: PolicyContext = Field(default_factory=PolicyContext)


class PolicyResult(BaseModel):
    """Policy evaluation result."""

    decision: PolicyEffect
    trinary_value: TrinaryValue
    policy_id: str
    policy_version: str
    reason: Optional[str] = None
    matched_policies: List[str] = Field(default_factory=list)
    audit_id: Optional[str] = None


class Constraint(BaseModel):
    """Runtime constraint."""

    id: str
    type: str
    expression: str
    priority: int = 0
    active: bool = True


# ============================================
# LEDGER MODELS
# ============================================

class LedgerEvent(BaseModel):
    """Immutable ledger event."""

    id: str
    type: str
    entity_id: str
    action: str
    decision: TrinaryValue
    context: Dict[str, Any] = Field(default_factory=dict)
    ps_sha: str  # PS-SHA∞ hash
    parent_ps_sha: Optional[str] = None
    timestamp: datetime


class LedgerLineage(BaseModel):
    """Lineage trace for PS-SHA∞."""

    root_hash: str
    entries: List[Dict[str, Any]]
    contradictions: List[Dict[str, Any]] = Field(default_factory=list)
    total_depth: int


# ============================================
# COLLABORATION MODELS
# ============================================

class VectorClock(BaseModel):
    """Vector clock for causal ordering."""

    clock: Dict[str, int] = Field(default_factory=dict)


class Participant(BaseModel):
    """Session participant."""

    id: str
    session_id: str
    entity_id: str
    entity_type: str = "agent"
    role: ParticipantRole = ParticipantRole.EDITOR
    shard_id: Optional[str] = None
    joined_at: datetime


class CollaborationSession(BaseModel):
    """Collaboration session for 30K concurrent."""

    id: str
    name: str
    status: SessionStatus = SessionStatus.ACTIVE
    crdt_type: str = "rga"
    participant_count: int = 0
    max_participants: int = 30000
    vector_clock: VectorClock = Field(default_factory=VectorClock)
    assigned_shards: List[str] = Field(default_factory=list)
    primary_shard: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CRDTOperation(BaseModel):
    """CRDT operation."""

    type: str  # insert, delete, set, etc.
    path: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    vector_clock: VectorClock = Field(default_factory=VectorClock)
    participant_id: str


class Shard(BaseModel):
    """Collaboration shard."""

    id: str
    capacity: int = 1000
    participant_count: int = 0
    load_percentage: float = 0.0
    status: str = "healthy"


__all__ = [
    # Enums
    "AgentStatus",
    "AgentType",
    "PolicyEffect",
    "TrinaryValue",
    "SessionStatus",
    "ParticipantRole",
    # Agent models
    "Agent",
    "AgentInvocation",
    "AgentResponse",
    # Chat models
    "ChatRequest",
    "ChatResponse",
    # Governance models
    "Subject",
    "Resource",
    "PolicyContext",
    "PolicyEvaluation",
    "PolicyResult",
    "Constraint",
    # Ledger models
    "LedgerEvent",
    "LedgerLineage",
    # Collaboration models
    "VectorClock",
    "Participant",
    "CollaborationSession",
    "CRDTOperation",
    "Shard",
]
