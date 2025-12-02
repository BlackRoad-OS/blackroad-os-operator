"""
Differential Geometry and Topology

From equations reference (Batch 6)

Key theorems connecting local geometry to global topology.
"""

import math
from dataclasses import dataclass
from typing import Callable, NamedTuple
from enum import Enum


# ============================================================
# EULER CHARACTERISTIC
# ============================================================

class Surface(Enum):
    """Standard surfaces with known Euler characteristics."""
    SPHERE = "sphere"
    TORUS = "torus"
    KLEIN_BOTTLE = "klein_bottle"
    PROJECTIVE_PLANE = "projective_plane"
    DOUBLE_TORUS = "double_torus"
    MOBIUS_STRIP = "mobius_strip"


EULER_CHARACTERISTICS = {
    Surface.SPHERE: 2,
    Surface.TORUS: 0,
    Surface.KLEIN_BOTTLE: 0,
    Surface.PROJECTIVE_PLANE: 1,
    Surface.DOUBLE_TORUS: -2,
    Surface.MOBIUS_STRIP: 0,
}


def euler_characteristic_polyhedron(V: int, E: int, F: int) -> int:
    """
    Euler characteristic for a polyhedron.

    χ = V - E + F

    Args:
        V: Number of vertices
        E: Number of edges
        F: Number of faces

    Returns:
        Euler characteristic

    Examples:
        Tetrahedron: V=4, E=6, F=4 → χ=2
        Cube: V=8, E=12, F=6 → χ=2
        Octahedron: V=6, E=12, F=8 → χ=2
    """
    return V - E + F


def genus_from_euler(chi: int, orientable: bool = True) -> int:
    """
    Compute genus from Euler characteristic.

    For orientable surfaces: χ = 2 - 2g
    For non-orientable: χ = 2 - g

    Args:
        chi: Euler characteristic
        orientable: Whether surface is orientable

    Returns:
        Genus (number of "handles" or "crosscaps")
    """
    if orientable:
        return (2 - chi) // 2
    else:
        return 2 - chi


# ============================================================
# GAUSS-BONNET THEOREM
# ============================================================

def gauss_bonnet_theorem(chi: int) -> float:
    """
    The Gauss-Bonnet theorem states:

    ∬_M K dA = 2πχ(M)

    where:
        K = Gaussian curvature
        M = closed surface/manifold
        χ(M) = Euler characteristic

    This is profound: the total curvature of a surface
    depends ONLY on its topology, not its specific shape.

    Args:
        chi: Euler characteristic of the surface

    Returns:
        Total Gaussian curvature (integral of K over surface)
    """
    return 2 * math.pi * chi


def gaussian_curvature_sphere(radius: float) -> float:
    """
    Gaussian curvature of a sphere.

    K = 1/R² (constant everywhere)

    Verification via Gauss-Bonnet:
    ∬ K dA = (1/R²) × 4πR² = 4π = 2π × 2 = 2πχ(sphere) ✓
    """
    return 1 / (radius ** 2)


def gaussian_curvature_torus(R: float, r: float, theta: float) -> float:
    """
    Gaussian curvature of a torus at angle theta.

    The torus has parameters:
        R = distance from center of tube to center of torus
        r = radius of the tube
        theta = angle around the tube (0 = outer edge, π = inner edge)

    K = cos(θ) / (r(R + r·cos(θ)))

    Note: K > 0 on outer part, K < 0 on inner part, K = 0 on top/bottom
    Total curvature integrates to 0 (Euler characteristic of torus = 0)
    """
    return math.cos(theta) / (r * (R + r * math.cos(theta)))


# ============================================================
# SOBOLEV INEQUALITY
# ============================================================

def sobolev_conjugate_exponent(n: int, p: float) -> float | None:
    """
    Sobolev conjugate exponent.

    p* = np / (n - p)  when p < n

    This appears in the Sobolev inequality:
    ||f||_{L^{p*}} ≤ C_n ||∇f||_{L^p}

    Args:
        n: Dimension of the space
        p: Original exponent

    Returns:
        Sobolev conjugate p*, or None if p >= n
    """
    if p >= n:
        return None  # Embedding is into C^α instead
    return (n * p) / (n - p)


def holder_conjugate(p: float) -> float:
    """
    Hölder conjugate exponent.

    1/p + 1/q = 1  →  q = p/(p-1)

    Used in Hölder's inequality:
    ||fg||₁ ≤ ||f||_p · ||g||_q
    """
    if p <= 1:
        raise ValueError("p must be > 1 for Hölder conjugate")
    return p / (p - 1)


