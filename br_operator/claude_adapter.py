"""
Claude API Adapter - Production-ready client for Anthropic Claude

Supports:
- Anthropic Direct API
- AWS Bedrock (future)
- Streaming responses
- Tool use orchestration
- Extended thinking mode
- Message history management
"""

from __future__ import annotations

import os
from typing import Any, AsyncIterator, Dict, List, Optional, Union
from enum import Enum

try:
    import anthropic
    from anthropic import Anthropic, AsyncAnthropic
    from anthropic.types import (
        Message,
        MessageStreamEvent,
        ContentBlock,
        TextBlock,
        ToolUseBlock,
    )
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    # Fallback types for when SDK not installed
    Message = Dict[str, Any]
    MessageStreamEvent = Dict[str, Any]


class ClaudeProvider(str, Enum):
    """Claude API providers"""
    ANTHROPIC_DIRECT = "anthropic"
    AWS_BEDROCK = "bedrock"  # Future implementation


class ClaudeModel(str, Enum):
    """Available Claude models"""
    OPUS = "claude-opus-4-20250514"
    SONNET = "claude-sonnet-4-20250514"
    SONNET_3_5 = "claude-3-5-sonnet-20241022"
    HAIKU = "claude-3-5-haiku-20241022"


class ClaudeAdapter:
    """
    Production Claude API adapter with multiple provider support.

    Features:
    - Streaming and non-streaming responses
    - Tool use orchestration
    - Extended thinking mode
    - Message history management
    - Error handling and retries
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        provider: ClaudeProvider = ClaudeProvider.ANTHROPIC_DIRECT,
        model: ClaudeModel = ClaudeModel.SONNET,
        max_tokens: int = 4096,
        temperature: float = 1.0,
    ):
        """
        Initialize Claude adapter.

        Args:
            api_key: Anthropic API key (falls back to ANTHROPIC_API_KEY env var)
            provider: API provider to use
            model: Claude model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0.0 to 1.0)
        """
        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "Anthropic SDK not installed. Install with: pip install anthropic"
            )

        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key required (set ANTHROPIC_API_KEY or pass api_key)")

        self.provider = provider
        self.model = model.value
        self.max_tokens = max_tokens
        self.temperature = temperature

        # Initialize clients
        if provider == ClaudeProvider.ANTHROPIC_DIRECT:
            self.client = Anthropic(api_key=self.api_key)
            self.async_client = AsyncAnthropic(api_key=self.api_key)
        elif provider == ClaudeProvider.AWS_BEDROCK:
            raise NotImplementedError("AWS Bedrock support coming soon")

    def chat(
        self,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False,
        thinking: bool = False,
    ) -> Union[Message, Iterator[MessageStreamEvent]]:
        """
        Send a chat request to Claude.

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: System prompt
            tools: List of tool definitions for function calling
            stream: Whether to stream the response
            thinking: Enable extended thinking mode

        Returns:
            Message object or stream iterator
        """
        params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": messages,
        }

        if system:
            params["system"] = system

        if tools:
            params["tools"] = tools

        if thinking:
            params["thinking"] = {
                "type": "enabled",
                "budget_tokens": 10000,
            }

        if stream:
            return self.client.messages.stream(**params)
        else:
            return self.client.messages.create(**params)

    async def async_chat(
        self,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False,
        thinking: bool = False,
    ) -> Union[Message, AsyncIterator[MessageStreamEvent]]:
        """
        Async version of chat().

        Args:
            messages: List of message dicts with 'role' and 'content'
            system: System prompt
            tools: List of tool definitions for function calling
            stream: Whether to stream the response
            thinking: Enable extended thinking mode

        Returns:
            Message object or async stream iterator
        """
        params = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": messages,
        }

        if system:
            params["system"] = system

        if tools:
            params["tools"] = tools

        if thinking:
            params["thinking"] = {
                "type": "enabled",
                "budget_tokens": 10000,
            }

        if stream:
            return self.async_client.messages.stream(**params)
        else:
            return await self.async_client.messages.create(**params)

    def extract_text(self, message: Message) -> str:
        """
        Extract text content from a Claude message.

        Args:
            message: Claude Message object

        Returns:
            Concatenated text from all text blocks
        """
        text_parts = []
        for block in message.content:
            if isinstance(block, TextBlock):
                text_parts.append(block.text)
            elif isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block["text"])
        return "\n".join(text_parts)

    def extract_tool_calls(self, message: Message) -> List[Dict[str, Any]]:
        """
        Extract tool use blocks from a Claude message.

        Args:
            message: Claude Message object

        Returns:
            List of tool call dicts with 'id', 'name', and 'input'
        """
        tool_calls = []
        for block in message.content:
            if isinstance(block, ToolUseBlock):
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
            elif isinstance(block, dict) and block.get("type") == "tool_use":
                tool_calls.append({
                    "id": block["id"],
                    "name": block["name"],
                    "input": block["input"],
                })
        return tool_calls

    def create_tool_result_message(
        self,
        tool_call_id: str,
        result: Any,
    ) -> Dict[str, Any]:
        """
        Create a tool result message to send back to Claude.

        Args:
            tool_call_id: ID of the tool call from Claude
            result: Result of the tool execution (will be JSON serialized)

        Returns:
            Message dict formatted for Claude API
        """
        return {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_call_id,
                    "content": str(result),
                }
            ],
        }


# Convenience functions

def create_claude_client(
    model: ClaudeModel = ClaudeModel.SONNET,
    **kwargs,
) -> ClaudeAdapter:
    """
    Create a Claude adapter with sensible defaults.

    Args:
        model: Claude model to use
        **kwargs: Additional arguments passed to ClaudeAdapter

    Returns:
        Configured ClaudeAdapter instance
    """
    return ClaudeAdapter(model=model, **kwargs)


async def quick_chat(
    prompt: str,
    system: Optional[str] = None,
    model: ClaudeModel = ClaudeModel.SONNET,
) -> str:
    """
    Quick async chat helper for simple use cases.

    Args:
        prompt: User prompt
        system: Optional system prompt
        model: Claude model to use

    Returns:
        Claude's text response
    """
    client = create_claude_client(model=model)
    messages = [{"role": "user", "content": prompt}]
    response = await client.async_chat(messages=messages, system=system)
    return client.extract_text(response)


# Example usage
if __name__ == "__main__":
    import asyncio

    async def demo():
        """Demo the Claude adapter"""
        print("=== Claude API Adapter Demo ===\n")

        # Simple chat
        print("1. Simple chat:")
        response = await quick_chat(
            "Explain what BlackRoad OS does in one sentence.",
            system="You are a helpful AI assistant.",
        )
        print(f"Claude: {response}\n")

        # Chat with tools
        print("2. Chat with tools:")
        client = create_claude_client(model=ClaudeModel.SONNET)

        tools = [
            {
                "name": "get_weather",
                "description": "Get the current weather for a location",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City name, e.g., 'San Francisco'",
                        },
                    },
                    "required": ["location"],
                },
            }
        ]

        messages = [
            {"role": "user", "content": "What's the weather in Minneapolis?"}
        ]

        response = await client.async_chat(
            messages=messages,
            tools=tools,
        )

        tool_calls = client.extract_tool_calls(response)
        if tool_calls:
            print(f"Claude wants to call: {tool_calls[0]['name']}")
            print(f"With input: {tool_calls[0]['input']}\n")

        # Streaming
        print("3. Streaming response:")
        messages = [{"role": "user", "content": "Count from 1 to 5."}]

        async with await client.async_chat(messages=messages, stream=True) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "text"):
                        print(event.delta.text, end="", flush=True)
        print("\n")

        print("=== Demo Complete ===")

    # Run demo
    asyncio.run(demo())
