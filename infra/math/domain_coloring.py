"""
Domain Coloring for Complex Function Visualization

From whiteboard image 6 (Batch 4)

Domain coloring maps complex functions to colors:
- Height (brightness/3D): logarithmic scaling of modulus
- Hue (color): argument/phase

This allows visualization of complex functions f: C → C
by coloring the domain based on where each point maps.
"""

import cmath
import math
from dataclasses import dataclass
from typing import Callable


@dataclass
class DomainColorPoint:
    """A point in domain coloring space."""
    z: complex          # Input point
    f_z: complex        # Function value f(z)
    height: float       # log(1 + |f(z)|)
    hue_rad: float      # arg(f(z)) in radians
    hue_deg: float      # arg(f(z)) in degrees
    rgb: tuple[int, int, int]  # Approximate RGB color


def domain_color(z: complex, f: Callable[[complex], complex] = None) -> DomainColorPoint:
    """
    Compute domain coloring for a point z under function f.

    From whiteboard:
        height = log(1 + |ζ|)
        colour = arg(ζ)

    Args:
        z: Complex input point
        f: Complex function (default: identity)

    Returns:
        DomainColorPoint with all visualization data
    """
    if f is None:
        f_z = z
    else:
        try:
            f_z = f(z)
        except (ZeroDivisionError, ValueError):
            # Handle poles/singularities
            f_z = complex(float('inf'), 0)

    # Height: logarithmic scaling of modulus
    # log(1 + |z|) ensures height=0 when |z|=0 and grows slowly
    modulus = abs(f_z)
    if math.isinf(modulus):
        height = float('inf')
    else:
        height = math.log(1 + modulus)

    # Hue: argument (phase angle)
    hue_rad = cmath.phase(f_z)  # Returns [-π, π]
    hue_deg = math.degrees(hue_rad)

    # Convert to RGB (HSV with S=1, V based on height)
    rgb = hue_to_rgb(hue_rad, height)

    return DomainColorPoint(
        z=z,
        f_z=f_z,
        height=height,
        hue_rad=hue_rad,
        hue_deg=hue_deg,
        rgb=rgb
    )


def hue_to_rgb(hue_rad: float, height: float = 1.0) -> tuple[int, int, int]:
    """
    Convert hue (argument) to RGB color.

    Color mapping (counterclockwise from positive real axis):
        0° (0 rad)      → Red/Orange
        90° (π/2 rad)   → Yellow/Green
        180° (π rad)    → Cyan/Blue
        270° (3π/2 rad) → Magenta/Purple

    Args:
        hue_rad: Angle in radians [-π, π]
        height: Brightness scaling (0 to inf, typically 0-3)

    Returns:
        RGB tuple (0-255 each)
    """
    # Normalize hue to [0, 1]
    hue = (hue_rad + math.pi) / (2 * math.pi)

    # Saturation fixed at 1
    saturation = 1.0

    # Value (brightness) based on height, clamped
    value = min(1.0, height / 3.0) if height != float('inf') else 1.0

    # HSV to RGB conversion
    if saturation == 0:
        r = g = b = value
    else:
        h = hue * 6.0
        i = int(h)
        f = h - i
        p = value * (1 - saturation)
        q = value * (1 - saturation * f)
        t = value * (1 - saturation * (1 - f))

        if i == 0:
            r, g, b = value, t, p
        elif i == 1:
            r, g, b = q, value, p
        elif i == 2:
            r, g, b = p, value, t
        elif i == 3:
            r, g, b = p, q, value
        elif i == 4:
            r, g, b = t, p, value
        else:
            r, g, b = value, p, q

    return (int(r * 255), int(g * 255), int(b * 255))


# Standard test functions for domain coloring
def identity(z: complex) -> complex:
    """f(z) = z"""
    return z


def square(z: complex) -> complex:
    """f(z) = z²"""
    return z * z


def cube(z: complex) -> complex:
    """f(z) = z³"""
    return z ** 3


def inverse(z: complex) -> complex:
    """f(z) = 1/z (pole at origin)"""
    return 1 / z


def exponential(z: complex) -> complex:
    """f(z) = e^z"""
    return cmath.exp(z)


