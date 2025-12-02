#!/usr/bin/env python3
"""Lucidia Ollama MCP Server

Exposes local Ollama LLM to Claude via MCP protocol.
Only allow-listed models can be used.

Environment Variables:
    OLLAMA_URL: Ollama API endpoint (default: http://127.0.0.1:11434)
    LUCIDIA_OLLAMA_MODELS: Comma-separated model allowlist
    LUCIDIA_OLLAMA_TIMEOUT: Request timeout in seconds (default: 30)

Part of BlackRoad OS MCP infrastructure.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

try:
    import requests
    session = requests.Session()
except ImportError:
    requests = None
    session = None

try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None

# Configuration
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL_ALLOWLIST = set(
    os.environ.get(
        "LUCIDIA_OLLAMA_MODELS",
        "llama3.2:latest,phi3:latest,mistral:instruct,codellama:latest"
    ).split(",")
)
TIMEOUT = float(os.environ.get("LUCIDIA_OLLAMA_TIMEOUT", "60"))

# Initialize server
server = Server("lucidia-ollama") if Server else None


def _check_model(model: str) -> None:
    """Validate model against allowlist."""
    if model not in MODEL_ALLOWLIST:
        allowed = ", ".join(sorted(MODEL_ALLOWLIST))
        raise ValueError(f"Model '{model}' not allowed. Allowed: {allowed}")


def _post(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Make POST request to Ollama API."""
    if session is None:
        raise RuntimeError("requests library not installed")
    url = f"{OLLAMA_URL}/{endpoint}"
    response = session.post(url, json=payload, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def _list_models() -> List[str]:
    """List available models from Ollama."""
    if session is None:
        return list(MODEL_ALLOWLIST)
    try:
        url = f"{OLLAMA_URL}/api/tags"
        response = session.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        available = [m.get("name", "") for m in data.get("models", [])]
        return [m for m in available if m in MODEL_ALLOWLIST]
    except Exception:
        return list(MODEL_ALLOWLIST)


if server:

    @server.tool()
    def generate(model: str, prompt: str, temperature: float = 0.7) -> str:
        """Generate text from a prompt using a local LLM.

        Args:
            model: Model name (must be in allowlist)
            prompt: The prompt to generate from
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            Generated text response
        """
        _check_model(model)
        data = _post("api/generate", {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        })
        return data.get("response", "")

    @server.tool()
    def chat(model: str, messages: List[Dict[str, str]]) -> str:
        """Chat with a local LLM using message history.

        Args:
            model: Model name (must be in allowlist)
            messages: List of {"role": "user"|"assistant", "content": "..."}

        Returns:
            Assistant's response
        """
        _check_model(model)
        data = _post("api/chat", {
            "model": model,
            "messages": messages,
            "stream": False
        })
        msg = data.get("message", {})
        return msg.get("content", "")

    @server.tool()
    def embed(model: str, text: str) -> List[float]:
        """Generate embedding vector for text.

        Args:
            model: Model name (must be in allowlist)
            text: Text to embed

        Returns:
            Embedding vector as list of floats
        """
        _check_model(model)
        data = _post("api/embed", {"model": model, "input": text})
        return data.get("embedding", [])

    @server.tool()
    def complete_code(model: str, code: str, language: str = "python") -> str:
        """Complete code snippet using local LLM.

        Args:
            model: Model name (must be in allowlist)
            code: Code to complete
            language: Programming language

        Returns:
            Code completion
        """
        _check_model(model)
        prompt = f"```{language}\n{code}"
        data = _post("api/generate", {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.0, "num_predict": 512}
        })
        return data.get("response", "")

    @server.tool()
    def list_available_models() -> List[str]:
        """List models available for use.

        Returns:
            List of model names that are both installed and allowed
        """
        return _list_models()


def main() -> None:
    """Run the MCP server."""
    if not server:
        raise RuntimeError("mcp package not installed: pip install mcp")
    server.run()


if __name__ == "__main__":
    main()
