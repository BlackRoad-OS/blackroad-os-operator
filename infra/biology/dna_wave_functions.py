"""
DNA Base Pair Wave Functions

From whiteboard images 4-5 (Batch 5)

Modeling DNA nucleotides as oscillatory functions:
- Each base (A, T, C, G) has a characteristic wave function γ(t)
- Base pairs combine their wave functions
- This creates a mathematical model for DNA information dynamics
"""

import math
from dataclasses import dataclass
from typing import Callable


# ============================================================
# INDIVIDUAL BASE WAVE FUNCTIONS
# ============================================================

def gamma_A(t: float) -> float:
    """
    Adenine wave function.

    γ_A(t) = √3 · sin(3/2 · log t)

    From whiteboard: A → γ_A(t) = √3·sin(3/2·log t)
    """
    if t <= 0:
        return 0.0
    return math.sqrt(3) * math.sin(1.5 * math.log(t))


def gamma_T(t: float) -> float:
    """
    Thymine wave function.

    γ_T(t) = 1 · cos(3/2 · log t)

    From whiteboard: T → γ_T(t) = 1·cos(3/2·log t)
    """
    if t <= 0:
        return 0.0
    return math.cos(1.5 * math.log(t))


def gamma_C(t: float) -> float:
    """
    Cytosine wave function.

    γ_C(t) = 2 · e^(3 log t) = 2t³

    From whiteboard: C → γ_C(t) = 2e^(3 log t)
    Note: e^(a·log t) = t^a, so this simplifies to 2t³
    """
    if t <= 0:
        return 0.0
    return 2 * (t ** 3)


def gamma_G(t: float) -> float:
    """
    Guanine wave function.

    γ_G(t) = √2 · log(t + 1)

    From whiteboard: G → γ_G(t) = √2·log(t+1)
    """
    return math.sqrt(2) * math.log(t + 1)


# ============================================================
# BASE PAIR WAVE FUNCTIONS
# ============================================================

def gamma_AT(t: float) -> float:
    """
    Adenine-Thymine base pair wave function.

    γ_AT(t) = √3 · sin(3/2 log t) · cos(3/2 log t)
            = (√3/2) · sin(3 log t)    [using sin(2x) = 2sin(x)cos(x)]

    From whiteboard: A + T → γ_AT(t) = √3 sin(3/2 log t) cos(3/2 log t)

    This is the product γ_A(t) · γ_T(t) (without the √3 normalization).
    """
    if t <= 0:
        return 0.0
    return math.sqrt(3) * math.sin(1.5 * math.log(t)) * math.cos(1.5 * math.log(t))


def gamma_CG(t: float) -> float:
    """
    Cytosine-Guanine base pair wave function.

    γ_CG(t) = 2·e^(3π/4) · sin(3π/4 · log(t+1)) · √2 · log(t+1)

    From whiteboard: C + G → γ_CG(t) = 2e^(3π/4) sin(3π/4 log(t+1)) √2 log(t+1)

    Note: This has a constant prefactor e^(3π/4) ≈ 10.55
    """
    log_term = math.log(t + 1)
    return 2 * math.exp(3 * math.pi / 4) * math.sin(0.75 * math.pi * log_term) * math.sqrt(2) * log_term


def gamma_AG(t: float) -> float:
    """
    Adenine-Guanine pair wave function (purine-purine mismatch).

    γ_AG(t) = 1 · cos(3/2 log t) · 2e^(3 log t)
            = 2t³ · cos(3/2 log t)

    From whiteboard: A + G → γ_AG(t) = 1·cos(3/2 log t) 2e^(3 log t)
    """
    if t <= 0:
        return 0.0
    return 2 * (t ** 3) * math.cos(1.5 * math.log(t))


def gamma_TC(t: float) -> float:
    """
    Thymine-Cytosine pair wave function (pyrimidine-pyrimidine mismatch).

    From whiteboard: T + C → γ_TC(t) = ... (incomplete)

    Inferred: Product of γ_T and γ_C
    """
    return gamma_T(t) * gamma_C(t)


# ============================================================
# DNA SEQUENCE OPERATIONS
# ============================================================

@dataclass
class DNABase:
    """A single DNA base with its wave function."""
    symbol: str
    name: str
    gamma: Callable[[float], float]
    complement: str  # Watson-Crick complement


# Define the four bases
ADENINE = DNABase("A", "Adenine", gamma_A, "T")
THYMINE = DNABase("T", "Thymine", gamma_T, "A")
CYTOSINE = DNABase("C", "Cytosine", gamma_C, "G")
GUANINE = DNABase("G", "Guanine", gamma_G, "C")

BASES = {
    "A": ADENINE,
    "T": THYMINE,
    "C": CYTOSINE,
    "G": GUANINE,
}


def sequence_wave(sequence: str, t: float) -> float:
    """
    Compute the total wave function for a DNA sequence at time t.

    Sum of individual base wave functions.
    """
    total = 0.0
    for base in sequence.upper():
        if base in BASES:
            total += BASES[base].gamma(t)
    return total


