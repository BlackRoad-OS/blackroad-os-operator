"""
Memory models for conversation history storage.

@owner Alexa Louise Amundson
@system BlackRoad OS
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ConversationTurn(BaseModel):
    """A single turn in a conversation."""

    timestamp: str = Field(..., description="ISO 8601 timestamp of the turn")
    user_message: str = Field(..., description="User's message")
    assistant_reply: str = Field(..., description="Assistant's reply")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Optional metadata")


class MemoryStoreRequest(BaseModel):
    """Request to store a conversation turn."""

    user_id: str = Field(..., min_length=1, description="User identifier")
    user_message: str = Field(..., min_length=1, description="User's message")
    assistant_reply: str = Field(..., min_length=1, description="Assistant's reply")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")


class MemoryStoreResponse(BaseModel):
    """Response from storing a conversation turn."""

    stored: bool = Field(..., description="Whether the turn was stored")
    user_id: str = Field(..., description="User identifier")
    turn_count: Optional[int] = Field(None, description="Total number of turns stored")
    max_turns: Optional[int] = Field(None, description="Maximum turns to keep")
    reason: Optional[str] = Field(None, description="Reason if not stored")


class MemoryHistoryResponse(BaseModel):
    """Response containing conversation history."""

    user_id: str = Field(..., description="User identifier")
    turns: List[ConversationTurn] = Field(..., description="Conversation turns (most recent first)")
    total_turns: int = Field(..., description="Total number of turns returned")
    enabled: bool = Field(..., description="Whether memory is enabled")


class MemoryClearResponse(BaseModel):
    """Response from clearing conversation history."""

    cleared: bool = Field(..., description="Whether the history was cleared")
    user_id: str = Field(..., description="User identifier")
    reason: Optional[str] = Field(None, description="Reason if not cleared")
    note: Optional[str] = Field(None, description="Additional notes")


class MemoryStatsResponse(BaseModel):
    """Statistics about the memory service."""

    enabled: bool = Field(..., description="Whether memory is enabled")
    total_users: int = Field(..., description="Total number of users with stored history")
    max_turns_per_user: Optional[int] = Field(None, description="Maximum turns per user")
    storage_path: Optional[str] = Field(None, description="Storage path for memory files")
    error: Optional[str] = Field(None, description="Error message if any")
