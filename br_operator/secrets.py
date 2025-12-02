"""
BlackRoad OS - Secrets Resolver

Pattern: Only the Operator holds real secrets.
Everyone else uses aliases via governed API calls.

Usage:
    from br_operator.secrets import resolve_secret, get_secret, SecretNotFoundError

    # Get a secret by alias
    api_key = get_secret("openai.default")

    # Check if available (doesn't throw)
    key = resolve_secret("anthropic.default")  # Returns None if missing

    # List all configured aliases
    aliases = list_aliases()

@owner Alexa Louise Amundson
@amundson 0.1.0
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from functools import lru_cache

import yaml


# =============================================================================
# EXCEPTIONS
# =============================================================================

class SecretNotFoundError(Exception):
    """Raised when a required secret is not found."""

    def __init__(self, alias: str, env_var: str, hint: str = ""):
        self.alias = alias
        self.env_var = env_var
        self.hint = hint
        message = f"Secret '{alias}' not found. Set environment variable: {env_var}"
        if hint:
            message += f"\nHint: {hint}"
        super().__init__(message)


class SecretAliasNotFoundError(Exception):
    """Raised when an alias doesn't exist in the config."""

    def __init__(self, alias: str):
        self.alias = alias
        super().__init__(f"Unknown secret alias: '{alias}'. Check config/secrets.aliases.yaml")


# =============================================================================
# CONFIG LOADING
# =============================================================================

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ALIASES_PATH = REPO_ROOT / "config" / "secrets.aliases.yaml"


@lru_cache(maxsize=1)
def load_aliases_config(path: Path = DEFAULT_ALIASES_PATH) -> Dict[str, Any]:
    """Load the secrets aliases configuration."""
    if not path.exists():
        return {"providers": {}}

    with open(path, "r") as f:
        return yaml.safe_load(f) or {"providers": {}}


def _parse_alias(alias: str) -> tuple[str, str]:
    """Parse 'provider.name' into (provider, name)."""
    parts = alias.split(".", 1)
    if len(parts) != 2:
        raise SecretAliasNotFoundError(alias)
    return parts[0], parts[1]


def _get_alias_config(alias: str) -> Optional[Dict[str, Any]]:
    """Get the configuration for an alias."""
    config = load_aliases_config()
    provider, name = _parse_alias(alias)

    providers = config.get("providers", {})
    if provider not in providers:
        return None

    provider_config = providers[provider]
    if name not in provider_config:
        return None

    return provider_config[name]


# =============================================================================
# PUBLIC API
# =============================================================================

def resolve_secret(alias: str) -> Optional[str]:
    """
    Resolve a secret alias to its value.

    Returns None if the secret is not set (doesn't throw).
    Use this when the secret is optional.

    Args:
        alias: Secret alias like "openai.default" or "stripe.secret"

    Returns:
        The secret value, or None if not found
    """
    alias_config = _get_alias_config(alias)
    if alias_config is None:
        return None

    env_var = alias_config.get("env_var")
    if not env_var:
        return None

    # Check environment variable
    value = os.environ.get(env_var)
    if value:
        return value

    # Check for default value
    default = alias_config.get("default")
    if default:
        return default

    return None


def get_secret(alias: str) -> str:
    """
    Get a secret by alias. Throws if not found.

    Use this when the secret is required.

    Args:
        alias: Secret alias like "openai.default"

    Returns:
        The secret value

    Raises:
        SecretNotFoundError: If the secret is not set
        SecretAliasNotFoundError: If the alias doesn't exist
    """
    alias_config = _get_alias_config(alias)
    if alias_config is None:
        raise SecretAliasNotFoundError(alias)

    env_var = alias_config.get("env_var", "UNKNOWN")
    value = resolve_secret(alias)

    if value is None:
        hint = alias_config.get("description", "")
        raise SecretNotFoundError(alias, env_var, hint)

    return value


def has_secret(alias: str) -> bool:
    """Check if a secret is available without retrieving it."""
    return resolve_secret(alias) is not None


def list_aliases() -> List[str]:
    """List all configured secret aliases."""
    config = load_aliases_config()
    aliases = []

    for provider, provider_config in config.get("providers", {}).items():
        if isinstance(provider_config, dict):
            for name in provider_config.keys():
                aliases.append(f"{provider}.{name}")

    return sorted(aliases)


def get_alias_info(alias: str) -> Optional[Dict[str, Any]]:
    """Get metadata about an alias (without the actual secret)."""
    alias_config = _get_alias_config(alias)
    if alias_config is None:
        return None

    env_var = alias_config.get("env_var", "")

    return {
        "alias": alias,
        "env_var": env_var,
        "description": alias_config.get("description", ""),
        "required": alias_config.get("required", False),
        "sensitive": alias_config.get("sensitive", True),
        "is_set": has_secret(alias),
        "used_by": alias_config.get("used_by", []),
    }


def check_required_secrets() -> Dict[str, Any]:
    """
    Check all required secrets and return status.

    Useful for health checks and startup validation.
    """
    config = load_aliases_config()
    results = {
        "ok": True,
        "missing": [],
        "available": [],
        "optional_missing": [],
    }

    for provider, provider_config in config.get("providers", {}).items():
        if not isinstance(provider_config, dict):
            continue

        for name, alias_config in provider_config.items():
            if not isinstance(alias_config, dict):
                continue

            alias = f"{provider}.{name}"
            is_required = alias_config.get("required", False)
            is_set = has_secret(alias)

            if is_set:
                results["available"].append(alias)
            elif is_required:
                results["missing"].append(alias)
                results["ok"] = False
            else:
                results["optional_missing"].append(alias)

    return results


def mask_secret(value: str, show_chars: int = 4) -> str:
    """Mask a secret for safe logging/display."""
    if len(value) <= show_chars * 2:
        return "*" * len(value)
    return value[:show_chars] + "*" * (len(value) - show_chars * 2) + value[-show_chars:]


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_openai_key() -> str:
    """Get the OpenAI API key."""
    return get_secret("openai.default")


def get_anthropic_key() -> Optional[str]:
    """Get the Anthropic API key (optional)."""
    return resolve_secret("anthropic.default")


def get_stripe_secret() -> Optional[str]:
    """Get the Stripe secret key (optional)."""
    return resolve_secret("stripe.secret")


def get_database_url() -> Optional[str]:
    """Get the database connection URL."""
    return resolve_secret("postgres.url")


def get_redis_url() -> Optional[str]:
    """Get the Redis connection URL."""
    return resolve_secret("redis.url")


# =============================================================================
# CLI / DEBUG
# =============================================================================

if __name__ == "__main__":
    import json

    print("BlackRoad OS - Secrets Status")
    print("=" * 50)

    status = check_required_secrets()
    print(f"\nStatus: {'OK' if status['ok'] else 'MISSING REQUIRED SECRETS'}")

    print(f"\nAvailable ({len(status['available'])}):")
    for alias in status["available"]:
        info = get_alias_info(alias)
        print(f"  ✓ {alias}")

    if status["missing"]:
        print(f"\nMissing REQUIRED ({len(status['missing'])}):")
        for alias in status["missing"]:
            info = get_alias_info(alias)
            print(f"  ✗ {alias} -> Set: {info['env_var']}")

    if status["optional_missing"]:
        print(f"\nMissing optional ({len(status['optional_missing'])}):")
        for alias in status["optional_missing"][:10]:  # Show first 10
            info = get_alias_info(alias)
            print(f"  - {alias}")
        if len(status["optional_missing"]) > 10:
            print(f"  ... and {len(status['optional_missing']) - 10} more")

    print("\n" + "=" * 50)
