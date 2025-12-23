"""Tests for PS-SHA-∞ identity and cryptographic verification system."""

from __future__ import annotations

import pytest
from br_operator.ps_sha_infinity import (
    ps_sha_infinity_2048,
    ps_sha_infinity_hex,
    ps_sha_infinity_fingerprint,
    derive_agent_identity,
    derive_translation_key,
    get_root_cipher,
    verify_translation_key,
    create_verification_stamp,
    verify_fingerprint,
)


def test_ps_sha_infinity_2048_basic():
    """Test PS-SHA-∞ 2048-bit hash generation"""
    secret = "test-secret"
    cipher = ps_sha_infinity_2048(secret)

    assert cipher is not None
    assert isinstance(cipher, bytes)
    assert len(cipher) == 256  # 2048 bits = 256 bytes


def test_ps_sha_infinity_deterministic():
    """Test that same secret produces same cipher"""
    secret = "deterministic-test"

    cipher1 = ps_sha_infinity_2048(secret)
    cipher2 = ps_sha_infinity_2048(secret)

    assert cipher1 == cipher2


def test_ps_sha_infinity_unique():
    """Test that different secrets produce different ciphers"""
    secret1 = "secret-one"
    secret2 = "secret-two"

    cipher1 = ps_sha_infinity_2048(secret1)
    cipher2 = ps_sha_infinity_2048(secret2)

    assert cipher1 != cipher2


def test_ps_sha_infinity_hex():
    """Test PS-SHA-∞ hex string output"""
    secret = "hex-test"
    hex_str = ps_sha_infinity_hex(secret)

    assert hex_str is not None
    assert isinstance(hex_str, str)
    assert len(hex_str) == 512  # 256 bytes * 2 hex chars/byte
    # Should only contain hex characters
    assert all(c in "0123456789abcdef" for c in hex_str)


def test_ps_sha_infinity_fingerprint():
    """Test generating short fingerprint from cipher"""
    secret = "fingerprint-test"
    cipher = ps_sha_infinity_2048(secret)

    fingerprint = ps_sha_infinity_fingerprint(cipher, length=16)

    assert fingerprint is not None
    assert isinstance(fingerprint, str)
    assert len(fingerprint) == 32  # 16 bytes = 32 hex chars


def test_fingerprint_different_lengths():
    """Test fingerprints with different lengths"""
    secret = "length-test"
    cipher = ps_sha_infinity_2048(secret)

    fp8 = ps_sha_infinity_fingerprint(cipher, length=8)
    fp16 = ps_sha_infinity_fingerprint(cipher, length=16)
    fp32 = ps_sha_infinity_fingerprint(cipher, length=32)

    assert len(fp8) == 16  # 8 bytes = 16 hex chars
    assert len(fp16) == 32  # 16 bytes = 32 hex chars
    assert len(fp32) == 64  # 32 bytes = 64 hex chars


def test_derive_agent_identity():
    """Test deriving agent-specific identity"""
    root_cipher = get_root_cipher()
    agent_id = "deploy-bot"

    agent_identity = derive_agent_identity(root_cipher, agent_id)

    assert agent_identity is not None
    assert isinstance(agent_identity, bytes)
    assert len(agent_identity) == 64  # SHA-512 = 64 bytes


def test_derive_different_agent_identities():
    """Test that different agents get different identities"""
    root_cipher = get_root_cipher()

    deploy_bot = derive_agent_identity(root_cipher, "deploy-bot")
    sweep_bot = derive_agent_identity(root_cipher, "sweep-bot")
    policy_bot = derive_agent_identity(root_cipher, "policy-bot")

    assert deploy_bot != sweep_bot
    assert sweep_bot != policy_bot
    assert deploy_bot != policy_bot


def test_derive_translation_key_256_steps():
    """Test SHA-2048→SHA-256 translation key with 256-step cascade"""
    root_cipher = get_root_cipher()
    agent_id = "test-agent"

    translation_key = derive_translation_key(root_cipher, agent_id, cascade_steps=256)

    assert translation_key is not None
    assert isinstance(translation_key, str)
    assert len(translation_key) > 0


