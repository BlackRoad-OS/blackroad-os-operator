"""
Pydantic models for BlackRoad OS Operator API.
Hero Flow #1 request/response contracts.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request model for POST /chat endpoint."""

    message: str = Field(..., min_length=1, description="The user's message to Cece")
    userId: Optional[str] = Field(None, description="Optional user identifier for context")
    model: Optional[str] = Field(None, description="Override the default LLM model")


class ChatTrace(BaseModel):
    """Trace metadata returned with chat responses."""

    llm_provider: str = Field(..., description="LLM provider used (e.g., 'ollama')")
    model: str = Field(..., description="Model name used for generation")
    used_rag: bool = Field(..., description="Whether RAG context was retrieved")
    response_time_ms: int = Field(..., description="Total response time in milliseconds")
    rag_latency_ms: Optional[int] = Field(None, description="RAG API latency in ms (when used)")
    num_context_chunks: Optional[int] = Field(None, description="Number of context chunks retrieved")


class ChatResponse(BaseModel):
    """Response model for POST /chat endpoint."""

    reply: str = Field(..., description="Cece's response message")
    trace: ChatTrace = Field(..., description="Request trace metadata")


class LLMHealthResponse(BaseModel):
    """Response model for GET /llm/health endpoint."""

    healthy: bool
    models: list[str]
    provider: str
    configured_model: str
    ollama_url: str
    error: Optional[str] = None


class RAGHealthResponse(BaseModel):
    """Response model for GET /rag/health endpoint."""

    healthy: bool
    rag_api_url: str
    top_k: int
    error: Optional[str] = None
