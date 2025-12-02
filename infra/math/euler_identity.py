"""
Euler's Identity and Algebraic Explorations

From whiteboard image 1 (Batch 5)

The "most beautiful equation in mathematics":
    e^(πi) + 1 = 0

Connecting five fundamental constants:
- e (Euler's number, base of natural logarithm)
- π (pi, ratio of circumference to diameter)
- i (imaginary unit, √-1)
- 1 (multiplicative identity)
- 0 (additive identity)
"""

import cmath
import math
from dataclasses import dataclass
from typing import Callable


# ============================================================
# EULER'S IDENTITY
# ============================================================

def verify_euler_identity() -> complex:
    """
    Verify e^(πi) + 1 = 0

    From Euler's formula: e^(ix) = cos(x) + i·sin(x)
    At x = π: e^(iπ) = cos(π) + i·sin(π) = -1 + 0i = -1
    Therefore: e^(iπ) + 1 = 0
    """
    result = cmath.exp(1j * math.pi) + 1
    return result  # Should be ~0 (within floating point precision)


def euler_formula(x: float) -> complex:
    """
    Euler's formula: e^(ix) = cos(x) + i·sin(x)

    This is the generalization from which the identity derives.
    """
    return cmath.exp(1j * x)


# Special values
EULER_IDENTITY_CONSTANTS = {
    "e": math.e,           # 2.718281828...
    "pi": math.pi,         # 3.141592653...
    "i": 1j,               # √-1
    "1": 1,                # Unity
    "0": 0,                # Zero
}


# ============================================================
# ALGEBRAIC EXPANSIONS (from whiteboard)
# ============================================================

def expand_square_of_sum(a: float, b: float, c: float) -> dict:
    """
    (a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca

    From whiteboard: exploring the algebra beneath transcendentals.
    """
    lhs = (a + b + c) ** 2
    rhs = a**2 + b**2 + c**2 + 2*a*b + 2*b*c + 2*c*a

    return {
        "a": a, "b": b, "c": c,
        "lhs": lhs,
        "rhs": rhs,
        "a²": a**2, "b²": b**2, "c²": c**2,
        "2ab": 2*a*b, "2bc": 2*b*c, "2ca": 2*c*a,
        "equal": abs(lhs - rhs) < 1e-10
    }


def sum_of_reciprocals(a: float, b: float, c: float) -> float | None:
    """
    1/a + 1/b + 1/c = (bc + ac + ab) / abc

    From whiteboard: "1/a + 1/b + 1/c = ?"

    Returns None if abc = 0 (undefined).
    """
    if a * b * c == 0:
        return None  # Division by zero

    return (b*c + a*c + a*b) / (a * b * c)


def sophie_germain_identity(a: float, b: float, c: float) -> dict:
    """
    Sophie Germain's identity:
    a³ + b³ + c³ - 3abc = ½(a+b+c)[(a-b)² + (b-c)² + (c-a)²]

    From whiteboard image 2 & 5.

    Special case: If a + b + c = 0, then a³ + b³ + c³ = 3abc
    """
    lhs = a**3 + b**3 + c**3 - 3*a*b*c
    rhs = 0.5 * (a + b + c) * ((a-b)**2 + (b-c)**2 + (c-a)**2)

    return {
        "a": a, "b": b, "c": c,
        "a³+b³+c³-3abc": lhs,
        "½(a+b+c)[(a-b)²+(b-c)²+(c-a)²]": rhs,
        "equal": abs(lhs - rhs) < 1e-10,
        "sum_is_zero": abs(a + b + c) < 1e-10,
        "special_case": "a³+b³+c³=3abc" if abs(a + b + c) < 1e-10 else None
    }


def cubic_factorization(p: float, q: float, r: float) -> dict:
    """
    (x+p)(x+q)(x+r) = x³ + (p+q+r)x² + (pq+qr+rp)x + pqr

    From whiteboard: Vieta's formulas for cubic polynomials.

    If x³ + ax² + bx + c = 0 has roots -p, -q, -r, then:
    - a = p + q + r (sum of roots)
    - b = pq + qr + rp (sum of products of pairs)
    - c = pqr (product of roots)
    """
    return {
        "roots": (-p, -q, -r),
        "sum_of_roots": p + q + r,
        "sum_of_products": p*q + q*r + r*p,
        "product_of_roots": p * q * r,
        "polynomial_coefficients": {
            "x³": 1,
            "x²": p + q + r,
            "x¹": p*q + q*r + r*p,
            "x⁰": p * q * r
        }
    }


# ============================================================
# TRANSCENDENTAL MAGIC SQUARE
# ============================================================

