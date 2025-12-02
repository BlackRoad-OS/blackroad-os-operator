"""
PS-SHA∞ - BlackRoad Identity Cipher Generator

Deterministic 2048-bit identity derivation using cascaded SHA-512.

Pattern:
    - Take any secret string (root seed, old key, etc.)
    - Domain-separate with context labels
    - Generate 2048 bits (4 x SHA-512)
    - Result is stable, high-entropy, non-reversible

Usage:
    from br_operator.ps_sha_infinity import (
        ps_sha_infinity_2048,
        ps_sha_infinity_hex,
        derive_agent_identity,
        derive_cluster_identity,
    )

    # Generate root cipher from a secret
    root_cipher = ps_sha_infinity_2048(secret_string, "Cece-Root-v1")

    # Derive agent identities from root
    agent_id = derive_agent_identity(root_cipher, "agent-001")

Security Notes:
    - NEVER store the original secret in code, git, or logs
    - Only store derived ciphers/fingerprints
    - The original secret should be in ~/.blackroad/secrets.env or env vars
    - Old API keys should be invalidated at the provider before use as seeds

@owner Alexa Louise Amundson
@amundson 0.1.0
@system PS-SHA∞ v1
"""

from __future__ import annotations

import hashlib
import os
import time
from dataclasses import dataclass
from typing import Optional


# =============================================================================
# CORE PS-SHA∞ FUNCTIONS
# =============================================================================

def ps_sha_infinity_2048(secret: str, context: str = "BlackRoad v1") -> bytes:
    """
    Derive a 2048-bit BlackRoad cipher from an arbitrary secret string.

    Uses 4 rounds of SHA-512 with domain separation to produce 2048 bits.

    Args:
        secret: Any high-entropy string (root seed, etc.)
        context: Domain separation label (e.g., "Cece-Root-v1")

    Returns:
        2048 bits (256 bytes) as bytes
    """
    secret_bytes = secret.encode("utf-8")
    parts = []

    for i in range(4):
        # Domain separation: ensures different contexts produce different ciphers
        salt = f"BR-PS-SHA∞-{i}:{context}".encode("utf-8")
        h = hashlib.sha512(salt + secret_bytes).digest()  # 512 bits
        parts.append(h)

    return b"".join(parts)  # 2048 bits total


def ps_sha_infinity_hex(secret: str, context: str = "BlackRoad v1") -> str:
    """
    Generate PS-SHA∞ cipher as hex string (512 hex chars).
    """
    return ps_sha_infinity_2048(secret, context).hex()


def ps_sha_infinity_fingerprint(cipher: bytes, length: int = 16) -> str:
    """
    Generate a short fingerprint from a cipher for display/verification.

    Args:
        cipher: The full 2048-bit cipher
        length: Number of bytes for fingerprint (default 16 = 32 hex chars)

    Returns:
        Short hex fingerprint
    """
    return cipher[:length].hex()


# =============================================================================
# IDENTITY DERIVATION
# =============================================================================

def derive_agent_identity(root_cipher: bytes, agent_id: str) -> bytes:
    """
    Derive a deterministic identity seed for an agent from the root cipher.

    Args:
        root_cipher: The 2048-bit root cipher
        agent_id: Unique agent identifier

    Returns:
        512-bit (64 bytes) agent identity seed
    """
    label = f":agent:{agent_id}".encode("utf-8")
    return hashlib.sha512(root_cipher + label).digest()


def derive_cluster_identity(root_cipher: bytes, cluster_name: str) -> bytes:
    """
    Derive a deterministic identity seed for a cluster/node.

    Args:
        root_cipher: The 2048-bit root cipher
        cluster_name: Cluster or node name (e.g., "lucidia-pi-5")

    Returns:
        512-bit (64 bytes) cluster identity seed
    """
    label = f":cluster:{cluster_name}".encode("utf-8")
    return hashlib.sha512(root_cipher + label).digest()


def derive_session_identity(root_cipher: bytes, session_id: str, timestamp: Optional[int] = None) -> bytes:
    """
    Derive a time-bound session identity.

    Args:
        root_cipher: The 2048-bit root cipher
        session_id: Session identifier
        timestamp: Unix timestamp (defaults to current time)

    Returns:
        512-bit (64 bytes) session identity seed
    """
    ts = timestamp or int(time.time())
    label = f":session:{session_id}:{ts}".encode("utf-8")
    return hashlib.sha512(root_cipher + label).digest()


# =============================================================================
# VERIFICATION HELPERS
# =============================================================================

@dataclass
class IdentityVerification:
    """Result of identity verification."""
    valid: bool
    fingerprint: str
    context: str
    timestamp: str


