#!/usr/bin/env python3
"""
Test script for Cece Operator memory system
Usage: python test_memory.py [base_url]
Example: python test_memory.py https://blackroad-cece-operator-production.up.railway.app
"""

import sys
import time
import requests
from typing import Optional


def test_memory(base_url: str = "http://localhost:8000"):
    """Test the memory system endpoints."""

    user_id = f"test-{int(time.time())}"

    print("Testing Cece Operator Memory System")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print(f"Test User ID: {user_id}")
    print()

    # Test 1: Check memory stats
    print("[1/6] Checking memory stats...")
    response = requests.get(f"{base_url}/memory/stats")
    stats = response.json()
    print(f"Memory enabled: {stats.get('enabled')}")
    print(f"Total users: {stats.get('total_users')}")
    print()

    # Test 2: First message (establish context)
    print("[2/6] Sending first message...")
    response = requests.post(
        f"{base_url}/chat",
        json={
            "message": "Hello! My name is Alex and my favorite color is purple.",
            "userId": user_id,
        }
    )
    reply1 = response.json()
    print(f"Reply: {reply1['reply'][:100]}...")
    print()

    # Test 3: Second message (test memory recall)
    print("[3/6] Sending second message (should remember context)...")
    response = requests.post(
        f"{base_url}/chat",
        json={
            "message": "What is my name and favorite color?",
            "userId": user_id,
        }
    )
    reply2 = response.json()
    print(f"Reply: {reply2['reply']}")
    print()

    # Test 4: Retrieve memory
    print("[4/6] Retrieving conversation history...")
    response = requests.get(f"{base_url}/memory/{user_id}")
    history = response.json()
    print(f"Number of stored turns: {history['total_turns']}")
    if history['turns']:
        print(f"Most recent turn:")
        print(f"  User: {history['turns'][0]['user_message'][:50]}...")
        print(f"  Assistant: {history['turns'][0]['assistant_reply'][:50]}...")
    print()

    # Test 5: Manual memory storage
    print("[5/6] Manually storing a conversation turn...")
    response = requests.post(
        f"{base_url}/memory/store",
        json={
            "user_id": user_id,
            "user_message": "Manual test message",
            "assistant_reply": "Manual test reply",
            "metadata": {"test": True},
        }
    )
    store_result = response.json()
    print(f"Stored: {store_result['stored']}")
    print(f"Total turns: {store_result.get('turn_count', 'N/A')}")
    print()

    # Test 6: Clear memory
    print("[6/6] Clearing conversation history...")
    response = requests.delete(f"{base_url}/memory/{user_id}")
    clear_result = response.json()
    print(f"Cleared: {clear_result['cleared']}")
    print()

    # Verify deletion
    print("Verifying deletion...")
    response = requests.get(f"{base_url}/memory/{user_id}")
    final_history = response.json()
    if final_history['total_turns'] == 0:
        print("✓ Memory successfully cleared")
    else:
        print(f"✗ Memory not cleared (found {final_history['total_turns']} turns)")
    print()

    print("=" * 50)
    print("Memory system test complete!")
    print()
    print("Note: If memory is disabled (MEMORY_ENABLED=false),")
    print("the turns will always be 0 and stored=false.")


if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    try:
        test_memory(base_url)
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        print(f"Make sure the operator is running at {base_url}")
        sys.exit(1)
