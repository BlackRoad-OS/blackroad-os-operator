"""
Tests for Claude API Adapter

Note: These tests require ANTHROPIC_API_KEY environment variable.
They will be skipped if the key is not set or anthropic SDK is not installed.
"""

from __future__ import annotations

import os
import pytest
from typing import Dict, Any

# Try to import Claude adapter
try:
    from br_operator.claude_adapter import (
        ClaudeAdapter,
        ClaudeModel,
        ClaudeProvider,
        create_claude_client,
        ANTHROPIC_AVAILABLE,
    )
    ADAPTER_AVAILABLE = True
except ImportError:
    ADAPTER_AVAILABLE = False


# Skip all tests if adapter or API key not available
pytestmark = pytest.mark.skipif(
    not ADAPTER_AVAILABLE or not os.getenv("ANTHROPIC_API_KEY"),
    reason="Claude adapter or API key not available"
)


def test_adapter_initialization():
    """Test that Claude adapter initializes correctly"""
    adapter = ClaudeAdapter(model=ClaudeModel.SONNET)
    assert adapter.model == "claude-sonnet-4-20250514"
    assert adapter.provider == ClaudeProvider.ANTHROPIC_DIRECT
    assert adapter.max_tokens == 4096


def test_adapter_requires_api_key():
    """Test that adapter requires an API key"""
    # Temporarily remove API key
    original_key = os.environ.get("ANTHROPIC_API_KEY")
    if original_key:
        del os.environ["ANTHROPIC_API_KEY"]

    with pytest.raises(ValueError, match="API key required"):
        ClaudeAdapter(api_key=None)

    # Restore key
    if original_key:
        os.environ["ANTHROPIC_API_KEY"] = original_key


def test_create_tool_result_message():
    """Test creating a tool result message"""
    adapter = create_claude_client()

    result_msg = adapter.create_tool_result_message(
        tool_call_id="toolu_123",
        result={"temperature": 72, "conditions": "sunny"}
    )

    assert result_msg["role"] == "user"
    assert len(result_msg["content"]) == 1
    assert result_msg["content"][0]["type"] == "tool_result"
    assert result_msg["content"][0]["tool_use_id"] == "toolu_123"


def test_extract_text_from_dict():
    """Test extracting text from a message dict"""
    adapter = create_claude_client()

    # Mock message as dict
    mock_message = type('Message', (), {
        'content': [
            {"type": "text", "text": "Hello "},
            {"type": "text", "text": "world!"}
        ]
    })()

    text = adapter.extract_text(mock_message)
    assert text == "Hello \nworld!"


def test_extract_tool_calls_from_dict():
    """Test extracting tool calls from a message dict"""
    adapter = create_claude_client()

    # Mock message with tool use
    mock_message = type('Message', (), {
        'content': [
            {
                "type": "tool_use",
                "id": "toolu_456",
                "name": "get_weather",
                "input": {"location": "Minneapolis"}
            }
        ]
    })()

    tool_calls = adapter.extract_tool_calls(mock_message)
    assert len(tool_calls) == 1
    assert tool_calls[0]["id"] == "toolu_456"
    assert tool_calls[0]["name"] == "get_weather"
    assert tool_calls[0]["input"]["location"] == "Minneapolis"


@pytest.mark.asyncio
async def test_simple_async_chat():
    """Test a simple async chat call (INTEGRATION TEST - calls real API)"""
    adapter = create_claude_client(model=ClaudeModel.HAIKU)  # Use cheapest model

    messages = [{"role": "user", "content": "Say 'test successful' and nothing else."}]
    response = await adapter.async_chat(messages=messages, max_tokens=20)

    # Verify we got a response
    assert response is not None
    text = adapter.extract_text(response)
    assert len(text) > 0
    assert "test" in text.lower()


@pytest.mark.asyncio
async def test_chat_with_system_prompt():
    """Test chat with system prompt (INTEGRATION TEST - calls real API)"""
    adapter = create_claude_client(model=ClaudeModel.HAIKU)

    messages = [{"role": "user", "content": "What are you?"}]
    response = await adapter.async_chat(
        messages=messages,
        system="You are a helpful assistant named TestBot.",
        max_tokens=50
    )

    text = adapter.extract_text(response)
    assert len(text) > 0


@pytest.mark.asyncio
async def test_streaming_response():
    """Test streaming response (INTEGRATION TEST - calls real API)"""
    adapter = create_claude_client(model=ClaudeModel.HAIKU)

    messages = [{"role": "user", "content": "Count 1, 2, 3 and nothing else."}]

    chunks = []
    async with await adapter.async_chat(messages=messages, stream=True, max_tokens=30) as stream:
        async for event in stream:
            if event.type == "content_block_delta":
                if hasattr(event.delta, "text"):
                    chunks.append(event.delta.text)

    # Verify we got streaming chunks
    assert len(chunks) > 0
    full_text = "".join(chunks)
    assert len(full_text) > 0


def test_model_enum_values():
    """Test that model enum has correct values"""
    assert ClaudeModel.SONNET.value == "claude-sonnet-4-20250514"
    assert ClaudeModel.HAIKU.value == "claude-3-5-haiku-20241022"
    assert ClaudeModel.OPUS.value == "claude-opus-4-20250514"


def test_provider_enum_values():
    """Test that provider enum has correct values"""
    assert ClaudeProvider.ANTHROPIC_DIRECT.value == "anthropic"
    assert ClaudeProvider.AWS_BEDROCK.value == "bedrock"


def test_bedrock_not_implemented():
    """Test that Bedrock provider raises NotImplementedError"""
    with pytest.raises(NotImplementedError, match="Bedrock"):
        ClaudeAdapter(provider=ClaudeProvider.AWS_BEDROCK)


# Mock tests that don't call the API

def test_message_formatting():
    """Test that messages are formatted correctly"""
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"}
    ]

    # Just verify structure - don't call API
    assert all("role" in msg and "content" in msg for msg in messages)
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"


def test_tool_definition_structure():
    """Test that tool definitions have correct structure"""
    tool = {
        "name": "get_weather",
        "description": "Get weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            },
            "required": ["location"]
        }
    }

    # Verify structure
    assert "name" in tool
    assert "description" in tool
    assert "input_schema" in tool
    assert tool["input_schema"]["type"] == "object"
    assert "location" in tool["input_schema"]["properties"]
