"""
Unit Circle - Complete Reference

From whiteboard images 15-16

The unit circle is the foundation of trigonometry, complex analysis,
and rotational mechanics. All angles, all waves, all rotations
reduce to motion on this circle.
"""

import math
from typing import NamedTuple
from dataclasses import dataclass


class TrigValues(NamedTuple):
    """Trigonometric values at a given angle."""
    degrees: float
    radians: float
    sin: float
    cos: float
    tan: float | None  # None when undefined
    cot: float | None
    sec: float | None
    csc: float | None


@dataclass
class UnitCirclePoint:
    """A point on the unit circle."""
    degrees: int
    radians_str: str
    radians: float
    cos: float  # x-coordinate
    sin: float  # y-coordinate

    @property
    def coordinates(self) -> tuple[float, float]:
        return (self.cos, self.sin)

    @property
    def complex(self) -> complex:
        """As complex number: e^(iθ) = cos(θ) + i·sin(θ)"""
        return complex(self.cos, self.sin)


# Standard unit circle values (exact)
# Using symbolic representations where possible

# Square root constants
SQRT2_2 = math.sqrt(2) / 2  # ≈ 0.7071
SQRT3_2 = math.sqrt(3) / 2  # ≈ 0.8660
SQRT3_3 = math.sqrt(3) / 3  # ≈ 0.5774 (= 1/√3)
SQRT3 = math.sqrt(3)        # ≈ 1.7321


UNIT_CIRCLE: list[UnitCirclePoint] = [
    # Quadrant I (0° to 90°)
    UnitCirclePoint(0,   "0",       0,            1,        0),
    UnitCirclePoint(30,  "π/6",     math.pi/6,    SQRT3_2,  0.5),
    UnitCirclePoint(45,  "π/4",     math.pi/4,    SQRT2_2,  SQRT2_2),
    UnitCirclePoint(60,  "π/3",     math.pi/3,    0.5,      SQRT3_2),
    UnitCirclePoint(90,  "π/2",     math.pi/2,    0,        1),

    # Quadrant II (90° to 180°)
    UnitCirclePoint(120, "2π/3",    2*math.pi/3,  -0.5,     SQRT3_2),
    UnitCirclePoint(135, "3π/4",    3*math.pi/4,  -SQRT2_2, SQRT2_2),
    UnitCirclePoint(150, "5π/6",    5*math.pi/6,  -SQRT3_2, 0.5),
    UnitCirclePoint(180, "π",       math.pi,      -1,       0),

    # Quadrant III (180° to 270°)
    UnitCirclePoint(210, "7π/6",    7*math.pi/6,  -SQRT3_2, -0.5),
    UnitCirclePoint(225, "5π/4",    5*math.pi/4,  -SQRT2_2, -SQRT2_2),
    UnitCirclePoint(240, "4π/3",    4*math.pi/3,  -0.5,     -SQRT3_2),
    UnitCirclePoint(270, "3π/2",    3*math.pi/2,  0,        -1),

    # Quadrant IV (270° to 360°)
    UnitCirclePoint(300, "5π/3",    5*math.pi/3,  0.5,      -SQRT3_2),
    UnitCirclePoint(315, "7π/4",    7*math.pi/4,  SQRT2_2,  -SQRT2_2),
    UnitCirclePoint(330, "11π/6",   11*math.pi/6, SQRT3_2,  -0.5),
    UnitCirclePoint(360, "2π",      2*math.pi,    1,        0),
]


def get_trig_values(degrees: float) -> TrigValues:
    """
    Calculate all six trig functions for any angle.

    Args:
        degrees: Angle in degrees

    Returns:
        TrigValues with all six functions
    """
    radians = math.radians(degrees)
    sin_val = math.sin(radians)
    cos_val = math.cos(radians)

    # Handle undefined cases
    tan_val = sin_val / cos_val if abs(cos_val) > 1e-10 else None
    cot_val = cos_val / sin_val if abs(sin_val) > 1e-10 else None
    sec_val = 1 / cos_val if abs(cos_val) > 1e-10 else None
    csc_val = 1 / sin_val if abs(sin_val) > 1e-10 else None

    return TrigValues(
        degrees=degrees,
        radians=radians,
        sin=sin_val,
        cos=cos_val,
        tan=tan_val,
        cot=cot_val,
        sec=sec_val,
        csc=csc_val
    )


