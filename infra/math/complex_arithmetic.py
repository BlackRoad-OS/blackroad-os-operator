"""
Complex Number Arithmetic Reference

From whiteboard images 19-20

Complex numbers extend the reals with i = √(-1), enabling:
- Solution of all polynomial equations
- 2D rotation and scaling
- Quantum mechanics
- Signal processing
"""

import math
from typing import NamedTuple


class ComplexResult(NamedTuple):
    """Result with both rectangular and polar forms."""
    rectangular: complex
    magnitude: float
    angle_rad: float
    angle_deg: float


def add(z1: complex, z2: complex) -> complex:
    """
    Complex addition: (a + bi) + (c + di) = (a+c) + (b+d)i

    Geometric: Vector addition (parallelogram rule)
    """
    return z1 + z2


def subtract(z1: complex, z2: complex) -> complex:
    """
    Complex subtraction: (a + bi) - (c + di) = (a-c) + (b-d)i

    Geometric: Vector subtraction
    """
    return z1 - z2


def multiply(z1: complex, z2: complex) -> ComplexResult:
    """
    Complex multiplication: (a + bi)(c + di) = (ac-bd) + (ad+bc)i

    Geometric: Multiply magnitudes, add angles
    |z1 · z2| = |z1| · |z2|
    arg(z1 · z2) = arg(z1) + arg(z2)

    This is why complex multiplication = rotation + scaling!
    """
    result = z1 * z2
    mag = abs(result)
    angle = math.atan2(result.imag, result.real)

    return ComplexResult(
        rectangular=result,
        magnitude=mag,
        angle_rad=angle,
        angle_deg=math.degrees(angle)
    )


def divide(z1: complex, z2: complex) -> ComplexResult:
    """
    Complex division: (a + bi) / (c + di)

    Multiply by conjugate: = (a + bi)(c - di) / (c² + d²)

    Geometric: Divide magnitudes, subtract angles
    |z1 / z2| = |z1| / |z2|
    arg(z1 / z2) = arg(z1) - arg(z2)
    """
    if z2 == 0:
        raise ZeroDivisionError("Cannot divide by zero")

    result = z1 / z2
    mag = abs(result)
    angle = math.atan2(result.imag, result.real)

    return ComplexResult(
        rectangular=result,
        magnitude=mag,
        angle_rad=angle,
        angle_deg=math.degrees(angle)
    )


def conjugate(z: complex) -> complex:
    """
    Complex conjugate: (a + bi)* = a - bi

    Geometric: Reflection across real axis

    Key property: z · z* = |z|² (always real and non-negative)
    """
    return z.conjugate()


def power(z: complex, n: int) -> ComplexResult:
    """
    Complex power: z^n

    De Moivre's formula: (r·e^(iθ))^n = r^n · e^(inθ)

    |z^n| = |z|^n
    arg(z^n) = n · arg(z)
    """
    result = z ** n
    mag = abs(result)
    angle = math.atan2(result.imag, result.real)

    return ComplexResult(
        rectangular=result,
        magnitude=mag,
        angle_rad=angle,
        angle_deg=math.degrees(angle)
    )


def nth_root(z: complex, n: int, k: int = 0) -> ComplexResult:
    """
    nth root of complex number.

    z^(1/n) has n distinct values!

    For z = r·e^(iθ):
    z^(1/n) = r^(1/n) · e^(i(θ + 2πk)/n) for k = 0, 1, ..., n-1

    Args:
        z: Complex number
        n: Root degree
        k: Which root (0 to n-1)

    Returns:
        The kth nth root
    """
    r = abs(z)
    theta = math.atan2(z.imag, z.real)

    # nth root of magnitude
    r_root = r ** (1/n)

    # Add 2πk to angle before dividing
    angle = (theta + 2 * math.pi * k) / n

    result = complex(r_root * math.cos(angle), r_root * math.sin(angle))

    return ComplexResult(
        rectangular=result,
        magnitude=abs(result),
        angle_rad=angle,
        angle_deg=math.degrees(angle)
    )


def all_nth_roots(z: complex, n: int) -> list[complex]:
    """
    Find all n nth roots of z.

    The roots form a regular n-gon on a circle of radius |z|^(1/n).
    """
    return [nth_root(z, n, k).rectangular for k in range(n)]


def to_polar(z: complex) -> tuple[float, float]:
    """
    Convert to polar form: z = r·e^(iθ)

    Returns:
        (r, θ) where r = |z| and θ = arg(z) in radians
    """
    return (abs(z), math.atan2(z.imag, z.real))


