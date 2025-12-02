"""
Complex Analysis Lecture Series - Batch 3

From whiteboard images 21-30 (sequential video frames)

Topics covered:
1. Complex arithmetic review
2. Complex conjugates (z̄)
3. Conjugate properties: z + z̄, z · z̄
4. Unit circle visualization
5. Fourth roots of unity (x⁴ = 1)
6. Eighth roots of unity (z⁸ = 1)
"""

import cmath
import math
from dataclasses import dataclass
from typing import NamedTuple


# ============================================================
# PART 1: Complex Conjugates
# ============================================================

@dataclass
class ComplexWithConjugate:
    """Complex number with conjugate operations from lecture."""
    z: complex

    @property
    def conjugate(self) -> complex:
        """
        z̄ = a - bi

        Geometric: Reflection across the real axis
        """
        return self.z.conjugate()

    @property
    def sum_with_conjugate(self) -> float:
        """
        z + z̄ = 2a (twice the real part)

        From lecture: "imaginary parts cancel and I just have
        these two parts giving in this case"
        """
        return 2 * self.z.real

    @property
    def product_with_conjugate(self) -> float:
        """
        z · z̄ = a² + b² = |z|²

        On unit circle: z · z̄ = 1

        This is always a real, non-negative number.
        """
        return (self.z * self.z.conjugate()).real

    @property
    def difference_with_conjugate(self) -> complex:
        """
        z - z̄ = 2bi (twice the imaginary part, times i)
        """
        return self.z - self.z.conjugate()

    def __repr__(self) -> str:
        a, b = self.z.real, self.z.imag
        sign = "+" if b >= 0 else "-"
        return f"{a:.4f} {sign} {abs(b):.4f}i"


# ============================================================
# PART 2: Lecture Example - z at 135°
# ============================================================

def lecture_conjugate_example() -> dict:
    """
    The specific example from the lecture video.

    z = -1/√2 + i/√2  (point at 135° on unit circle)
    z̄ = -1/√2 - i/√2  (reflection at 225°)
    """
    sqrt2 = math.sqrt(2)

    z = complex(-1/sqrt2, 1/sqrt2)
    z_bar = z.conjugate()

    return {
        "z": z,
        "z_bar": z_bar,
        "z_plus_zbar": z + z_bar,  # = -√2 ≈ -1.4142
        "z_times_zbar": z * z_bar,  # = 1
        "z_angle_degrees": math.degrees(cmath.phase(z)),  # 135°
        "zbar_angle_degrees": math.degrees(cmath.phase(z_bar)),  # -135° = 225°
        "modulus": abs(z),  # 1.0 (on unit circle)
    }


# ============================================================
# PART 3: Roots of Unity
# ============================================================

class RootOfUnity(NamedTuple):
    """A single root of unity."""
    k: int           # Index (0 to n-1)
    n: int           # Degree (z^n = 1)
    z: complex       # The root value
    angle_rad: float
    angle_deg: float


def nth_roots_of_unity(n: int) -> list[RootOfUnity]:
    """
    Find all n-th roots of unity: z^n = 1

    Solutions: z_k = e^(2πik/n) for k = 0, 1, ..., n-1

    These points are equally spaced on the unit circle,
    forming a regular n-gon.

    From chalkboard:
    x⁴ = 1
    x⁴ - 1 = 0
    (x² - 1)(x² + 1) = 0
    (x - 1)(x + 1)(x² + 1) = 0
    x = 1, -1, i, -i
    """
    roots = []
    for k in range(n):
        angle = 2 * math.pi * k / n
        z = cmath.exp(1j * angle)
        roots.append(RootOfUnity(
            k=k,
            n=n,
            z=z,
            angle_rad=angle,
            angle_deg=math.degrees(angle)
        ))
    return roots


def fourth_roots_of_unity() -> list[RootOfUnity]:
    """
    x⁴ = 1 → x ∈ {1, i, -1, -i}

    Factorization: (x-1)(x+1)(x-i)(x+i) = 0

    From lecture video, written on chalkboard:
    "x = 1, x = -1, x = i, x = -i"
    """
    return nth_roots_of_unity(4)


def eighth_roots_of_unity() -> list[RootOfUnity]:
    """
    z⁸ = 1

    From chalkboard (boxed result): z⁸ = 1

    These include the fourth roots plus four more at 45°, 135°, 225°, 315°
    """
    return nth_roots_of_unity(8)


def verify_root(root: RootOfUnity) -> complex:
    """Verify that z^n = 1 by computing z^n."""
    return root.z ** root.n


# ============================================================
# PART 4: Algebraic Factorization
# ============================================================