# Exact values for special angles (as fractions/roots)
EXACT_VALUES = {
    # (degrees): (sin, cos, tan) as strings
    0:   ("0",       "1",       "0"),
    30:  ("1/2",     "√3/2",    "√3/3"),
    45:  ("√2/2",    "√2/2",    "1"),
    60:  ("√3/2",    "1/2",     "√3"),
    90:  ("1",       "0",       "undef"),
    120: ("√3/2",    "-1/2",    "-√3"),
    135: ("√2/2",    "-√2/2",   "-1"),
    150: ("1/2",     "-√3/2",   "-√3/3"),
    180: ("0",       "-1",      "0"),
    210: ("-1/2",    "-√3/2",   "√3/3"),
    225: ("-√2/2",   "-√2/2",   "1"),
    240: ("-√3/2",   "-1/2",    "√3"),
    270: ("-1",      "0",       "undef"),
    300: ("-√3/2",   "1/2",     "-√3"),
    315: ("-√2/2",   "√2/2",    "-1"),
    330: ("-1/2",    "√3/2",    "-√3/3"),
    360: ("0",       "1",       "0"),
}


def quadrant(degrees: float) -> int:
    """
    Determine which quadrant an angle falls in.

    Quadrant I:   0° < θ < 90°   (sin+, cos+)
    Quadrant II:  90° < θ < 180° (sin+, cos-)
    Quadrant III: 180° < θ < 270° (sin-, cos-)
    Quadrant IV:  270° < θ < 360° (sin-, cos+)
    """
    # Normalize to 0-360
    d = degrees % 360
    if d == 0 or d == 360:
        return 1  # On positive x-axis
    elif d == 90:
        return 1  # On positive y-axis (between I and II)
    elif d == 180:
        return 2  # On negative x-axis
    elif d == 270:
        return 3  # On negative y-axis
    elif 0 < d < 90:
        return 1
    elif 90 < d < 180:
        return 2
    elif 180 < d < 270:
        return 3
    else:
        return 4


def reference_angle(degrees: float) -> float:
    """
    Find the reference angle (acute angle to x-axis).

    The reference angle is always between 0° and 90°.
    """
    d = degrees % 360
    q = quadrant(d)

    if q == 1:
        return d
    elif q == 2:
        return 180 - d
    elif q == 3:
        return d - 180
    else:  # q == 4
        return 360 - d


def euler_identity(theta: float) -> complex:
    """
    Euler's formula: e^(iθ) = cos(θ) + i·sin(θ)

    Special case at θ = π: e^(iπ) + 1 = 0

    Args:
        theta: Angle in radians

    Returns:
        Complex number on the unit circle
    """
    return complex(math.cos(theta), math.sin(theta))


def nth_roots_of_unity(n: int) -> list[complex]:
    """
    Find the nth roots of unity: z^n = 1

    Solutions: z_k = e^(2πik/n) for k = 0, 1, ..., n-1

    These are equally spaced points on the unit circle.

    Args:
        n: Degree of the root

    Returns:
        List of n complex numbers
    """
    return [euler_identity(2 * math.pi * k / n) for k in range(n)]


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The unit circle embodies all four primitives:
#
# Change (Ĉ = σₓ):
#   Rotation around the circle = continuous change
#   The derivative of position IS velocity
#
# Structure (Û = σ_z):
#   The circle itself = fixed geometric constraint
#   x² + y² = 1 is the structural equation
#
# Scale (L̂ = σ_y):
#   Radius = 1 (unit scale)
#   Projection onto axes = scaling from circle to line
#
# Strength (Ŝ = iI):
#   |z| = 1 for all points (constant magnitude)
#   The "strength" of a unit vector is its direction, not magnitude
#
# Euler's identity e^(iπ) + 1 = 0 connects:
#   - e (Change/growth)
#   - i (imaginary unit / rotation)
#   - π (Structure/circle)
#   - 1 (Scale/unity)
#   - 0 (Z = ∅ / equilibrium)
#
# The unit circle is Z = ∅ for rotation - perfectly balanced.
# ============================================================


def print_unit_circle():
    """Print the complete unit circle reference table."""
    print("=" * 70)
    print("UNIT CIRCLE - COMPLETE REFERENCE")
    print("=" * 70)
    print(f"{'Deg':>4} {'Rad':>7} {'cos (x)':>12} {'sin (y)':>12} {'tan':>12}")
    print("-" * 70)

    for pt in UNIT_CIRCLE:
        exact = EXACT_VALUES.get(pt.degrees, ("?", "?", "?"))
        print(f"{pt.degrees:>4}° {pt.radians_str:>7} {exact[1]:>12} {exact[0]:>12} {exact[2]:>12}")

    print("-" * 70)
    print("\nKey identities:")
    print("  sin²θ + cos²θ = 1")
    print("  tan θ = sin θ / cos θ")
    print("  e^(iθ) = cos θ + i·sin θ  (Euler)")
    print("  e^(iπ) + 1 = 0  (Euler's identity)")


if __name__ == "__main__":
    print_unit_circle()

    print("\n\nRoots of unity examples:")
    for n in [2, 3, 4, 6]:
        roots = nth_roots_of_unity(n)
        print(f"\n{n}th roots of 1:")
        for k, z in enumerate(roots):
            print(f"  ω_{k} = {z.real:+.4f} {z.imag:+.4f}i")
