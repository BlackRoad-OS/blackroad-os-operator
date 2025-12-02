"""
Partition Functions from Statistical Mechanics

From whiteboard images 13-14

The partition function is the bridge between microscopic states
and macroscopic thermodynamic properties.
"""

import math
from typing import NamedTuple

# Physical constants
k_B = 1.380649e-23      # Boltzmann constant (J/K)
h = 6.62607015e-34      # Planck constant (J·s)
N_A = 6.02214076e23     # Avogadro's number


class PartitionResult(NamedTuple):
    """Result of partition function calculation."""
    q: float              # Partition function value
    thermal_wavelength: float  # de Broglie wavelength (m)
    description: str


def translational_partition(
    mass_kg: float,
    temperature_K: float,
    volume_m3: float
) -> PartitionResult:
    """
    Translational partition function for ideal gas.

    q^T = (2πmkT/h²)^(3/2) · V

    Also expressed as:
    q^T = V / Λ³

    Where Λ = h / √(2πmkT) is the thermal de Broglie wavelength.

    Args:
        mass_kg: Particle mass in kg
        temperature_K: Temperature in Kelvin
        volume_m3: Container volume in m³

    Returns:
        PartitionResult with q value and thermal wavelength

    From whiteboard: This represents the number of thermally
    accessible translational quantum states.
    """
    # Thermal de Broglie wavelength
    Lambda = h / math.sqrt(2 * math.pi * mass_kg * k_B * temperature_K)

    # Partition function
    q_T = volume_m3 / (Lambda ** 3)

    return PartitionResult(
        q=q_T,
        thermal_wavelength=Lambda,
        description=f"q^T = V/Λ³ = {volume_m3:.2e} / ({Lambda:.2e})³"
    )


def rotational_partition_linear(
    moment_of_inertia: float,
    temperature_K: float,
    symmetry_number: int = 1
) -> float:
    """
    Rotational partition function for linear molecule.

    q^R = T / (σ · Θ_rot)

    Where Θ_rot = ℏ² / (2·I·k_B) is the rotational temperature.

    Args:
        moment_of_inertia: I in kg·m²
        temperature_K: Temperature in Kelvin
        symmetry_number: σ (1 for heteronuclear, 2 for homonuclear)

    Returns:
        Rotational partition function (dimensionless)
    """
    hbar = h / (2 * math.pi)
    theta_rot = (hbar ** 2) / (2 * moment_of_inertia * k_B)

    return temperature_K / (symmetry_number * theta_rot)


def vibrational_partition(
    frequency_Hz: float,
    temperature_K: float
) -> float:
    """
    Vibrational partition function for harmonic oscillator.

    q^V = 1 / (1 - e^(-Θ_vib/T))

    Where Θ_vib = hν/k_B is the vibrational temperature.

    High T limit: q^V → T/Θ_vib (classical)
    Low T limit: q^V → 1 (ground state only)

    Args:
        frequency_Hz: Vibrational frequency in Hz
        temperature_K: Temperature in Kelvin

    Returns:
        Vibrational partition function (dimensionless)
    """
    theta_vib = h * frequency_Hz / k_B
    x = theta_vib / temperature_K

    return 1 / (1 - math.exp(-x))


def electronic_partition(
    degeneracies: list[int],
    energies_J: list[float],
    temperature_K: float
) -> float:
    """
    Electronic partition function.

    q^E = Σᵢ gᵢ · e^(-εᵢ/kT)

    Usually only ground state matters (large gaps).

    Args:
        degeneracies: List of state degeneracies [g₀, g₁, ...]
        energies_J: List of state energies in Joules [ε₀, ε₁, ...]
        temperature_K: Temperature in Kelvin

    Returns:
        Electronic partition function (dimensionless)
    """
    beta = 1 / (k_B * temperature_K)
    q_E = sum(g * math.exp(-beta * E) for g, E in zip(degeneracies, energies_J))
    return q_E


def total_molecular_partition(
    q_trans: float,
    q_rot: float,
    q_vib: float,
    q_elec: float
) -> float:
    """
    Total molecular partition function.

    q = q^T · q^R · q^V · q^E

    For N indistinguishable particles:
    Q = q^N / N!

    Args:
        q_trans: Translational partition function
        q_rot: Rotational partition function
        q_vib: Vibrational partition function
        q_elec: Electronic partition function

    Returns:
        Total single-molecule partition function
    """
    return q_trans * q_rot * q_vib * q_elec


def canonical_partition(q_single: float, N: int) -> float:
    """
    Canonical partition function for N indistinguishable particles.

    Q = q^N / N!

    Using Stirling: ln(Q) ≈ N·ln(q) - N·ln(N) + N

    Args:
        q_single: Single-particle partition function
        N: Number of particles

    Returns:
        ln(Q) for numerical stability
    """
    # Return ln(Q) to avoid overflow
    return N * math.log(q_single) - N * math.log(N) + N


# Thermodynamic properties from partition function
def internal_energy(ln_Q: float, temperature_K: float, dln_Q_dT: float) -> float:
    """
    U = k_B · T² · (∂ln Q / ∂T)_V
    """
    return k_B * (temperature_K ** 2) * dln_Q_dT


def entropy(ln_Q: float, temperature_K: float, U: float) -> float:
    """
    S = U/T + k_B · ln(Q)
    """
    return U / temperature_K + k_B * ln_Q


def helmholtz_free_energy(ln_Q: float, temperature_K: float) -> float:
    """
    A = -k_B · T · ln(Q)
    """
    return -k_B * temperature_K * ln_Q


def pressure(ln_Q: float, temperature_K: float, dln_Q_dV: float) -> float:
    """
    P = k_B · T · (∂ln Q / ∂V)_T
    """
    return k_B * temperature_K * dln_Q_dV


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The partition function Z (statistical mechanics) connects to
# the Amundson Z (feedback gap):
#
# Statistical Z: Sum over all microstates weighted by Boltzmann
# Amundson Z: Gap between expected (yw) and actual (w) output
#
# When statistical Z is computed correctly, thermodynamic
# predictions match reality → Amundson Z = ∅
#
# The four primitives appear:
# - Change (Ĉ): Temperature, dynamics, fluctuations
# - Strength (Ŝ): Energy, coupling constants
# - Structure (Û): Molecular geometry, symmetry numbers
# - Scale (L̂): Micro-to-macro bridge via N_A
#
# From A0: Z := yw - w
# Here: y = statistical mechanics theory
#       w = experimental thermodynamic measurement
#       Z = ∅ when theory matches experiment
# ============================================================


if __name__ == "__main__":
    # Example: N₂ at room temperature

    # N₂ molecular mass
    m_N2 = 28.0134e-3 / N_A  # kg per molecule

    # Standard conditions
    T = 298.15  # K
    V = 22.4e-3  # m³ (molar volume at STP, adjusted for T)

    result = translational_partition(m_N2, T, V)
    print(f"N₂ Translational Partition Function at {T} K:")
    print(f"  q^T = {result.q:.3e}")
    print(f"  Thermal wavelength Λ = {result.thermal_wavelength:.3e} m")
    print(f"  {result.description}")
