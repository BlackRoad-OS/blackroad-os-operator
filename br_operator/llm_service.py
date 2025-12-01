"""
LLM Service - Handles communication with Ollama/GPT-OSS Model
Hero Flow #1 for BlackRoad OS Operator Engine
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import httpx

# Configuration from environment
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://gpt-oss-model.railway.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
RAG_API_URL = os.getenv("RAG_API_URL", "http://rag-api.railway.internal:8000")

DEFAULT_SYSTEM_PROMPT = """You are Cece, the AI assistant for BlackRoad OS - an intelligent operating system that orchestrates AI agents, workflows, and infrastructure.

You are helpful, concise, and technically capable. When users ask about the system, explain what you can see and do within the Operator Engine.

Current capabilities:
- Chat with users through the Operator Engine
- Access to RAG API for context retrieval (coming soon)
- Orchestrate background jobs and workflows

Respond in a friendly but professional manner."""


async def generate_chat_response(
    message: str,
    user_id: Optional[str] = None,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a response from the LLM."""
    start_time = time.time()

    model = model or OLLAMA_MODEL
    system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT

    full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": full_prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()

            response_time_ms = int((time.time() - start_time) * 1000)

            return {
                "reply": data.get("response", "").strip(),
                "trace": {
                    "llm_provider": LLM_PROVIDER,
                    "model": data.get("model", model),
                    "used_rag": False,
                    "response_time_ms": response_time_ms,
                },
            }
    except httpx.HTTPError as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        raise RuntimeError(f"LLM API error: {e}") from e


async def check_llm_health() -> Dict[str, Any]:
    """Check if Ollama is healthy and has models available."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            data = response.json()

            models = [m.get("name", "") for m in data.get("models", [])]

            return {
                "healthy": True,
                "models": models,
                "provider": LLM_PROVIDER,
                "configured_model": OLLAMA_MODEL,
                "ollama_url": OLLAMA_URL,
            }
    except Exception as e:
        return {
            "healthy": False,
            "models": [],
            "provider": LLM_PROVIDER,
            "configured_model": OLLAMA_MODEL,
            "ollama_url": OLLAMA_URL,
            "error": str(e),
        }