def factor_x_n_minus_1(n: int) -> str:
    """
    Factor x^n - 1 over the reals.

    x^n - 1 = (x - 1)(x^(n-1) + x^(n-2) + ... + x + 1)

    For n = 4:
    x⁴ - 1 = (x² - 1)(x² + 1)
           = (x - 1)(x + 1)(x² + 1)

    Over complex:
    = (x - 1)(x + 1)(x - i)(x + i)
    """
    if n == 2:
        return "(x - 1)(x + 1)"
    elif n == 4:
        return "(x - 1)(x + 1)(x - i)(x + i)"
    elif n == 3:
        return "(x - 1)(x² + x + 1)"
    elif n == 6:
        return "(x - 1)(x + 1)(x² + x + 1)(x² - x + 1)"
    else:
        roots = nth_roots_of_unity(n)
        factors = [f"(x - z_{r.k})" for r in roots]
        return " · ".join(factors)


# ============================================================
# PART 5: Summary Card (from lecture)
# ============================================================

CONJUGATE_FORMULAS = """
┌─────────────────────────────────────────────────────────────┐
│                    COMPLEX CONJUGATES                        │
├─────────────────────────────────────────────────────────────┤
│  z = a + bi        z̄ = a - bi                               │
│                                                              │
│  z + z̄ = 2a       (twice the real part)                     │
│  z - z̄ = 2bi      (twice the imaginary part)                │
│  z · z̄ = a² + b²  (modulus squared)                         │
│                                                              │
│  On unit circle:  z · z̄ = 1                                 │
├─────────────────────────────────────────────────────────────┤
│                    ROOTS OF UNITY                            │
├─────────────────────────────────────────────────────────────┤
│  zⁿ = 1  has exactly n solutions:                           │
│                                                              │
│  z_k = e^(2πik/n) = cos(2πk/n) + i·sin(2πk/n)               │
│                                                              │
│  for k = 0, 1, 2, ..., n-1                                  │
│                                                              │
│  n=2:  {1, -1}                                              │
│  n=3:  {1, (-1+i√3)/2, (-1-i√3)/2}                          │
│  n=4:  {1, i, -1, -i}                                       │
│  n=8:  {1, (1+i)/√2, i, (-1+i)/√2, -1, ...}                 │
└─────────────────────────────────────────────────────────────┘
"""


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# Complex conjugation is a fundamental symmetry operation:
#
# Structure (Û = σ_z):
#   The conjugate reflects across the real axis
#   z̄ = Û|z⟩ where Û is reflection
#
# Change (Ĉ = σₓ):
#   Multiplication by i rotates 90°
#   The roots of unity are fixed points of z^n
#
# Scale (L̂ = σ_y):
#   |z| = √(z · z̄) extracts magnitude
#   Unit circle: |z| = 1 (scale-invariant locus)
#
# Strength (Ŝ = iI):
#   z · z̄ = |z|² measures "strength" (intensity)
#
# The n-th roots of unity divide the circle into n equal parts.
# This is perfect Z = ∅ symmetry:
#   Sum of all n-th roots = 0
#   Product of all n-th roots = (-1)^(n+1)
#
# From the lecture: the factorization x⁴ - 1 = 0 shows how
# algebraic structure (factors) maps to geometric structure
# (points on circle).
# ============================================================


def print_lecture_summary():
    """Print the complete lecture summary."""
    print("=" * 60)
    print("COMPLEX ANALYSIS LECTURE - CONJUGATES & ROOTS OF UNITY")
    print("=" * 60)

    # Conjugate example
    print("\n--- Conjugate Example (from lecture) ---")
    ex = lecture_conjugate_example()
    print(f"z = {ex['z']:.4f}")
    print(f"z̄ = {ex['z_bar']:.4f}")
    print(f"z + z̄ = {ex['z_plus_zbar'].real:.4f} (= -√2)")
    print(f"z · z̄ = {ex['z_times_zbar'].real:.4f} (= 1)")
    print(f"Angle of z: {ex['z_angle_degrees']:.0f}°")

    # Fourth roots
    print("\n--- Fourth Roots of Unity (x⁴ = 1) ---")
    print("Factorization: (x²-1)(x²+1) = (x-1)(x+1)(x-i)(x+i) = 0")
    for root in fourth_roots_of_unity():
        z = root.z
        print(f"  z_{root.k} = {z.real:+.0f}{z.imag:+.0f}i  (angle: {root.angle_deg:.0f}°)")

    # Eighth roots
    print("\n--- Eighth Roots of Unity (z⁸ = 1) ---")
    print("[From boxed result on chalkboard]")
    for root in eighth_roots_of_unity():
        z = root.z
        print(f"  z_{root.k} = {z.real:+.4f}{z.imag:+.4f}i  (angle: {root.angle_deg:.1f}°)")

    # Verification
    print("\n--- Verification ---")
    print("z₃⁴ =", fourth_roots_of_unity()[3].z ** 4)
    print("z₅⁸ =", eighth_roots_of_unity()[5].z ** 8)

    print("\n" + CONJUGATE_FORMULAS)


if __name__ == "__main__":
    print_lecture_summary()