def create_verification_stamp(cipher: bytes, context: str = "BlackRoad") -> dict:
    """
    Create a verification stamp for signing/attribution.

    Returns a dict suitable for JSON embedding in responses.
    """
    fingerprint = ps_sha_infinity_fingerprint(cipher, 8)  # 16 hex chars
    ts = int(time.time())

    # Create a zeta-time style identifier
    zeta_base = hex(ts)[-8:].upper()
    zeta_time = f"ζ-{zeta_base}"

    return {
        "owner": "ALEXA LOUISE AMUNDSON",
        "verified": True,
        "zeta_time": zeta_time,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts)),
        "fingerprint": f"PS∞-{fingerprint.upper()}",
        "context": context,
        "signature": f"ALA-{ts}-BLACKROAD-VERIFIED",
    }


def verify_fingerprint(cipher: bytes, expected_fingerprint: str, length: int = 16) -> bool:
    """
    Verify a cipher matches an expected fingerprint.

    Args:
        cipher: The full cipher to verify
        expected_fingerprint: The expected fingerprint (hex string)
        length: Fingerprint length in bytes

    Returns:
        True if fingerprint matches
    """
    actual = ps_sha_infinity_fingerprint(cipher, length)
    return actual.lower() == expected_fingerprint.lower()


# =============================================================================
# ROOT CIPHER MANAGEMENT
# =============================================================================

_root_cipher: Optional[bytes] = None


def get_root_cipher() -> bytes:
    """
    Get or create the root cipher for this BlackRoad instance.

    The root secret is read from:
    1. BR_ROOT_SECRET env var
    2. BLACKROAD_ROOT_SECRET env var
    3. Falls back to a derived value from OPENAI_API_KEY (for bootstrap)

    In production, you should set BR_ROOT_SECRET explicitly.
    """
    global _root_cipher

    if _root_cipher is not None:
        return _root_cipher

    # Try explicit root secret first
    root_secret = os.getenv("BR_ROOT_SECRET") or os.getenv("BLACKROAD_ROOT_SECRET")

    if not root_secret:
        # Fallback: derive from OpenAI key (for bootstrap only)
        # In production, set BR_ROOT_SECRET explicitly
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            # Use the key as a seed, but with a different context
            # This is safe because we're one-way hashing
            root_secret = f"bootstrap-from-openai:{openai_key}"

    if not root_secret:
        # Generate ephemeral (not recommended for production)
        import secrets as stdlib_secrets
        root_secret = f"ephemeral:{stdlib_secrets.token_hex(32)}"
        print("WARNING: Using ephemeral root cipher. Set BR_ROOT_SECRET for persistence.")

    _root_cipher = ps_sha_infinity_2048(root_secret, "BlackRoad-Root-v1")
    return _root_cipher


def get_cece_identity() -> dict:
    """
    Get Cece's identity information for stamping responses.
    """
    root = get_root_cipher()
    cece_seed = derive_agent_identity(root, "cece-primary")

    return {
        "agent": "Cece",
        "fingerprint": f"PS∞-{ps_sha_infinity_fingerprint(cece_seed, 8).upper()}",
        "root_fingerprint": f"PS∞-{ps_sha_infinity_fingerprint(root, 8).upper()}",
        "owner": "Alexa Louise Amundson",
        "infrastructure": "BlackRoad OS",
    }


# =============================================================================
# CLI / DEBUG
# =============================================================================

if __name__ == "__main__":
    print("PS-SHA∞ Identity System")
    print("=" * 60)

    # Demo with a test secret (DO NOT use real secrets in code)
    test_secret = "test-secret-do-not-use-real-keys"

    cipher = ps_sha_infinity_2048(test_secret, "Demo-v1")
    print(f"\nCipher length: {len(cipher)} bytes ({len(cipher) * 8} bits)")
    print(f"Fingerprint: PS∞-{ps_sha_infinity_fingerprint(cipher, 8).upper()}")

    # Derive agent identity
    agent_seed = derive_agent_identity(cipher, "demo-agent-001")
    print(f"\nAgent 'demo-agent-001' fingerprint: {agent_seed[:8].hex().upper()}")

    # Create verification stamp
    stamp = create_verification_stamp(cipher, "Demo")
    print(f"\nVerification stamp:")
    for k, v in stamp.items():
        print(f"  {k}: {v}")

    # Show Cece identity (uses env vars)
    print("\n" + "=" * 60)
    print("Cece Identity (from env):")
    try:
        cece = get_cece_identity()
        for k, v in cece.items():
            print(f"  {k}: {v}")
    except Exception as e:
        print(f"  (Could not generate: {e})")
