"""
LLM Service - Handles communication with Ollama/GPT-OSS Model
Hero Flow #1 & #2 for BlackRoad OS Operator Engine

Hero Flow #1: User → Operator → GPT-OSS Model → Response
Hero Flow #2: User → Operator → RAG API → GPT-OSS Model → Response
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional

import httpx

# =============================================================================
# Configuration from environment
# =============================================================================
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://gpt-oss-model.railway.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

# RAG API configuration
# Expected contract (standard FastAPI RAG pattern):
#   POST /query
#   Request:  {"query": "string", "top_k": 5}
#   Response: {"results": [{"content": "...", "score": 0.95, "metadata": {...}}, ...]}
RAG_API_URL = os.getenv("RAG_API_URL", "http://rag-api.railway.internal:8000")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "3"))
RAG_TIMEOUT_SECONDS = float(os.getenv("RAG_TIMEOUT_SECONDS", "10.0"))

# =============================================================================
# System prompts
# =============================================================================
DEFAULT_SYSTEM_PROMPT = """You are Cece, the AI assistant for BlackRoad OS - an intelligent operating system that orchestrates AI agents, workflows, and infrastructure.

You are helpful, concise, and technically capable. When users ask about the system, explain what you can see and do within the Operator Engine.

Current capabilities:
- Chat with users through the Operator Engine
- Access to RAG API for context retrieval
- Orchestrate background jobs and workflows

Respond in a friendly but professional manner."""

RAG_SYSTEM_PROMPT = """You are Cece, the AI assistant for BlackRoad OS - an intelligent operating system that orchestrates AI agents, workflows, and infrastructure.

You have been provided with relevant context from the BlackRoad knowledge base below. Use this context to inform your response, but:
- If the context doesn't contain the answer, say so honestly
- Don't make up information that isn't in the context
- Cite the context when relevant

CONTEXT:
{context}

---

Now respond to the user's question. Be helpful, concise, and technically capable."""


async def fetch_rag_context(
    query: str,
    top_k: int = RAG_TOP_K,
) -> tuple[List[str], int]:
    """
    Fetch relevant context from the RAG API.

    Returns:
        tuple: (list of context strings, latency in ms)

    Raises:
        Exception: If RAG API is unreachable or returns an error
    """
    start_time = time.time()

    async with httpx.AsyncClient(timeout=RAG_TIMEOUT_SECONDS) as client:
        response = await client.post(
            f"{RAG_API_URL}/query",
            json={
                "query": query,
                "top_k": top_k,
            },
        )
        response.raise_for_status()
        data = response.json()

        latency_ms = int((time.time() - start_time) * 1000)

        # Extract content from results
        # Expected: {"results": [{"content": "...", "score": ..., "metadata": {...}}, ...]}
        results = data.get("results", [])
        context_chunks = [r.get("content", "") for r in results if r.get("content")]

        return context_chunks, latency_ms


async def generate_chat_response(
    message: str,
    user_id: Optional[str] = None,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    use_rag: bool = True,
) -> Dict[str, Any]:
    """
    Generate a response from the LLM, optionally with RAG context.

    Hero Flow #1 (use_rag=False): Direct LLM call
    Hero Flow #2 (use_rag=True):  RAG context → LLM call

    If RAG fails, gracefully falls back to Hero Flow #1.
    """
    start_time = time.time()

    model = model or OLLAMA_MODEL

    # Track RAG state
    used_rag = False
    rag_latency_ms: Optional[int] = None
    num_context_chunks: Optional[int] = None
    context_chunks: List[str] = []

    # Attempt RAG if enabled
    if use_rag:
        try:
            context_chunks, rag_latency_ms = await fetch_rag_context(message)
            if context_chunks:
                used_rag = True
                num_context_chunks = len(context_chunks)
        except Exception:
            # RAG failed - fall back to non-RAG mode silently
            # In production, we might want to log this
            pass

    # Build the prompt
    if used_rag and context_chunks:
        # Hero Flow #2: Use RAG-enhanced prompt
        context_text = "\n\n---\n\n".join(context_chunks)
        effective_system_prompt = RAG_SYSTEM_PROMPT.format(context=context_text)
    else:
        # Hero Flow #1: Use default prompt
        effective_system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT

    full_prompt = f"{effective_system_prompt}\n\nUser: {message}\n\nAssistant:"

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

            trace: Dict[str, Any] = {
                "llm_provider": LLM_PROVIDER,
                "model": data.get("model", model),
                "used_rag": used_rag,
                "response_time_ms": response_time_ms,
            }

            # Add RAG-specific trace fields when RAG was used
            if used_rag:
                trace["rag_latency_ms"] = rag_latency_ms
                trace["num_context_chunks"] = num_context_chunks

            return {
                "reply": data.get("response", "").strip(),
                "trace": trace,
            }
    except httpx.HTTPError as e:
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


async def check_rag_health() -> Dict[str, Any]:
    """Check if RAG API is healthy and reachable."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{RAG_API_URL}/health")
            response.raise_for_status()

            return {
                "healthy": True,
                "rag_api_url": RAG_API_URL,
                "top_k": RAG_TOP_K,
            }
    except Exception as e:
        return {
            "healthy": False,
            "rag_api_url": RAG_API_URL,
            "top_k": RAG_TOP_K,
            "error": str(e),
        }
