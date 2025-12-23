#!/usr/bin/env python3
"""
Agent Catalog Validator

Validates agent-catalog/agents.yaml for:
- Required fields
- Translation key format
- Consensus records
- Duplicate IDs
- Platform assignments
- Capability definitions
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml


def validate_agent(agent: Dict[str, Any], index: int) -> List[str]:
    """Validate a single agent entry."""
    errors = []

    # Required field: id
    if "id" not in agent:
        errors.append(f"Agent #{index}: Missing required field 'id'")
        return errors  # Can't continue without ID

    agent_id = agent["id"]

    # Recommended fields
    if "name" not in agent:
        errors.append(f"Agent '{agent_id}': Missing 'name' field")

    if "description" not in agent:
        errors.append(f"Agent '{agent_id}': Missing 'description' field")

    # Validate translation_key if present
    if "translation_key" in agent:
        tk = agent["translation_key"]
        if not isinstance(tk, dict):
            errors.append(f"Agent '{agent_id}': translation_key must be a dict")
        else:
            if "enabled" in tk and not isinstance(tk["enabled"], bool):
                errors.append(f"Agent '{agent_id}': translation_key.enabled must be boolean")

            if "algorithm" in tk:
                algo = tk["algorithm"]
                if "SHA" not in algo and "sha" not in algo.lower():
                    errors.append(f"Agent '{agent_id}': Unexpected algorithm '{algo}'")

    # Validate platform (expanded to include all discovered platforms)
    valid_platforms = {
        "cloudflare", "cloudflare-workers", "railway", "github", "local",
        "pi", "edge", "ios", "vercel", "openai", "ollama", "google-drive",
        "arc", "stripe", "browser", "firefox", "raspberry-pi", "digitalocean",
        "docker", "cloudflare-warp"
    }
    if "platform" in agent:
        platform = agent["platform"]
        if platform not in valid_platforms:
            errors.append(
                f"Agent '{agent_id}': Unknown platform '{platform}' "
                f"(expected one of {valid_platforms})"
            )

    # Validate capabilities
    if "capabilities" in agent:
        if not isinstance(agent["capabilities"], list):
            errors.append(f"Agent '{agent_id}': capabilities must be a list")

    # Validate operatorLevel
    if "operatorLevel" in agent:
        if not isinstance(agent["operatorLevel"], bool):
            errors.append(f"Agent '{agent_id}': operatorLevel must be boolean")

    return errors


def validate_consensus_history(consensus: List[Dict[str, Any]]) -> List[str]:
    """Validate consensus voting records."""
    errors = []

    for i, record in enumerate(consensus):
        if "id" not in record:
            errors.append(f"Consensus record #{i}: Missing 'id'")

        if "title" not in record:
            errors.append(f"Consensus record #{i}: Missing 'title'")

        if "votes" in record:
            votes = record["votes"]
            if not isinstance(votes, int) or votes < 0:
                errors.append(f"Consensus record #{i}: Invalid votes count")

        if "result" in record:
            valid_results = {"UNANIMOUS APPROVAL", "APPROVED", "REJECTED", "PENDING"}
            if record["result"] not in valid_results:
                errors.append(
                    f"Consensus record #{i}: Unknown result '{record['result']}'"
                )

    return errors


def validate_catalog(catalog_path: Path) -> tuple[bool, List[str]]:
    """Validate the entire agent catalog."""
    errors = []

    # Check file exists
    if not catalog_path.exists():
        return False, [f"Catalog file not found: {catalog_path}"]

    # Load YAML
    try:
        with open(catalog_path) as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return False, [f"YAML parse error: {e}"]

    # Check structure - handle both dict and list formats
    if isinstance(data, list):
        # Direct list of agents (no wrapper dict)
        agents = data
    elif isinstance(data, dict):
        # Dict with 'agents' key or direct agent list at root
        if "agents" in data:
            agents = data["agents"]
        else:
            # No agents key, but might have metadata
            errors.append("Warning: No 'agents' key found in catalog dict")
            agents = []
    else:
        return False, ["Catalog must be a list or dict"]

    if not isinstance(agents, list):
        return False, ["'agents' must be a list"]

    if len(agents) == 0:
        errors.append("Warning: No agents defined in catalog")

    # Check for duplicate IDs
    agent_ids = [a.get("id") for a in agents if "id" in a]
    duplicates = [aid for aid in agent_ids if agent_ids.count(aid) > 1]
    if duplicates:
        unique_dupes = set(duplicates)
        errors.append(f"Duplicate agent IDs found: {unique_dupes}")

    # Validate each agent
    for i, agent in enumerate(agents):
        agent_errors = validate_agent(agent, i)
        errors.extend(agent_errors)

    # Validate consensus history if present
    if "consensus_history" in data:
        consensus = data["consensus_history"]
        if isinstance(consensus, list):
            consensus_errors = validate_consensus_history(consensus)
            errors.extend(consensus_errors)
        else:
            errors.append("'consensus_history' must be a list")

    # Summary stats
    operator_agents = [a for a in agents if a.get("operatorLevel")]
    agents_with_keys = [a for a in agents if "translation_key" in a]

    print(f"✅ Total agents: {len(agents)}")
    print(f"✅ Operator-level agents: {len(operator_agents)}")
    print(f"✅ Agents with translation keys: {len(agents_with_keys)}")

    if "consensus_history" in data:
        print(f"✅ Consensus records: {len(data['consensus_history'])}")

    return len(errors) == 0, errors


def main():
    """Main validation entry point."""
    catalog_path = Path(__file__).parent.parent / "agent-catalog" / "agents.yaml"

    print(f"Validating agent catalog: {catalog_path}")
    print("-" * 60)

    is_valid, errors = validate_catalog(catalog_path)

    if is_valid:
        print("\n✅ Catalog validation PASSED")
        return 0
    else:
        print(f"\n❌ Catalog validation FAILED ({len(errors)} errors)")
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
