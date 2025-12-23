#!/usr/bin/env python3
"""Simple terminal chat with BlackRoad agents - TRUTH CHECK MODE"""

import yaml
from pathlib import Path

def load_agents():
    """Load agents from YAML catalog by parsing agent blocks directly"""
    catalog_path = Path(__file__).parent / "agent-catalog" / "agents.yaml"

    with open(catalog_path, 'r') as f:
        content = f.read()

    # Find all agent YAML blocks (start with "- id:")
    agent_blocks = []
    in_agent = False
    current_block = []

    for line in content.split('\n'):
        if line.startswith('- id:'):
            if current_block:
                agent_blocks.append('\n'.join(current_block))
            current_block = [line]
            in_agent = True
        elif in_agent:
            # Continue block if indented or empty
            if not line or line.startswith(' ') or line.startswith('\t'):
                current_block.append(line)
            elif line.startswith('- id:'):
                # New agent starting
                agent_blocks.append('\n'.join(current_block))
                current_block = [line]
            else:
                # End of agent block
                agent_blocks.append('\n'.join(current_block))
                current_block = []
                in_agent = False

    if current_block:
        agent_blocks.append('\n'.join(current_block))

    # Parse each agent block
    agents = []
    for block in agent_blocks:
        try:
            agent = yaml.safe_load(block)
            if agent and isinstance(agent, dict):
                agents.append(agent)
        except Exception as e:
            print(f"Warning: Failed to parse agent block: {e}")

    return agents

def main():
    print("🖤 BlackRoad Agent Terminal - TRUTH CHECK MODE")
    print("=" * 70)
    print("Let's see what agents actually exist...")
    print("=" * 70)

    try:
        agents = load_agents()
    except Exception as e:
        print(f"❌ Failed to load agents: {e}")
        import traceback
        traceback.print_exc()
        return 1

    print(f"\n📋 Found {len(agents)} agents:\n")

    # List all agents with status
    offline_count = 0
    for i, agent in enumerate(agents, 1):
        status = agent.get("status", "").lower()
        emoji = "🔴" if status == "offline" else "🟢"
        if status == "offline":
            offline_count += 1

        name = agent.get('name', 'Unknown')
        agent_id = agent.get('id', 'no-id')
        platform = agent.get('platform', '')

        print(f"{i:2d}. {emoji} {name}")
        print(f"     ID: {agent_id}")
        if platform:
            print(f"     Platform: {platform}")
        if status == "offline":
            reason = agent.get('status_reason', 'Unknown')
            print(f"     ⚠️  Offline: {reason}")
        print()

    print("=" * 70)
    print(f"Summary: {len(agents)} total agents, {offline_count} offline, {len(agents) - offline_count} online/unknown")
    print("=" * 70)
    print("💡 Commands:")
    print("  [number] - Show detailed agent info")
    print("  list     - List all agents again")
    print("  quit     - Exit")
    print("=" * 70 + "\n")

    while True:
        try:
            user_input = input("You> ").strip()

            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break

            if user_input.lower() == 'list':
                for i, agent in enumerate(agents, 1):
                    status = agent.get("status", "").lower()
                    emoji = "🔴" if status == "offline" else "🟢"
                    print(f"{i:2d}. {emoji} {agent.get('name', 'Unknown')} ({agent.get('id', 'no-id')})")
                print()
                continue

            # Try to select agent by number
            try:
                num = int(user_input)
                if 1 <= num <= len(agents):
                    agent = agents[num - 1]
                    print(f"\n{'=' * 70}")
                    print(f"🤖 {agent.get('name', 'Unknown')}")
                    print(f"{'=' * 70}")
                    print(f"ID: {agent.get('id', 'unknown')}")
                    print(f"Version: {agent.get('version', 'unknown')}")

                    status = agent.get('status', 'unknown')
                    print(f"Status: {status}")
                    if status == "offline":
                        print(f"  Reason: {agent.get('status_reason', 'Unknown')}")
                        print(f"  Last seen: {agent.get('last_seen', 'Unknown')}")

                    if agent.get('platform'):
                        print(f"Platform: {agent['platform']}")

                    if agent.get('network'):
                        print(f"\nNetwork:")
                        net = agent['network']
                        for k, v in net.items():
                            if isinstance(v, list):
                                print(f"  {k}:")
                                for item in v:
                                    print(f"    - {item}")
                            else:
                                print(f"  {k}: {v}")

                    if agent.get('capabilities'):
                        print(f"\nCapabilities:")
                        for cap in agent['capabilities']:
                            print(f"  - {cap}")

                    if agent.get('description'):
                        print(f"\nDescription:")
                        print(f"  {agent['description']}")

                    # Show translation key if present
                    if agent.get('translation_key'):
                        tk = agent['translation_key']
                        print(f"\nTranslation Key:")
                        print(f"  Enabled: {tk.get('enabled', False)}")
                        print(f"  Algorithm: {tk.get('algorithm', 'unknown')}")
                        if 'brhash' in tk:
                            print(f"  BR Hash: {tk['brhash']}")

                    # Show service URLs
                    if agent.get('service_url'):
                        print(f"\nService URL: {agent['service_url']}")

                    print(f"{'=' * 70}\n")
                else:
                    print(f"❌ Invalid number. Choose 1-{len(agents)}\n")
            except ValueError:
                print(f"❓ Unknown command: {user_input}")
                print(f"   Try a number (1-{len(agents)}), 'list', or 'quit'\n")

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
