"""Agent routing module for blackroad-os-operator.

Resolves DNS hostnames to agent configurations and dynamically imports handlers.

Usage:
    from br_operator.agent_routing import (
        load_routing_config,
        resolve_agent_by_hostname,
        resolve_agent_by_id,
        get_agents_for_capability,
    )

    cfg = load_routing_config()
    agent = resolve_agent_by_hostname(cfg, "agent-deploy-bot.agents.blackroad.network")
    handler = import_handler(agent.handler)
    result = await handler(message)
"""

from __future__ import annotations

import importlib
from pathlib import Path
from typing import Any, Callable

import yaml
from pydantic import BaseModel, Field


class AgentConfig(BaseModel):
    """Configuration for a single agent."""

    id: str
    hostname: str
    handler: str
    capabilities: list[str] = Field(default_factory=list)
    operator_level: bool = False
    category: str = "general"
    compliance_sensitive: bool = False
    notes: list[str] = Field(default_factory=list)


class DNSPattern(BaseModel):
    """DNS pattern configuration."""

    hostname: str | None = None
    pattern: str | None = None
    description: str = ""


class RoutingDefaults(BaseModel):
    """Default routing settings."""

    timeout_seconds: int = 30
    max_retries: int = 3
    health_check_interval: int = 60


class RoutingConfig(BaseModel):
    """Complete routing configuration."""

    dns_patterns: dict[str, DNSPattern] = Field(default_factory=dict)
    defaults: RoutingDefaults = Field(default_factory=RoutingDefaults)
    agents: dict[str, AgentConfig] = Field(default_factory=dict)
    capability_index: dict[str, list[str]] = Field(default_factory=dict)


def load_routing_config(
    path: str | Path | None = None,
) -> RoutingConfig:
    """Load routing configuration from YAML file.

    Args:
        path: Path to agent-routing.yaml. Defaults to config/agent-routing.yaml
              relative to the repo root.

    Returns:
        Parsed RoutingConfig object.
    """
    if path is None:
        repo_root = Path(__file__).resolve().parent.parent
        path = repo_root / "config" / "agent-routing.yaml"
    else:
        path = Path(path)

    if not path.exists():
        # Return empty config if file doesn't exist
        return RoutingConfig()

    with path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    # Parse DNS patterns
    dns_patterns = {}
    for key, value in (raw.get("dns_patterns") or {}).items():
        if isinstance(value, dict):
            dns_patterns[key] = DNSPattern(**value)

    # Parse defaults
    defaults_raw = raw.get("defaults") or {}
    defaults = RoutingDefaults(**defaults_raw)

    # Parse agents
    agents = {}
    for key, value in (raw.get("agents") or {}).items():
        if isinstance(value, dict):
            agents[key] = AgentConfig(**value)

    # Parse capability index
    capability_index = raw.get("capability_index") or {}

    return RoutingConfig(
        dns_patterns=dns_patterns,
        defaults=defaults,
        agents=agents,
        capability_index=capability_index,
    )


def resolve_agent_by_hostname(
    cfg: RoutingConfig,
    hostname: str,
) -> AgentConfig | None:
    """Resolve an agent configuration by its hostname.

    Supports both exact hostname matches and the pattern:
        agent-{id}.agents.blackroad.network

    Args:
        cfg: Loaded routing configuration.
        hostname: The hostname to resolve.

    Returns:
        AgentConfig if found, None otherwise.
    """
    hostname = hostname.lower().strip()

    # Try exact match first
    for agent in cfg.agents.values():
        if agent.hostname.lower() == hostname:
            return agent

    # Try pattern match: agent-{id}.agents.blackroad.network
    if hostname.endswith(".agents.blackroad.network"):
        prefix = hostname.split(".")[0]  # e.g., "agent-deploy-bot"
        if prefix.startswith("agent-"):
            agent_id = prefix[len("agent-") :]  # e.g., "deploy-bot"
            return cfg.agents.get(agent_id)

    return None


def resolve_agent_by_id(
    cfg: RoutingConfig,
    agent_id: str,
) -> AgentConfig | None:
    """Resolve an agent configuration by its ID.

    Args:
        cfg: Loaded routing configuration.
        agent_id: The agent ID to look up.

    Returns:
        AgentConfig if found, None otherwise.
    """
    return cfg.agents.get(agent_id)


def get_agents_for_capability(
    cfg: RoutingConfig,
    capability: str,
) -> list[AgentConfig]:
    """Get all agents that provide a given capability.

    Args:
        cfg: Loaded routing configuration.
        capability: The capability to search for.

    Returns:
        List of AgentConfig objects that have the capability.
    """
    agent_ids = cfg.capability_index.get(capability, [])
    return [cfg.agents[aid] for aid in agent_ids if aid in cfg.agents]


def import_handler(handler_path: str) -> Callable[..., Any]:
    """Dynamically import a handler function from a module path.

    Args:
        handler_path: Path in format "module.path:function_name"
                      e.g., "br_operator.agents.deploy_bot:handle"

    Returns:
        The imported function.

    Raises:
        ValueError: If handler_path format is invalid.
        ImportError: If module cannot be imported.
        AttributeError: If function doesn't exist in module.
    """
    if ":" not in handler_path:
        raise ValueError(
            f"Invalid handler path '{handler_path}'. "
            "Expected format: 'module.path:function_name'"
        )

    module_path, func_name = handler_path.rsplit(":", 1)
    module = importlib.import_module(module_path)
    return getattr(module, func_name)


def build_hostname_for_agent(agent_id: str) -> str:
    """Build the canonical hostname for an agent ID.

    Args:
        agent_id: The agent's ID (e.g., "deploy-bot")

    Returns:
        Full hostname (e.g., "agent-deploy-bot.agents.blackroad.network")
    """
    return f"agent-{agent_id}.agents.blackroad.network"


def list_all_agents(cfg: RoutingConfig) -> list[dict[str, Any]]:
    """List all agents with their metadata.

    Args:
        cfg: Loaded routing configuration.

    Returns:
        List of agent dictionaries suitable for API responses.
    """
    return [
        {
            "id": agent.id,
            "hostname": agent.hostname,
            "capabilities": agent.capabilities,
            "operator_level": agent.operator_level,
            "category": agent.category,
            "compliance_sensitive": agent.compliance_sensitive,
        }
        for agent in cfg.agents.values()
    ]


def list_capabilities(cfg: RoutingConfig) -> dict[str, list[str]]:
    """List all capabilities and their providing agents.

    Args:
        cfg: Loaded routing configuration.

    Returns:
        Dictionary mapping capability names to agent IDs.
    """
    return dict(cfg.capability_index)
