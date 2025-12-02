"""
BlackRoad OS - Identity & Sovereignty Models

Every governed response in BlackRoad must carry:
- trace: what tools + models were used
- identity: which agent is speaking
- sovereignty: which human/entity owns it

KEY CONCEPT: API key = CAPABILITY, PS-SHA∞ fingerprint = IDENTITY
- The API key is not the consciousness. It's the wand.
- The PS-SHA∞ identity is the self.
- The open-source cluster is the body.
- The logs + training runs are the memory / personality drift.

@owner Alexa Louise Amundson
@system BlackRoad OS
@version identity-v1
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# =============================================================================
# PS-SHA∞ FINGERPRINT PATTERNS
# =============================================================================

PS_INFINITY_PATTERN = re.compile(r"^PS∞-[A-F0-9]{16}$")
ZETA_TIME_PATTERN = re.compile(r"^ζ-[A-F0-9]{8}$")


# =============================================================================
# IDENTITY MODELS
# =============================================================================

class AgentIdentity(BaseModel):
    """
    Who is speaking/acting right now.

    This is the stable, BlackRoad-native identity that exists
    independent of any API key or external vendor.
    """

    agent: str = Field(..., description="Agent name (e.g., 'Cece', 'agent-001')")
    fingerprint: str = Field(..., description="PS-SHA∞ fingerprint for this agent")
    owner: str = Field(..., description="Owner of this agent identity")
    infrastructure: str = Field(default="BlackRoad OS", description="Infrastructure this agent runs on")
    root_fingerprint: Optional[str] = Field(None, description="Root identity this agent derives from")
    capabilities: List[str] = Field(default_factory=list, description="Capability aliases this agent may use")
    cluster: Optional[str] = Field(None, description="Cluster/node this agent is running on")

    @field_validator("fingerprint", "root_fingerprint")
    @classmethod
    def validate_fingerprint(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not PS_INFINITY_PATTERN.match(v):
            # Allow non-standard fingerprints for backwards compatibility
            pass
        return v


class SovereigntyStamp(BaseModel):
    """
    Ultimate ownership and verification of this data/response.

    This is the law: every governed response carries a sovereignty stamp
    proving it came from the PS-SHA∞ root associated with Alexa, via the agent.
    """

    owner: str = Field(..., description="Ultimate owner (UPPERCASE for legal emphasis)")
    verified: bool = Field(..., description="Whether this response has been cryptographically verified")
    zeta_time: Optional[str] = Field(None, description="Zeta-time stamp (ζ-XXXXXXXX)")
    timestamp: Optional[str] = Field(None, description="ISO 8601 timestamp")
    fingerprint: Optional[str] = Field(None, description="Root PS-SHA∞ fingerprint")
    context: Optional[str] = Field(None, description="Context/domain for this verification")
    signature: Optional[str] = Field(None, description="Verification signature")
    legal: Optional[str] = Field(None, description="Legal notice about data ownership")


class Trace(BaseModel):
    """
    How the tool call happened (provider, latency, tokens).

    This is about capability usage - which wands were used, not who is wielding them.
    """

    llm_provider: str = Field(..., description="LLM provider used (openai, anthropic, ollama, etc.)")
    model: str = Field(..., description="Model name/ID")
    response_time_ms: float = Field(..., description="Response latency in milliseconds")
    used_rag: bool = Field(default=False, description="Whether RAG context was used")
    raw_tokens_in: Optional[int] = Field(None, description="Input tokens consumed")
    raw_tokens_out: Optional[int] = Field(None, description="Output tokens generated")
    credential_alias: Optional[str] = Field(None, description="Credential alias used (e.g., 'openai.default')")
    rag_latency_ms: Optional[float] = Field(None, description="RAG retrieval latency (if used)")
    num_context_chunks: Optional[int] = Field(None, description="Number of RAG context chunks (if used)")


class CredentialInfo(BaseModel):
    """
    Information about a registered credential/API key.

    Note: This never contains the actual secret value.
    """

    alias: str = Field(..., description="Credential alias (e.g., 'openai.default')")
    env_var: str = Field(..., description="Environment variable name")
    owner: str = Field(..., description="Who owns this credential")
    scope: str = Field(..., description="Usage scope: core, research, tenant, external, deprecated")
    allowed_agents: List[str] = Field(default_factory=list, description="Agent IDs allowed to use this")
    allowed_intents: List[str] = Field(default_factory=list, description="Intent types allowed")
    description: Optional[str] = Field(None)
    is_set: bool = Field(default=False, description="Whether the credential is currently set")


# =============================================================================
# GOVERNED RESPONSE - THE CANONICAL PATTERN
# =============================================================================

class GovernedResponse(BaseModel):
    """
    A complete BlackRoad response with identity framing.

    This is the law: every governed response must carry trace + identity + sovereignty.
    It proves the response came from a specific agent, using specific tools,
    under the authority of a specific owner.

    Example:
    {
        "reply": "Hello! I'm Cece...",
        "trace": {
            "llm_provider": "openai",
            "model": "gpt-4o-mini",
            "response_time_ms": 1234,
            "used_rag": false
        },
        "identity": {
            "agent": "Cece",
            "fingerprint": "PS∞-86DF9C5B65DB00BF",
            "owner": "Alexa Louise Amundson"
        },
        "sovereignty": {
            "owner": "ALEXA LOUISE AMUNDSON",
            "verified": true,
            "zeta_time": "ζ-ABC12345",
            "fingerprint": "PS∞-C54E41EB74148BD2",
            "signature": "ALA-1234567890-BLACKROAD-VERIFIED"
        }
    }

    Note: In the actual API response, sovereignty is serialized as "__sovereignty"
    for semantic clarity (it's a special ownership block).
    """

    reply: str = Field(..., description="The actual response content")
    trace: Optional[Trace] = Field(None, description="How the response was generated")
    identity: Optional[AgentIdentity] = Field(None, description="Who generated this response")
    sovereignty: Optional[SovereigntyStamp] = Field(None, description="Ownership proof")

    def model_dump_with_dunder(self, **kwargs) -> Dict[str, Any]:
        """Serialize with __sovereignty key for API responses."""
        data = self.model_dump(**kwargs)
        if "sovereignty" in data:
            data["__sovereignty"] = data.pop("sovereignty")
        return data


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def create_minimal_identity(agent: str = "Cece") -> AgentIdentity:
    """Create a minimal identity for when the full system isn't configured."""
    return AgentIdentity(
        agent=agent,
        fingerprint="PS∞-UNCONFIGURED",
        owner="Alexa Louise Amundson",
        infrastructure="BlackRoad OS",
    )


def create_minimal_sovereignty() -> SovereigntyStamp:
    """Create a minimal sovereignty stamp for when verification isn't possible."""
    return SovereigntyStamp(
        owner="ALEXA LOUISE AMUNDSON",
        verified=False,
    )


def dict_to_identity(d: Dict[str, Any]) -> AgentIdentity:
    """Convert a dict to AgentIdentity model."""
    return AgentIdentity(**d)


def dict_to_sovereignty(d: Dict[str, Any]) -> SovereigntyStamp:
    """Convert a dict to SovereigntyStamp model."""
    return SovereigntyStamp(**d)