def sine(z: complex) -> complex:
    """f(z) = sin(z)"""
    return cmath.sin(z)


def zeta_approx(z: complex, terms: int = 100) -> complex:
    """
    Approximate Riemann zeta function.
    ζ(s) = Σ n^(-s) for Re(s) > 1

    Note: This is a simple approximation, not the analytic continuation.
    """
    if z.real <= 1:
        return complex(float('nan'), float('nan'))
    return sum(n ** (-z) for n in range(1, terms + 1))


# Color wheel reference (from whiteboard diagram)
COLOR_WHEEL = """
        90° = π/2
           ↑
           │ (green-cyan)
           │
180° = π ←─┼─→ 0° = 0 (red-orange)
           │
           │ (blue-magenta)
           ↓
      270° = 3π/2

Standard domain coloring hue assignment:
  arg(z) = 0      → Red
  arg(z) = π/2    → Green/Yellow
  arg(z) = π      → Cyan
  arg(z) = -π/2   → Magenta/Blue
"""


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# Domain coloring reveals the Structure (Û) of complex functions:
#
# - Zeros: Points where all colors meet (hue undefined)
# - Poles: Points where brightness → ∞
# - Branch cuts: Discontinuities in color
# - Periodicity: Repeating color patterns
#
# The four primitives manifest:
#
# Change (Ĉ): The function f transforms the domain
# Structure (Û): Color patterns reveal function structure
# Scale (L̂): Height = log(1 + |z|) maps infinite range to finite
# Strength (Ŝ): Modulus |f(z)| = intensity/brightness
#
# The logarithmic height function is key:
#   log(1 + |z|) ≈ |z| for small |z|
#   log(1 + |z|) ≈ log|z| for large |z|
#
# This is a Scale operator compressing infinite range to visual.
#
# Z = ∅ in domain coloring:
# A conformal map preserves angles → colors vary smoothly
# A singularity breaks conformality → Z ≠ ∅ visible as color chaos
# ============================================================


def describe_point(z: complex, f: Callable[[complex], complex] = None) -> str:
    """Generate human-readable description of domain coloring at z."""
    dc = domain_color(z, f)

    lines = [
        f"Domain Coloring Analysis",
        f"========================",
        f"Input z = {z}",
        f"Output f(z) = {dc.f_z}",
        f"",
        f"Height (brightness): {dc.height:.4f}",
        f"Hue (color): {dc.hue_deg:.1f}°",
        f"RGB: {dc.rgb}",
        f"",
        f"Color interpretation:",
    ]

    # Describe the color based on hue
    deg = dc.hue_deg
    if -22.5 <= deg < 22.5:
        color = "Red (positive real direction)"
    elif 22.5 <= deg < 67.5:
        color = "Orange/Yellow"
    elif 67.5 <= deg < 112.5:
        color = "Green (positive imaginary direction)"
    elif 112.5 <= deg < 157.5:
        color = "Cyan/Teal"
    elif deg >= 157.5 or deg < -157.5:
        color = "Cyan/Blue (negative real direction)"
    elif -157.5 <= deg < -112.5:
        color = "Blue/Purple"
    elif -112.5 <= deg < -67.5:
        color = "Magenta (negative imaginary direction)"
    else:
        color = "Pink/Red"

    lines.append(f"  {color}")

    return "\n".join(lines)


if __name__ == "__main__":
    print("Domain Coloring Examples")
    print("=" * 50)

    # Test points
    test_points = [
        complex(1, 0),    # Positive real
        complex(0, 1),    # Positive imaginary
        complex(-1, 0),   # Negative real
        complex(0, -1),   # Negative imaginary
        complex(1, 1),    # First quadrant
    ]

    print("\nIdentity function f(z) = z:")
    for z in test_points:
        dc = domain_color(z)
        print(f"  z = {z:>8} → hue = {dc.hue_deg:>7.1f}°, RGB = {dc.rgb}")

    print("\nSquare function f(z) = z²:")
    for z in test_points:
        dc = domain_color(z, square)
        print(f"  z = {z:>8} → f(z) = {dc.f_z:>12}, hue = {dc.hue_deg:>7.1f}°")

    print("\n" + COLOR_WHEEL)