def transcendental_matrix() -> list[list[float]]:
    """
    From whiteboard image 3:

    ┌─────┬─────┬─────┐
    │  1  │  0  │  π  │
    │  π  │  1  │  e  │
    │  e  │  π  │  1  │
    └─────┴─────┴─────┘

    Not a magic square, but interesting structure:
    - Diagonal is all 1s (identity)
    - e and π in symmetric positions
    """
    return [
        [1,       0,       math.pi],
        [math.pi, 1,       math.e],
        [math.e,  math.pi, 1]
    ]


def analyze_transcendental_matrix() -> dict:
    """Analyze properties of the transcendental matrix."""
    M = transcendental_matrix()

    # Convert to work with
    import numpy as np
    A = np.array(M)

    row_sums = A.sum(axis=1)
    col_sums = A.sum(axis=0)
    diag_sum = np.trace(A)
    anti_diag_sum = np.trace(np.fliplr(A))

    # Determinant
    det = np.linalg.det(A)

    # Eigenvalues
    eigenvalues = np.linalg.eigvals(A)

    return {
        "matrix": M,
        "row_sums": row_sums.tolist(),
        "col_sums": col_sums.tolist(),
        "main_diagonal": [M[i][i] for i in range(3)],
        "main_diagonal_sum": diag_sum,
        "anti_diagonal_sum": anti_diag_sum,
        "determinant": det,
        "eigenvalues": eigenvalues.tolist(),
        "is_magic_square": len(set(row_sums)) == 1 and row_sums[0] == col_sums[0]
    }


# ============================================================
# TRINARY MATRIX (from image 2)
# ============================================================

def trinary_matrix() -> list[list]:
    """
    From whiteboard image 2:

    ┌─────┬─────┬─────┐
    │  C  │  -1 │  1  │
    │  -1 │  1  │  0  │
    │  1  │  C  │  -1 │
    └─────┴─────┴─────┘

    Where C is some constant (possibly representing a variable
    or special value in the trinary system {-1, 0, +1}).
    """
    C = "C"  # Placeholder for unknown constant
    return [
        [C,  -1,  1],
        [-1,  1,  0],
        [1,   C, -1]
    ]


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# Euler's identity e^(πi) + 1 = 0 is the ultimate Z = ∅:
#
# All five constants combine to produce zero — perfect equilibrium.
#
# The four primitives are ALL present:
#
# Change (Ĉ): e^x is the eigenfunction of d/dx (rate of change)
# Structure (Û): π defines circular geometry (structure)
# Scale (L̂): i rotates through the complex plane (scaling by 90°)
# Strength (Ŝ): 1 is the unit of magnitude
#
# The equation says:
#   Growth (e) rotating through geometry (π) via complexity (i)
#   plus unity (1) equals nothing (0)
#
# This is A0 at the deepest level:
#   Z := yw - w = 0
#   where y = e^(πi), w = -1
#   yw = e^(πi) · (-1) = (-1)(-1) = 1
#   Z = 1 - 1 = 0 ✓
#
# Sophie Germain's identity shows how cubes relate to products:
#   a³ + b³ + c³ - 3abc measures "deviation from balance"
#   When a + b + c = 0, cubes equal 3× product (perfect balance)
# ============================================================


def demonstrate_euler():
    """Demonstrate Euler's identity and related algebra."""
    print("=" * 60)
    print("EULER'S IDENTITY: e^(πi) + 1 = 0")
    print("=" * 60)

    result = verify_euler_identity()
    print(f"\ne^(πi) + 1 = {result}")
    print(f"Magnitude: {abs(result):.2e} (should be ~0)")

    print("\n--- Euler's Formula at Special Angles ---")
    angles = [0, math.pi/6, math.pi/4, math.pi/3, math.pi/2, math.pi]
    for theta in angles:
        z = euler_formula(theta)
        print(f"e^(i·{theta:.4f}) = {z.real:+.4f} {z.imag:+.4f}i")

    print("\n--- Sophie Germain Identity ---")
    # Test with random values
    result = sophie_germain_identity(2, 3, 5)
    print(f"a=2, b=3, c=5:")
    print(f"  a³+b³+c³-3abc = {result['a³+b³+c³-3abc']}")
    print(f"  ½(a+b+c)[...] = {result['½(a+b+c)[(a-b)²+(b-c)²+(c-a)²]']}")
    print(f"  Equal: {result['equal']}")

    # Special case: a + b + c = 0
    result2 = sophie_germain_identity(1, 2, -3)
    print(f"\na=1, b=2, c=-3 (sum=0):")
    print(f"  a³+b³+c³ = {1**3 + 2**3 + (-3)**3}")
    print(f"  3abc = {3 * 1 * 2 * (-3)}")
    print(f"  Special case: {result2['special_case']}")


if __name__ == "__main__":
    demonstrate_euler()
