#!/usr/bin/env python3
"""
Policy Engine Unit Tests

Tests for BlackRoad OS policy evaluation engine:
- Effect precedence (deny > warn > shadow_deny > allow)
- Ledger level precedence (full > action > decision > none)
- Engine initialization
- Config directory handling
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from pathlib import Path

from br_operator.policy_engine import PolicyEngine, EFFECT_PRECEDENCE, LEDGER_PRECEDENCE
from br_operator.models.policy import (
    PolicyEffect,
    LedgerLevel,
)


@pytest.mark.asyncio
async def test_policy_engine_initializes():
    """Test that policy engine can be initialized."""
    engine = PolicyEngine()

    assert engine is not None
    assert engine._loaded is False
    assert isinstance(engine.policy_packs, dict)
    assert isinstance(engine.service_registry, dict)


@pytest.mark.asyncio
async def test_policy_engine_loads():
    """Test that policy engine loads successfully."""
    engine = PolicyEngine()
    await engine.load()

    assert engine._loaded is True


@pytest.mark.asyncio
async def test_effect_precedence_order():
    """Test that effect precedence is correct: deny > warn > shadow_deny > allow."""
    assert EFFECT_PRECEDENCE[PolicyEffect.DENY] == 4
    assert EFFECT_PRECEDENCE[PolicyEffect.WARN] == 3
    assert EFFECT_PRECEDENCE[PolicyEffect.SHADOW_DENY] == 2
    assert EFFECT_PRECEDENCE[PolicyEffect.ALLOW] == 1

    # Verify ordering
    assert EFFECT_PRECEDENCE[PolicyEffect.DENY] > EFFECT_PRECEDENCE[PolicyEffect.WARN]
    assert EFFECT_PRECEDENCE[PolicyEffect.WARN] > EFFECT_PRECEDENCE[PolicyEffect.SHADOW_DENY]
    assert EFFECT_PRECEDENCE[PolicyEffect.SHADOW_DENY] > EFFECT_PRECEDENCE[PolicyEffect.ALLOW]


@pytest.mark.asyncio
async def test_ledger_precedence_order():
    """Test that ledger level precedence is correct: full > action > decision > none."""
    assert LEDGER_PRECEDENCE[LedgerLevel.FULL] == 4
    assert LEDGER_PRECEDENCE[LedgerLevel.ACTION] == 3
    assert LEDGER_PRECEDENCE[LedgerLevel.DECISION] == 2
    assert LEDGER_PRECEDENCE[LedgerLevel.NONE] == 1

    # Verify ordering
    assert LEDGER_PRECEDENCE[LedgerLevel.FULL] > LEDGER_PRECEDENCE[LedgerLevel.ACTION]
    assert LEDGER_PRECEDENCE[LedgerLevel.ACTION] > LEDGER_PRECEDENCE[LedgerLevel.DECISION]
    assert LEDGER_PRECEDENCE[LedgerLevel.DECISION] > LEDGER_PRECEDENCE[LedgerLevel.NONE]


@pytest.mark.asyncio
async def test_config_dir_defaults_correctly():
    """Test that policy engine config directory defaults to config/."""
    engine = PolicyEngine()

    assert engine.config_dir.name == "config"
    assert engine.config_dir.exists()


@pytest.mark.asyncio
async def test_config_dir_can_be_overridden():
    """Test that policy engine config directory can be customized."""
    custom_path = Path("/tmp/custom-policies")
    engine = PolicyEngine(config_dir=custom_path)

    assert engine.config_dir == custom_path


@pytest.mark.asyncio
async def test_policy_packs_dict_after_load():
    """Test that policy_packs is a dict after loading."""
    engine = PolicyEngine()
    await engine.load()

    assert isinstance(engine.policy_packs, dict)


@pytest.mark.asyncio
async def test_service_registry_dict_after_load():
    """Test that service_registry is a dict after loading."""
    engine = PolicyEngine()
    await engine.load()

    assert isinstance(engine.service_registry, dict)


@pytest.mark.asyncio
async def test_policy_effect_enum_values():
    """Test that PolicyEffect enum has all expected values."""
    assert hasattr(PolicyEffect, 'ALLOW')
    assert hasattr(PolicyEffect, 'DENY')
    assert hasattr(PolicyEffect, 'WARN')
    assert hasattr(PolicyEffect, 'SHADOW_DENY')

    assert PolicyEffect.ALLOW.value == "allow"
    assert PolicyEffect.DENY.value == "deny"
    assert PolicyEffect.WARN.value == "warn"
    assert PolicyEffect.SHADOW_DENY.value == "shadow_deny"


@pytest.mark.asyncio
async def test_ledger_level_enum_values():
    """Test that LedgerLevel enum has all expected values."""
    assert hasattr(LedgerLevel, 'NONE')
    assert hasattr(LedgerLevel, 'DECISION')
    assert hasattr(LedgerLevel, 'ACTION')
    assert hasattr(LedgerLevel, 'FULL')

    assert LedgerLevel.NONE.value == "none"
    assert LedgerLevel.DECISION.value == "decision"
    assert LedgerLevel.ACTION.value == "action"
    assert LedgerLevel.FULL.value == "full"


@pytest.mark.asyncio
async def test_all_effects_have_precedence():
    """Test that all PolicyEffect values are in EFFECT_PRECEDENCE."""
    for effect in PolicyEffect:
        assert effect in EFFECT_PRECEDENCE


@pytest.mark.asyncio
async def test_all_ledger_levels_have_precedence():
    """Test that all LedgerLevel values are in LEDGER_PRECEDENCE."""
    for level in LedgerLevel:
        assert level in LEDGER_PRECEDENCE


@pytest.mark.asyncio
async def test_effect_precedence_no_duplicates():
    """Test that effect precedence values are unique."""
    precedence_values = list(EFFECT_PRECEDENCE.values())
    assert len(precedence_values) == len(set(precedence_values))


@pytest.mark.asyncio
async def test_ledger_precedence_no_duplicates():
    """Test that ledger precedence values are unique."""
    precedence_values = list(LEDGER_PRECEDENCE.values())
    assert len(precedence_values) == len(set(precedence_values))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