def complement(sequence: str) -> str:
    """Return the Watson-Crick complement of a DNA sequence."""
    return "".join(BASES[b].complement for b in sequence.upper() if b in BASES)


def chargaff_ratio(sequence: str) -> dict:
    """
    Check Chargaff's rules: A=T and C=G in double-stranded DNA.

    From whiteboard: "A + T, C + G, A + G = T + C?"
    """
    seq = sequence.upper()
    counts = {b: seq.count(b) for b in "ATCG"}

    return {
        "counts": counts,
        "A_equals_T": counts["A"] == counts["T"],
        "C_equals_G": counts["C"] == counts["G"],
        "purines": counts["A"] + counts["G"],
        "pyrimidines": counts["T"] + counts["C"],
        "purines_equal_pyrimidines": (counts["A"] + counts["G"]) == (counts["T"] + counts["C"])
    }


# ============================================================
# INTELLIGENCE LIMIT
# ============================================================

def intelligence_limit(M: Callable[[float], float], t_max: float = 1000, threshold: float = 0.01) -> dict:
    """
    From whiteboard:
    Intelligence = lim_{x→+∞} M_{i,k}(t) → stable

    Check if a function M(t) approaches a stable limit as t → ∞.
    """
    # Sample at increasing t values
    samples = [M(t) for t in [10, 100, t_max/10, t_max/2, t_max]]

    # Check stability (variance of last few samples)
    variance = sum((s - samples[-1])**2 for s in samples[-3:]) / 3

    return {
        "samples": samples,
        "final_value": samples[-1],
        "variance": variance,
        "is_stable": variance < threshold,
        "interpretation": "Intelligence achieved" if variance < threshold else "Still evolving"
    }


# ============================================================
# DNA MATRIX ALGEBRA (from image 4)
# ============================================================

def nucleotide_matrix(sequence: str) -> list[list[str]]:
    """
    Convert a DNA sequence to a 4-column matrix representation.

    From whiteboard: 4×4 blocks with GATG patterns.
    """
    seq = sequence.upper()
    n = len(seq)
    rows = (n + 3) // 4  # Ceiling division

    # Pad to multiple of 4
    padded = seq + "N" * (rows * 4 - n)

    return [[padded[i*4 + j] for j in range(4)] for i in range(rows)]


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# DNA wave functions model biological information using the four primitives:
#
# Structure (Û):
#   - Base pairing rules (A-T, C-G) are structural constraints
#   - The double helix geometry
#   - Chargaff's rules: purines = pyrimidines
#
# Change (Ĉ):
#   - Wave functions γ(t) evolve over time
#   - Transcription, replication, mutation
#   - log(t) terms suggest logarithmic time scaling
#
# Scale (L̂):
#   - From single bases to codons to genes to genomes
#   - The √2, √3 coefficients are scaling factors
#   - t³ in γ_C suggests cubic growth
#
# Strength (Ŝ):
#   - Bond strength: C≡G has 3 hydrogen bonds, A=T has 2
#   - The e^(3π/4) prefactor in γ_CG reflects stronger bonding
#   - "Intelligence limit" measures information stability
#
# The wave function approach treats DNA as a dynamic system,
# not just a static sequence. Each base "vibrates" with its
# characteristic frequency, and pairs resonate together.
#
# From A0: Z := yw - w
# For proper base pairing: Z = ∅ (complementary waves interfere constructively)
# For mismatches: Z ≠ ∅ (error signal triggers repair)
# ============================================================


def demonstrate_dna_waves():
    """Demonstrate DNA wave functions."""
    print("=" * 60)
    print("DNA BASE PAIR WAVE FUNCTIONS")
    print("=" * 60)

    print("\n--- Individual Base Functions at t=1, 2, e, π ---")
    test_times = [1, 2, math.e, math.pi]

    for t in test_times:
        print(f"\nt = {t:.4f}:")
        print(f"  γ_A(t) = {gamma_A(t):+.4f}")
        print(f"  γ_T(t) = {gamma_T(t):+.4f}")
        print(f"  γ_C(t) = {gamma_C(t):+.4f}")
        print(f"  γ_G(t) = {gamma_G(t):+.4f}")

    print("\n--- Base Pair Functions ---")
    t = math.e  # Use e as test time
    print(f"At t = e ≈ {t:.4f}:")
    print(f"  γ_AT(t) = {gamma_AT(t):+.6f}")
    print(f"  γ_CG(t) = {gamma_CG(t):+.6f}")
    print(f"  γ_AG(t) = {gamma_AG(t):+.6f} (mismatch)")

    print("\n--- Sequence Analysis ---")
    seq = "GATCGATC"
    print(f"Sequence: {seq}")
    print(f"Complement: {complement(seq)}")
    print(f"Chargaff ratios: {chargaff_ratio(seq)}")

    print("\n--- Sequence Wave Function ---")
    for t in [1, 2, 5, 10]:
        wave = sequence_wave(seq, t)
        print(f"  Σγ(t={t}) = {wave:.4f}")


if __name__ == "__main__":
    demonstrate_dna_waves()
