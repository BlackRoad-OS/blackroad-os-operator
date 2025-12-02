"""Policy evaluation models for BlackRoad OS governance.

These models implement the v1 governance contract:
- Four-value effect enum: allow | deny | warn | shadow_deny
- Priority-based policy resolution
- Hybrid condition model (claim_check + caller_asserts)
- Ledger level propagation

Usage:
    from br_operator.models.policy import (
        PolicyEvaluateRequest,
        PolicyEvaluateResponse,
        Policy,
    )
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PolicyEffect(str, Enum):
    """Policy decision effect.

    - allow: Proceed with action
    - deny: Block action, return error
    - warn: Allow but flag for review, emit elevated ledger event
    - shadow_deny: Allow but log as if denied (for policy testing/rollout)
    """
    ALLOW = "allow"
    DENY = "deny"
    WARN = "warn"
    SHADOW_DENY = "shadow_deny"


class LedgerLevel(str, Enum):
    """Ledger event granularity.

    - none: No logging required
    - decision: Log only the policy decision
    - action: Log decision + action metadata
    - full: Log decision + action + request context + response summary
    """
    NONE = "none"
    DECISION = "decision"
    ACTION = "action"
    FULL = "full"


class Subject(BaseModel):
    """The actor attempting an action.

    Attributes:
        user_id: Unique user identifier (null for anonymous/system)
        role: Role name (e.g., "teacher", "student", "operator")
        attributes: Additional subject attributes for policy matching
    """
    user_id: Optional[str] = None
    role: str
    attributes: Dict[str, Any] = Field(default_factory=dict)


class Resource(BaseModel):
    """The target resource of an action.

    Attributes:
        type: Resource type (e.g., "assignment", "submission")
        id: Specific resource ID (null for collection-level actions)
        attributes: Additional resource attributes for policy matching
    """
    type: str
    id: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class RequestMetadata(BaseModel):
    """Metadata about the originating request.

    Used for ledger event enrichment and cross-service correlation.
    """
    host: Optional[str] = None
    service: Optional[str] = None
    correlation_id: Optional[str] = None


class PolicyContext(BaseModel):
    """Context provided with policy evaluation requests.

    Attributes:
        claims: List of claims the subject holds (verified by caller)
        asserted_facts: Facts the caller asserts are true (logged for audit)
        fact_evidence: Evidence supporting asserted facts
        request_metadata: Request origin information
    """
    claims: List[Dict[str, Any]] = Field(default_factory=list)
    asserted_facts: List[str] = Field(default_factory=list)
    fact_evidence: Dict[str, Any] = Field(default_factory=dict)
    request_metadata: RequestMetadata = Field(default_factory=RequestMetadata)


class PolicyEvaluateRequest(BaseModel):
    """Request body for POST /policy/evaluate.

    Example:
        {
            "subject": {"user_id": "u123", "role": "student"},
            "action": "submission:submit",
            "resource": {"type": "assignment", "id": "a456"},
            "context": {
                "claims": [
                    {"type": "assignment:assignee", "resource_id": "a456", "subject_id": "u123"}
                ],
                "asserted_facts": ["is_assignment_assignee"],
                "fact_evidence": {
                    "is_assignment_assignee": {"checked_at": "2025-...", "method": "db_lookup"}
                },
                "request_metadata": {
                    "host": "edu.blackroad.io",
                    "service": "edu-web",
                    "correlation_id": "corr-789"
                }
            }
        }
    """
    subject: Subject
    action: str
    resource: Resource
    context: PolicyContext = Field(default_factory=PolicyContext)


class PolicyEvaluateResponse(BaseModel):
    """Response from POST /policy/evaluate.

    Attributes:
        decision: The policy decision (allow/deny/warn/shadow_deny)
        policy_id: ID of the policy that matched (null if default)
        policy_version: Version of the policy pack
        reason: Human-readable explanation (required for deny on compliance scopes)
        required_ledger_level: Minimum ledger level caller must emit
    """
    decision: PolicyEffect
    policy_id: Optional[str] = None
    policy_version: Optional[str] = None
    reason: Optional[str] = None
    required_ledger_level: LedgerLevel = LedgerLevel.DECISION


class PolicyCondition(BaseModel):
    """Condition block within a policy rule.

    Attributes:
        claim_check: Claim type that must exist in context.claims
        caller_asserts: Facts that caller must assert (logged for audit)
        custom: Custom condition key-value pairs for future extension
    """
    claim_check: Optional[str] = None
    caller_asserts: List[str] = Field(default_factory=list)
    custom: Dict[str, Any] = Field(default_factory=dict)


class PolicySubjectMatch(BaseModel):
    """Subject matching criteria within a policy rule."""
    role: Optional[str] = None
    user_id: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class Policy(BaseModel):
    """A single policy rule.

    Policies are evaluated in priority order (higher first).
    First matching policy determines the decision.

    Attributes:
        id: Unique policy identifier (e.g., "edu.create-assignment.teacher-only")
        description: Human-readable description
        effect: What happens when this policy matches
        priority: Evaluation order (higher = evaluated first)
        subject: Subject matching criteria
        action: Action pattern to match (supports wildcards like "edu.*")
        resource: Resource type to match (supports "*" wildcard)
        condition: Additional conditions that must be satisfied
        ledger_level: Minimum ledger level when this policy matches
        policy_version: Version string for tracking policy pack versions
    """
    id: str
    description: str = ""
    effect: PolicyEffect
    priority: int = 0
    subject: PolicySubjectMatch
    action: str
    resource: str
    condition: PolicyCondition = Field(default_factory=PolicyCondition)
    ledger_level: LedgerLevel = LedgerLevel.DECISION
    policy_version: Optional[str] = None


class PolicyPack(BaseModel):
    """A collection of policies for a scope.

    Loaded from YAML files like policies.education.yaml.
    """
    version: str
    scope: str
    default_stance: PolicyEffect = PolicyEffect.DENY
    default_ledger_level: LedgerLevel = LedgerLevel.DECISION
    policies: List[Policy] = Field(default_factory=list)
