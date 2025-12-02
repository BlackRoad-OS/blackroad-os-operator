"""Ledger event models for BlackRoad OS governance.

These models define the canonical schema for ledger_events,
implementing the v1 governance contract.

Usage:
    from br_operator.models.ledger import LedgerEventCreate, LedgerEvent
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Layer(str, Enum):
    """System layer where the event originated."""
    EXPERIENCE = "experience"
    GATEWAY = "gateway"
    GOVERNANCE = "governance"
    MESH = "mesh"
    INFRA = "infra"


class LedgerDecision(str, Enum):
    """Policy decision recorded in ledger."""
    ALLOW = "allow"
    DENY = "deny"
    WARN = "warn"
    SHADOW_DENY = "shadow_deny"


class LedgerLevel(str, Enum):
    """Granularity of ledger event."""
    NONE = "none"
    DECISION = "decision"
    ACTION = "action"
    FULL = "full"


class LedgerActor(BaseModel):
    """Actor information for ledger events.

    Supports both human users and agent actors.
    """
    user_id: Optional[str] = None
    role: Optional[str] = None
    agent_id: Optional[str] = None
    delegation_id: Optional[UUID] = None


class LedgerEventCreate(BaseModel):
    """Request body for POST /ledger/event.

    This is what callers send to create a ledger entry.

    Example:
        {
            "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
            "layer": "experience",
            "host": "edu.blackroad.io",
            "service": "edu-web",
            "policy_scope": "edu.*",
            "actor": {
                "user_id": "u123",
                "role": "teacher"
            },
            "action": "assignment:create",
            "resource_type": "assignment",
            "resource_id": "a456",
            "decision": "allow",
            "policy_id": "edu.create-assignment.teacher-only",
            "policy_version": "edu-v1",
            "ledger_level": "action",
            "metadata": {
                "assignment_title": "Week 1 Homework"
            }
        }
    """
    # Identity
    correlation_id: UUID
    intent_id: Optional[UUID] = None
    sequence_num: int = 0

    # Location
    layer: Layer
    host: str
    service: str
    policy_scope: str

    # Actor
    actor: LedgerActor

    # Action
    action: str
    resource_type: str
    resource_id: Optional[str] = None

    # Decision
    decision: LedgerDecision
    policy_id: Optional[str] = None
    policy_version: Optional[str] = None

    # Evidence
    asserted_facts: List[str] = Field(default_factory=list)
    fact_evidence: Dict[str, Any] = Field(default_factory=dict)
    claims: List[Dict[str, Any]] = Field(default_factory=list)

    # Metadata
    ledger_level: LedgerLevel
    metadata: Dict[str, Any] = Field(default_factory=dict)
    request_context: Optional[Dict[str, Any]] = None
    response_summary: Optional[Dict[str, Any]] = None

    # Timestamps (optional - server will set if not provided)
    occurred_at: Optional[datetime] = None


class LedgerEvent(LedgerEventCreate):
    """Full ledger event as stored in database.

    Extends LedgerEventCreate with server-assigned fields.
    """
    id: UUID
    recorded_at: datetime


class LedgerEventQuery(BaseModel):
    """Query parameters for ledger event search."""
    correlation_id: Optional[UUID] = None
    intent_id: Optional[UUID] = None
    actor_user_id: Optional[str] = None
    actor_agent_id: Optional[str] = None
    action: Optional[str] = None
    policy_scope: Optional[str] = None
    decision: Optional[LedgerDecision] = None
    host: Optional[str] = None
    service: Optional[str] = None

    # Time range
    occurred_after: Optional[datetime] = None
    occurred_before: Optional[datetime] = None

    # Pagination
    limit: int = Field(default=100, le=1000)
    offset: int = 0


class LedgerEventList(BaseModel):
    """Response for ledger event list queries."""
    events: List[LedgerEvent]
    total: int
    limit: int
    offset: int