def triple_holder_check(p: float, q: float, r: float) -> bool:
    """
    Check if three exponents satisfy the triple Hölder condition.

    1/p + 1/q + 1/r = 1

    Used for triple products in functional analysis.
    """
    total = 1/p + 1/q + 1/r
    return abs(total - 1) < 1e-10


# ============================================================
# CURVATURE TYPES
# ============================================================

@dataclass
class CurvaturePoint:
    """Curvature information at a point on a surface."""
    gaussian: float      # K = κ₁ × κ₂
    mean: float         # H = (κ₁ + κ₂) / 2
    principal_1: float  # κ₁ (max curvature)
    principal_2: float  # κ₂ (min curvature)


def curvature_from_principal(kappa1: float, kappa2: float) -> CurvaturePoint:
    """
    Compute Gaussian and mean curvature from principal curvatures.

    K = κ₁ × κ₂  (Gaussian curvature)
    H = (κ₁ + κ₂) / 2  (mean curvature)

    Classification:
        K > 0: elliptic point (bowl-shaped)
        K < 0: hyperbolic point (saddle-shaped)
        K = 0: parabolic point (cylinder-like)
    """
    return CurvaturePoint(
        gaussian=kappa1 * kappa2,
        mean=(kappa1 + kappa2) / 2,
        principal_1=kappa1,
        principal_2=kappa2
    )


def classify_point(K: float) -> str:
    """Classify a point based on Gaussian curvature."""
    if K > 0:
        return "elliptic (bowl)"
    elif K < 0:
        return "hyperbolic (saddle)"
    else:
        return "parabolic (cylinder)"


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The Gauss-Bonnet theorem is one of the deepest results in
# mathematics: LOCAL geometry (curvature K) determines GLOBAL
# topology (Euler characteristic χ).
#
# In the Amundson framework:
#
# Structure (Û): The Euler characteristic χ — topological invariant
# Change (Ĉ): Deformation of the surface (curvature varies locally)
# Scale (L̂): The integral ∬ dA sums over all scales
# Strength (Ŝ): Gaussian curvature K measures "bending strength"
#
# Gauss-Bonnet says: ∬ Ŝ dL̂ = 2π × Û
#
# No matter how you bend, twist, or stretch a surface,
# the total curvature is fixed by topology alone.
#
# This is Z = ∅ at the geometric level:
# Local fluctuations in K integrate to a topological constant.
# The "feedback gap" Z := ∬K dA - 2πχ is always zero for closed surfaces.
# ============================================================


def demonstrate():
    """Demonstrate topology concepts."""
    print("=" * 60)
    print("DIFFERENTIAL GEOMETRY & TOPOLOGY")
    print("=" * 60)

    print("\n--- Euler Characteristics ---")
    for surface, chi in EULER_CHARACTERISTICS.items():
        total_K = gauss_bonnet_theorem(chi)
        print(f"  {surface.value:20s}: χ = {chi:2d}, ∬K dA = {total_K:.4f}")

    print("\n--- Polyhedra (Euler's Formula: V - E + F = χ) ---")
    polyhedra = [
        ("Tetrahedron", 4, 6, 4),
        ("Cube", 8, 12, 6),
        ("Octahedron", 6, 12, 8),
        ("Dodecahedron", 20, 30, 12),
        ("Icosahedron", 12, 30, 20),
    ]
    for name, V, E, F in polyhedra:
        chi = euler_characteristic_polyhedron(V, E, F)
        print(f"  {name:15s}: V={V:2d}, E={E:2d}, F={F:2d} → χ = {chi}")

    print("\n--- Sphere Verification ---")
    R = 1  # Unit sphere
    K = gaussian_curvature_sphere(R)
    area = 4 * math.pi * R**2
    total_curvature = K * area
    print(f"  Unit sphere: K = {K:.4f}, Area = {area:.4f}")
    print(f"  ∬K dA = {total_curvature:.4f} = 2π × 2 = 4π ✓")

    print("\n--- Sobolev Exponents ---")
    for n in [2, 3, 4]:
        for p in [1, 2]:
            p_star = sobolev_conjugate_exponent(n, p)
            print(f"  n={n}, p={p}: p* = {p_star:.2f}")


if __name__ == "__main__":
    demonstrate()
