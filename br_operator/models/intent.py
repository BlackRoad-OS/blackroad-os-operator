"""Intent models for Stage 3 multi-step governance.

@amundson 0.1.0
@governor alice.governor.v1
@operator alexa.operator.v1
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================
# ENUMS
# ============================================

class IntentState(str, Enum):
    """State of an intent."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"


class StepStatus(str, Enum):
    """Status of an intent step."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ROLLED_BACK = "rolled_back"


class IntentEventType(str, Enum):
    """Types of intent events."""
    CREATED = "created"
    STARTED = "started"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    STEP_RETRIED = "step_retried"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLBACK_STARTED = "rollback_started"
    ROLLBACK_COMPLETED = "rollback_completed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"


# ============================================
# INTENT TEMPLATES
# ============================================

class StepDefinition(BaseModel):
    """Definition of a step in an intent template."""
    sequence: int
    action: str
    name: str
    required: bool = True
    requires_role: Optional[str] = None
    timeout_seconds: Optional[int] = None
    retry_config: Optional[Dict[str, Any]] = None


class IntentTemplate(BaseModel):
    """Template defining a valid intent workflow."""
    id: Optional[UUID] = None
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None
    template_type: str
    steps: List[StepDefinition]
    policy_scope: str
    required_role: Optional[str] = None
    rollback_enabled: bool = True
    rollback_on_failure: List[str] = Field(default_factory=list)
    timeout_seconds: int = 1800  # 30 minutes
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class IntentTemplateCreate(BaseModel):
    """Request to create an intent template."""
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None
    template_type: str
    steps: List[StepDefinition]
    policy_scope: str
    required_role: Optional[str] = None
    rollback_enabled: bool = True
    rollback_on_failure: List[str] = Field(default_factory=list)
    timeout_seconds: int = 1800


# ============================================
# INTENT STEPS
# ============================================

class IntentStep(BaseModel):
    """A step within an intent."""
    id: Optional[UUID] = None
    intent_id: UUID
    sequence_num: int
    action: str
    name: Optional[str] = None
    status: StepStatus = StepStatus.PENDING

    # Executor
    executed_by_user_id: Optional[str] = None
    executed_by_agent_id: Optional[str] = None
    executed_by_role: Optional[str] = None

    # Policy
    policy_decision: Optional[str] = None
    policy_id: Optional[str] = None
    ledger_event_id: Optional[UUID] = None

    # Data
    input: Dict[str, Any] = Field(default_factory=dict)
    output: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    # Timing
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Retry
    attempt_count: int = 0
    max_attempts: int = 3


class StepExecuteRequest(BaseModel):
    """Request to execute a step."""
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    role: str
    input: Dict[str, Any] = Field(default_factory=dict)


class StepExecuteResponse(BaseModel):
    """Response from step execution."""
    step_id: UUID
    intent_id: UUID
    sequence_num: int
    action: str
    status: StepStatus
    policy_decision: str
    policy_id: Optional[str] = None
    output: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    ledger_event_id: Optional[UUID] = None
    next_step: Optional[Dict[str, Any]] = None


# ============================================
# INTENTS
# ============================================

class IntentActor(BaseModel):
    """Actor who created/participates in an intent."""
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    role: str


class Intent(BaseModel):
    """An active intent instance."""
    id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    template_name: str
    template_version: str = "1.0.0"

    # State
    state: IntentState = IntentState.PENDING
    current_step: int = 0

    # Actor
    created_by_user_id: Optional[str] = None
    created_by_agent_id: Optional[str] = None
    created_by_role: str

    # Correlation
    correlation_id: Optional[UUID] = None
    parent_intent_id: Optional[UUID] = None

    # Data
    context: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    # Governance
    policy_scope: str

    # Timing
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeout_at: Optional[datetime] = None

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

    # Steps (populated on detail fetch)
    steps: List[IntentStep] = Field(default_factory=list)


class IntentCreate(BaseModel):
    """Request to create an intent."""
    template_name: str
    template_version: Optional[str] = None

    # Actor
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    role: str

    # Context
    context: Dict[str, Any] = Field(default_factory=dict)
    parent_intent_id: Optional[UUID] = None

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IntentResponse(BaseModel):
    """Response from intent creation/query."""
    id: UUID
    template_name: str
    state: IntentState
    current_step: int
    total_steps: int
    correlation_id: UUID
    created_by_role: str
    created_at: datetime
    started_at: Optional[datetime] = None
    timeout_at: Optional[datetime] = None
    policy_scope: str
    steps: List[IntentStep] = Field(default_factory=list)
    next_step: Optional[Dict[str, Any]] = None


# ============================================
# INTENT EVENTS
# ============================================

class IntentEvent(BaseModel):
    """An event in the intent audit trail."""
    id: Optional[UUID] = None
    intent_id: UUID
    step_id: Optional[UUID] = None
    ledger_event_id: Optional[UUID] = None

    event_type: IntentEventType

    actor_user_id: Optional[str] = None
    actor_agent_id: Optional[str] = None
    actor_role: Optional[str] = None

    previous_state: Optional[IntentState] = None
    new_state: Optional[IntentState] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

    occurred_at: Optional[datetime] = None
    correlation_id: Optional[UUID] = None


# ============================================
# QUERY & LIST
# ============================================

class IntentQuery(BaseModel):
    """Query parameters for intent listing."""
    state: Optional[IntentState] = None
    template_name: Optional[str] = None
    created_by_user_id: Optional[str] = None
    created_by_agent_id: Optional[str] = None
    correlation_id: Optional[UUID] = None
    parent_intent_id: Optional[UUID] = None
    limit: int = 100
    offset: int = 0


class IntentList(BaseModel):
    """List of intents."""
    intents: List[Intent]
    total: int
    limit: int
    offset: int


class IntentAuditTrail(BaseModel):
    """Full audit trail for an intent."""
    intent_id: UUID
    template_name: str
    state: IntentState
    events: List[IntentEvent]
    steps: List[IntentStep]
    ledger_event_ids: List[UUID] = Field(default_factory=list)
