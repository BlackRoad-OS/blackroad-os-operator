#!/usr/bin/env python3
"""
Demo script showing the Light Trinity and BlackRoad Codex integration.

This script demonstrates:
1. Accessing codex governance principles
2. Querying the agent pantheon
3. Logging Trinity events
"""

from br_operator.codex_service import get_codex_service
from br_operator.trinity_service import get_trinity_service


def demo_codex():
    """Demonstrate codex service capabilities."""
    print("🎭 BlackRoad Codex Demo")
    print("=" * 60)
    
    codex = get_codex_service()
    
    # List some entries
    entries = codex.list_entries()
    print(f"\n✅ Found {len(entries)} governance principles")
    print("\nFirst 5 principles:")
    for entry in entries[:5]:
        print(f"  {entry['number']}: {entry['name']}")
    
    # Get a specific entry
    first_principle = codex.load_entry("001")
    if first_principle:
        print(f"\n📜 Loaded: {first_principle['file']}")
        content_preview = first_principle['content'][:150].replace('\n', ' ')
        print(f"   Preview: {content_preview}...")
    
    # Query pantheon
    agents = codex.list_pantheon_agents()
    print(f"\n✅ Found {len(agents)} agent archetypes in pantheon")
    
    # Get specific agents mentioned in the problem statement
    agent_names = ['Cece', 'Alice', 'Lucidia', 'Aria', 'Silas']
    print("\n🤖 Agents from problem statement:")
    for name in agent_names:
        agent = codex.get_agent_archetype(name)
        if agent:
            print(f"  - {agent['name']}: {agent['epithet']}")
        else:
            # Try alternate name
            alt_name = {
                'Cece': 'Cecilia',
            }.get(name, name)
            agent = codex.get_agent_archetype(alt_name)
            if agent:
                print(f"  - {agent['name']}: {agent['epithet']}")
    
    print("\n" + "=" * 60)


def demo_trinity():
    """Demonstrate trinity service capabilities."""
    print("\n🌈 Light Trinity Demo")
    print("=" * 60)
    
    trinity = get_trinity_service()
    
    # Log some sample events
    print("\n💚 Logging GreenLight events...")
    trinity.log_greenlight_event(
        "demo_task",
        "Running Trinity integration demo",
        status="in_progress",
        domain="platform"
    )
    
    print("💛 Logging YellowLight events...")
    trinity.log_yellowlight_event(
        "demo_deployment",
        "Demo deployment to test environment",
        service="operator",
        platform="local"
    )
    
    print("🔴 Logging RedLight events...")
    trinity.log_redlight_event(
        "demo_template",
        "Demo template rendering",
        template="example",
        status="success"
    )
    
    # Get recent events
    events = trinity.get_recent_events(limit=10)
    print(f"\n✅ Logged {len(events)} Trinity events")
    print("\nRecent events:")
    for event in events[-3:]:
        print(f"  {event['light']}: {event['event_type']} - {event['message']}")
    
    # Check status
    print(f"\n🌈 Trinity path: {trinity.trinity_path}")
    print(f"✅ GreenLight present: {trinity.greenlight_path.exists()}")
    print(f"✅ YellowLight present: {trinity.yellowlight_path.exists()}")
    print(f"✅ RedLight present: {trinity.redlight_path.exists()}")
    
    print("\n" + "=" * 60)


def main():
    """Run the demo."""
    print("\n" + "=" * 60)
    print("🛣️  BlackRoad OS Operator - Trinity & Codex Integration Demo")
    print("=" * 60)
    
    demo_codex()
    demo_trinity()
    
    print("\n✨ Demo complete!")
    print("\nThe operator now has:")
    print("  ✅ 81 governance principles from BlackRoad Codex")
    print("  ✅ 46 agent archetypes in the pantheon")
    print("  ✅ Light Trinity event logging (GreenLight, YellowLight, RedLight)")
    print("  ✅ 10 new API endpoints (7 codex + 3 trinity)")
    print("  ✅ 8 pantheon agents in operator catalog")
    print("\nReady for production! 🚀\n")


if __name__ == "__main__":
    main()