def test_verify_translation_key():
    """Test translation key verification"""
    root_cipher = get_root_cipher()
    agent_id = "verify-test-agent"

    # Generate translation key
    key = derive_translation_key(root_cipher, agent_id, cascade_steps=256)

    # Verify it (actual API uses 'key' parameter, not 'translation_key')
    is_valid = verify_translation_key(
        root_cipher=root_cipher,
        agent_id=agent_id,
        key=key,
        rotation_epoch=None
    )

    assert is_valid is True


def test_verify_translation_key_invalid():
    """Test that invalid translation key fails verification"""
    root_cipher = get_root_cipher()
    agent_id = "test-agent"

    # Use invalid key
    invalid_key = "invalid-key-value"

    is_valid = verify_translation_key(
        root_cipher=root_cipher,
        agent_id=agent_id,
        key=invalid_key,
        rotation_epoch=None
    )

    assert is_valid is False


def test_create_verification_stamp():
    """Test creating verification stamp"""
    cipher = ps_sha_infinity_2048("stamp-test")
    stamp = create_verification_stamp(cipher)

    assert stamp is not None
    assert isinstance(stamp, dict)
    assert "fingerprint" in stamp
    assert "timestamp" in stamp
    # Check for actual fields in stamp (signature, owner, context)
    assert "signature" in stamp or "owner" in stamp


def test_verify_fingerprint_valid():
    """Test fingerprint verification"""
    secret = "fingerprint-verify-test"
    cipher = ps_sha_infinity_2048(secret)
    fingerprint = ps_sha_infinity_fingerprint(cipher, length=16)

    is_valid = verify_fingerprint(cipher, fingerprint, length=16)

    assert is_valid is True


def test_verify_fingerprint_invalid():
    """Test that wrong fingerprint fails verification"""
    secret = "fingerprint-invalid-test"
    cipher = ps_sha_infinity_2048(secret)
    wrong_fingerprint = "wrong-fp-value"

    is_valid = verify_fingerprint(cipher, wrong_fingerprint, length=16)

    assert is_valid is False


def test_root_cipher_singleton():
    """Test that root cipher is consistent"""
    root1 = get_root_cipher()
    root2 = get_root_cipher()

    assert root1 == root2


def test_context_parameter():
    """Test that context parameter affects output"""
    secret = "context-test"

    cipher_v1 = ps_sha_infinity_2048(secret, context="BlackRoad v1")
    cipher_v2 = ps_sha_infinity_2048(secret, context="BlackRoad v2")

    assert cipher_v1 != cipher_v2


def test_infinite_cascade_property():
    """Test infinite cascade hashing property"""
    # PS-SHA-∞ uses infinite cascade: hash(hash(hash(...)))
    secret = "cascade-test"

    # First cascade
    step1 = ps_sha_infinity_2048(secret)
    step2 = ps_sha_infinity_2048(step1.hex())
    step3 = ps_sha_infinity_2048(step2.hex())

    # All steps should be unique
    assert step1 != step2
    assert step2 != step3
    assert step1 != step3


def test_agent_identity_canonical():
    """Test canonical agent identities for known agents"""
    root_cipher = get_root_cipher()

    # Known operator-level agents
    agents = ["deploy-bot", "sweep-bot", "policy-bot", "sync-agent", "health-monitor"]

    identities = {}
    for agent_id in agents:
        identity = derive_agent_identity(root_cipher, agent_id)
        identities[agent_id] = identity

    # All should be unique
    identity_values = list(identities.values())
    assert len(identity_values) == len(set(id.hex() for id in identity_values))


def test_58_agent_translation_keys():
    """Test translation keys for all 58 agents in catalog"""
    root_cipher = get_root_cipher()

    # Generate translation keys for 58 agents
    keys = {}
    for i in range(58):
        agent_id = f"agent-{i}"
        key = derive_translation_key(root_cipher, agent_id, cascade_steps=256)
        keys[agent_id] = key

    # All keys should be unique
    assert len(set(keys.values())) == 58


def test_consensus_vote_identity():
    """Test identity for consensus voting"""
    # Consensus vote identity: consensus-2025-12-02-001
    root_cipher = get_root_cipher()
    consensus_id = "consensus-2025-12-02-001"

    identity = derive_agent_identity(root_cipher, consensus_id)

    assert identity is not None
    assert len(identity) == 64  # SHA-512 = 64 bytes