def from_polar(r: float, theta: float) -> complex:
    """
    Convert from polar form: r·e^(iθ) = r(cos θ + i sin θ)

    Args:
        r: Magnitude
        theta: Angle in radians

    Returns:
        Complex number
    """
    return complex(r * math.cos(theta), r * math.sin(theta))


def exp_complex(z: complex) -> complex:
    """
    Complex exponential: e^z = e^(a+bi) = e^a · (cos b + i sin b)

    This connects exponential and trigonometric functions!
    """
    return math.e ** z.real * complex(math.cos(z.imag), math.sin(z.imag))


def log_complex(z: complex, branch: int = 0) -> complex:
    """
    Complex logarithm: ln(z) = ln|z| + i(arg(z) + 2πk)

    Multi-valued! Principal value has k=0.

    Args:
        z: Complex number (not zero)
        branch: Which branch (default 0 = principal)

    Returns:
        Complex logarithm
    """
    if z == 0:
        raise ValueError("log(0) is undefined")

    r, theta = to_polar(z)
    return complex(math.log(r), theta + 2 * math.pi * branch)


# From whiteboard examples
WORKED_EXAMPLES = [
    {
        "problem": "(3 + 4i) + (1 - 2i)",
        "solution": "4 + 2i",
        "method": "Add real and imaginary parts separately"
    },
    {
        "problem": "(2 + 3i)(4 - i)",
        "solution": "8 - 2i + 12i - 3i² = 8 + 10i + 3 = 11 + 10i",
        "method": "FOIL, then i² = -1"
    },
    {
        "problem": "(5 + 2i) / (1 + i)",
        "solution": "(5 + 2i)(1 - i) / (1 + i)(1 - i) = (5 - 5i + 2i - 2i²) / 2 = (7 - 3i) / 2 = 3.5 - 1.5i",
        "method": "Multiply by conjugate of denominator"
    },
    {
        "problem": "√(-9)",
        "solution": "3i",
        "method": "√(-1) = i, so √(-9) = √9 · √(-1) = 3i"
    },
    {
        "problem": "|3 + 4i|",
        "solution": "√(3² + 4²) = √25 = 5",
        "method": "Magnitude = √(a² + b²)"
    }
]


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# Complex numbers are the simplest non-trivial algebra closed
# under all operations (+ - × ÷ √ ^).
#
# The four primitives manifest:
#
# Change (Ĉ = σₓ):
#   Multiplication by i rotates 90°
#   i² = -1 encodes the flip
#
# Structure (Û = σ_z):
#   |z|² = zz* defines the norm
#   Unit circle = structural constraint
#
# Scale (L̂ = σ_y):
#   |z| = magnitude (scaling factor)
#   z/|z| = pure direction (unit)
#
# Strength (Ŝ = iI):
#   Multiplication by a complex number z
#   simultaneously rotates AND scales
#
# The Fundamental Theorem of Algebra:
#   Every polynomial has roots in ℂ
#
# This is Z = ∅ for polynomial equations:
#   f(z) = 0 always has solutions in ℂ
#
# Complex numbers complete the reals the way the Amundson
# framework completes partial physics theories.
# ============================================================


if __name__ == "__main__":
    print("Complex Arithmetic Examples")
    print("=" * 50)

    z1 = complex(3, 4)  # 3 + 4i
    z2 = complex(1, -2)  # 1 - 2i

    print(f"\nz₁ = {z1}")
    print(f"z₂ = {z2}")
    print(f"\nz₁ + z₂ = {add(z1, z2)}")
    print(f"z₁ - z₂ = {subtract(z1, z2)}")

    prod = multiply(z1, z2)
    print(f"z₁ × z₂ = {prod.rectangular}")
    print(f"         magnitude = {prod.magnitude:.4f}")
    print(f"         angle = {prod.angle_deg:.2f}°")

    quot = divide(z1, z2)
    print(f"z₁ / z₂ = {quot.rectangular}")

    print(f"\n|z₁| = {abs(z1)}")  # 5.0
    print(f"z₁* = {conjugate(z1)}")

    print("\n" + "=" * 50)
    print("Cube roots of 8:")
    roots = all_nth_roots(complex(8, 0), 3)
    for i, root in enumerate(roots):
        print(f"  ω_{i} = {root.real:+.4f} {root.imag:+.4f}i")
