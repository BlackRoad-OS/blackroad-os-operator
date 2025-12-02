"""
Born Rule and Quantum Probability

From equations schema (Batch 6 extension)

Max Born (1926): |Ψ|² gives the probability density of finding
a particle at a given position.

This interpretation connects wave functions to measurable reality.
"""

import cmath
import math
from dataclasses import dataclass
from typing import Callable


# ============================================================
# BORN RULE FUNDAMENTALS
# ============================================================

def probability_density(psi: complex) -> float:
    """
    Born's rule: probability density = |Ψ|²

    P(r,t) = ψ*(r,t) × ψ(r,t) = |Ψ(r,t)|²

    This is always real and non-negative.
    """
    return (psi.conjugate() * psi).real


def normalize_wavefunction(psi_values: list[complex], dx: float) -> list[complex]:
    """
    Normalize a wavefunction so that ∫|Ψ|² dx = 1.

    The normalization condition ensures total probability = 1.
    """
    # Calculate current normalization
    total = sum(probability_density(p) * dx for p in psi_values)

    if total == 0:
        raise ValueError("Cannot normalize zero wavefunction")

    # Normalize
    norm_factor = 1 / math.sqrt(total)
    return [p * norm_factor for p in psi_values]


# ============================================================
# WAVE SUPERPOSITION
# ============================================================

@dataclass
class PlaneWave:
    """A plane wave component."""
    amplitude: float    # A
    wavenumber: float   # k
    frequency: float    # ω
    path_length: float  # R (distance traveled)


def plane_wave(A: float, k: float, R: float, omega: float, t: float) -> complex:
    """
    Plane wave: Ψ = A × e^{i(kR - ωt)}

    In real form: A × cos(kR - ωt) + i × A × sin(kR - ωt)
    """
    phase = k * R - omega * t
    return A * cmath.exp(1j * phase)


def double_slit_superposition(
    A1: float, A2: float,
    k: float,
    R1: float, R2: float,
    omega: float, t: float
) -> complex:
    """
    Double slit wave superposition.

    Ψ = A₁e^{i(kR₁ - ωt)} + A₂e^{i(kR₂ - ωt)}

    From notes:
    Ψ = A₁cos(kR₁ - ωt) + A₂cos(kR₂ - ωt)  (real form)
    """
    psi1 = plane_wave(A1, k, R1, omega, t)
    psi2 = plane_wave(A2, k, R2, omega, t)
    return psi1 + psi2


def interference_intensity(
    A: float,
    k: float,
    R1: float, R2: float,
    omega: float, t: float
) -> float:
    """
    Interference pattern intensity for equal amplitudes.

    |Ψ|² = 2A² cos²(k(R₁-R₂)/2) × cos²(ωt)

    The spatial dependence cos²(k(R₁-R₂)/2) creates the
    interference fringes.
    """
    path_diff = R1 - R2
    spatial_factor = math.cos(k * path_diff / 2) ** 2
    temporal_factor = math.cos(omega * t) ** 2
    return 2 * A**2 * spatial_factor * temporal_factor


# ============================================================
# INTERFERENCE CONDITIONS
# ============================================================

def interference_type(path_difference: float, wavelength: float) -> str:
    """
    Determine interference type from path difference.

    Constructive: R₁ - R₂ = nλ (n = 0, 1, 2, ...)
    Destructive:  R₁ - R₂ = (n + ½)λ

    Returns: "constructive", "destructive", or "partial"
    """
    # Normalize to wavelength units
    ratio = path_difference / wavelength

    # Check for integer (constructive)
    if abs(ratio - round(ratio)) < 0.01:
        return "constructive"

    # Check for half-integer (destructive)
    if abs(ratio - round(ratio) - 0.5) < 0.01 or abs(ratio - round(ratio) + 0.5) < 0.01:
        return "destructive"

    return "partial"


def fringe_positions(
    wavelength: float,
    slit_separation: float,
    screen_distance: float,
    n_fringes: int = 5
) -> dict:
    """
    Calculate positions of interference fringes.

    For double slit:
    Bright fringes (constructive): y_n = nλL/d
    Dark fringes (destructive): y_n = (n + ½)λL/d

    Args:
        wavelength: λ
        slit_separation: d
        screen_distance: L

    Returns:
        Dict with bright and dark fringe positions
    """
    bright = []
    dark = []

    for n in range(-n_fringes, n_fringes + 1):
        y_bright = n * wavelength * screen_distance / slit_separation
        bright.append((n, y_bright))

        y_dark = (n + 0.5) * wavelength * screen_distance / slit_separation
        dark.append((n, y_dark))

    return {
        "bright_fringes": bright,
        "dark_fringes": dark,
        "fringe_spacing": wavelength * screen_distance / slit_separation
    }


# ============================================================
# EXPECTATION VALUES
# ============================================================

def expectation_value(
    psi: Callable[[float], complex],
    operator: Callable[[float], float],
    x_min: float, x_max: float,
    n_points: int = 1000
) -> float:
    """
    Calculate expectation value of an operator.

    ⟨A⟩ = ∫ ψ*(x) A ψ(x) dx

    For position: ⟨x⟩ = ∫ ψ*(x) x ψ(x) dx
    For momentum: ⟨p⟩ = ∫ ψ*(x) (-iℏ d/dx) ψ(x) dx
    """
    dx = (x_max - x_min) / n_points
    total = 0.0

    for i in range(n_points):
        x = x_min + (i + 0.5) * dx
        psi_x = psi(x)
        integrand = (psi_x.conjugate() * operator(x) * psi_x).real
        total += integrand * dx

    return total


