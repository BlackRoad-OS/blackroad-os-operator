"""BlackRoad OS Operator models package.

Every governed response carries:
- trace: what tools + models were used (capability layer)
- identity: which agent is speaking (identity layer)
- sovereignty: which human/entity owns it (ownership layer)

@owner Alexa Louise Amundson
@system BlackRoad OS
"""

# Chat models (Hero Flow #1)
from br_operator.models.chat import (
    ChatRequest,
    ChatResponse,
    ChatTrace,
    ChatIdentity,
    ChatSovereignty,
    LLMHealthResponse,
    RAGHealthResponse,
)

# Identity models (PS-SHA∞ core)
from br_operator.models.identity import (
    AgentIdentity,
    SovereigntyStamp,
    Trace,
    CredentialInfo,
    GovernedResponse,
    create_minimal_identity,
    create_minimal_sovereignty,
)

# Policy models (Governance)
from br_operator.models.policy import (
    Subject,
    Resource,
    RequestMetadata,
    PolicyContext,
    PolicyEvaluateRequest,
    PolicyEvaluateResponse,
    Policy,
    PolicyEffect,
    LedgerLevel,
)

# Ledger models (Audit)
from br_operator.models.ledger import (
    LedgerEvent,
    LedgerEventCreate,
    LedgerActor,
    LedgerDecision,
    Layer,
)

# Intent models (Stage 3)
from br_operator.models.intent import (
    Intent,
    IntentCreate,
    IntentResponse,
    IntentState,
    IntentStep,
    IntentTemplate,
    IntentEvent,
    IntentEventType,
    IntentQuery,
    IntentList,
    StepStatus,
    StepDefinition,
    StepExecuteRequest,
    StepExecuteResponse,
)

# Memory models
from br_operator.models.memory import (
    ConversationTurn,
    MemoryStoreRequest,
    MemoryStoreResponse,
    MemoryHistoryResponse,
    MemoryClearResponse,
    MemoryStatsResponse,
)

__all__ = [
    # Chat models
    "ChatRequest",
    "ChatResponse",
    "ChatTrace",
    "ChatIdentity",
    "ChatSovereignty",
    "LLMHealthResponse",
    "RAGHealthResponse",
    # Identity models (PS-SHA∞ core)
    "AgentIdentity",
    "SovereigntyStamp",
    "Trace",
    "CredentialInfo",
    "GovernedResponse",
    "create_minimal_identity",
    "create_minimal_sovereignty",
    # Policy models
    "Subject",
    "Resource",
    "RequestMetadata",
    "PolicyContext",
    "PolicyEvaluateRequest",
    "PolicyEvaluateResponse",
    "Policy",
    "PolicyEffect",
    "LedgerLevel",
    # Ledger models
    "LedgerEvent",
    "LedgerEventCreate",
    "LedgerActor",
    "LedgerDecision",
    "Layer",
    # Intent models
    "Intent",
    "IntentCreate",
    "IntentResponse",
    "IntentState",
    "IntentStep",
    "IntentTemplate",
    "IntentEvent",
    "IntentEventType",
    "IntentQuery",
    "IntentList",
    "StepStatus",
    "StepDefinition",
    "StepExecuteRequest",
    "StepExecuteResponse",
    # Memory models
    "ConversationTurn",
    "MemoryStoreRequest",
    "MemoryStoreResponse",
    "MemoryHistoryResponse",
    "MemoryClearResponse",
    "MemoryStatsResponse",
]