def position_expectation(
    psi: Callable[[float], complex],
    x_min: float, x_max: float
) -> float:
    """⟨x⟩ = ∫ ψ*(x) x ψ(x) dx"""
    return expectation_value(psi, lambda x: x, x_min, x_max)


def position_squared_expectation(
    psi: Callable[[float], complex],
    x_min: float, x_max: float
) -> float:
    """⟨x²⟩ = ∫ ψ*(x) x² ψ(x) dx"""
    return expectation_value(psi, lambda x: x**2, x_min, x_max)


def position_uncertainty(
    psi: Callable[[float], complex],
    x_min: float, x_max: float
) -> float:
    """
    Position uncertainty: Δx = √(⟨x²⟩ - ⟨x⟩²)
    """
    x_avg = position_expectation(psi, x_min, x_max)
    x2_avg = position_squared_expectation(psi, x_min, x_max)
    variance = x2_avg - x_avg**2
    return math.sqrt(max(0, variance))  # Handle numerical errors


# ============================================================
# EXAMPLE WAVEFUNCTIONS
# ============================================================

def gaussian_wavepacket(x: float, x0: float = 0, sigma: float = 1, k0: float = 0) -> complex:
    """
    Gaussian wavepacket:
    ψ(x) = (1/(2πσ²))^(1/4) × exp(-(x-x₀)²/(4σ²)) × exp(ik₀x)

    Centered at x₀ with width σ and momentum ℏk₀.
    """
    norm = (1 / (2 * math.pi * sigma**2)) ** 0.25
    gaussian = math.exp(-(x - x0)**2 / (4 * sigma**2))
    momentum = cmath.exp(1j * k0 * x)
    return norm * gaussian * momentum


def infinite_well_state(x: float, L: float, n: int = 1) -> complex:
    """
    Particle in infinite square well (0 < x < L).

    ψ_n(x) = √(2/L) × sin(nπx/L)

    Energy: E_n = n²π²ℏ²/(2mL²)
    """
    if x < 0 or x > L:
        return complex(0, 0)

    norm = math.sqrt(2 / L)
    return complex(norm * math.sin(n * math.pi * x / L), 0)


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# Born's rule is the bridge between quantum formalism and observation.
#
# In the Amundson framework:
#
# Structure (Û): The wavefunction Ψ encodes all structural information
# Change (Ĉ): Time evolution via Schrödinger equation
# Scale (L̂): |Ψ|² converts amplitude to probability
# Strength (Ŝ): Probability density = "strength" of finding particle
#
# The collapse postulate connects to Z = ∅:
# Before measurement: Z ≠ ∅ (superposition, multiple possibilities)
# After measurement: Z = ∅ (definite outcome, equilibrium)
#
# Interference demonstrates wave-particle duality:
# - Wave nature: superposition, interference patterns
# - Particle nature: detection at discrete points
#
# The Born rule says: the SQUARE of the wave determines reality.
# This is fundamentally about STRENGTH (Ŝ):
#   Ŝ = |Ψ|² = ψ*ψ
#
# The normalization ∫|Ψ|² = 1 is a Scale (L̂) condition:
# Total probability must integrate to unity across all scales.
# ============================================================


def demonstrate():
    """Demonstrate Born rule concepts."""
    print("=" * 60)
    print("BORN RULE - QUANTUM PROBABILITY")
    print("=" * 60)

    print("\n--- Born's Rule ---")
    print("P(r,t) = |Ψ(r,t)|² = ψ*(r,t) × ψ(r,t)")
    print("Probability = square of wavefunction amplitude")

    print("\n--- Example: Gaussian Wavepacket ---")
    x0, sigma = 0, 1
    for x in [-2, -1, 0, 1, 2]:
        psi = gaussian_wavepacket(x, x0, sigma)
        prob = probability_density(psi)
        print(f"  x = {x:+d}: |ψ|² = {prob:.6f}")

    print("\n--- Double Slit Interference ---")
    wavelength = 500e-9  # 500 nm (green light)
    k = 2 * math.pi / wavelength
    A = 1.0
    omega = 1e15  # Optical frequency
    t = 0

    print("Path differences and interference type:")
    for delta_R in [0, wavelength/4, wavelength/2, 3*wavelength/4, wavelength]:
        R1, R2 = 1.0, 1.0 - delta_R
        psi_total = double_slit_superposition(A, A, k, R1, R2, omega, t)
        intensity = probability_density(psi_total)
        itype = interference_type(delta_R, wavelength)
        print(f"  ΔR = {delta_R/wavelength:.2f}λ: |Ψ|² = {intensity:.3f} ({itype})")

    print("\n--- Fringe Positions ---")
    fringes = fringe_positions(500e-9, 0.1e-3, 1.0)  # 500nm, 0.1mm slits, 1m screen
    print(f"  Fringe spacing: {fringes['fringe_spacing']*1000:.2f} mm")
    print("  Bright fringes at:")
    for n, y in fringes['bright_fringes'][:3]:
        print(f"    n={n}: y = {y*1000:.2f} mm")

    print("\n--- Infinite Well Ground State ---")
    L = 1.0  # nm
    print(f"  Well width L = {L} nm")
    print("  Position expectation:")
    x_avg = position_expectation(lambda x: infinite_well_state(x, L, 1), 0, L)
    print(f"  ⟨x⟩ = {x_avg:.4f} (should be L/2 = {L/2:.4f})")


if __name__ == "__main__":
    demonstrate()
