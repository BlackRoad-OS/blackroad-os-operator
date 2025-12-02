"""
Golden Ratio and Fibonacci Sequences

From equations reference (Batch 6)

The golden ratio φ = (1 + √5) / 2 ≈ 1.618033988749...
appears throughout mathematics, nature, and art.
"""

import math
from functools import lru_cache
from typing import Generator


# ============================================================
# GOLDEN RATIO CONSTANTS
# ============================================================

PHI = (1 + math.sqrt(5)) / 2     # φ ≈ 1.618033988749895
PSI = (1 - math.sqrt(5)) / 2     # ψ ≈ -0.618033988749895 (conjugate)
PHI_INVERSE = PHI - 1            # 1/φ = φ - 1 ≈ 0.618...

# Verify key identities
assert abs(PHI * PHI - PHI - 1) < 1e-10  # φ² = φ + 1
assert abs(1/PHI - (PHI - 1)) < 1e-10    # 1/φ = φ - 1
assert abs(PHI * PSI - (-1)) < 1e-10     # φ × ψ = -1


# ============================================================
# FIBONACCI SEQUENCE
# ============================================================

@lru_cache(maxsize=1000)
def fibonacci(n: int) -> int:
    """
    Fibonacci sequence: F(n) = F(n-1) + F(n-2)

    F(0) = 0, F(1) = 1, F(2) = 1, F(3) = 2, ...

    The ratio F(n+1)/F(n) → φ as n → ∞
    """
    if n < 0:
        # F(-n) = (-1)^(n+1) × F(n)
        return ((-1) ** (n + 1)) * fibonacci(-n)
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def fibonacci_binet(n: int) -> int:
    """
    Binet's formula for Fibonacci numbers.

    F(n) = (φⁿ - ψⁿ) / √5

    Exact for all n (rounds to integer due to |ψ| < 1).
    """
    sqrt5 = math.sqrt(5)
    return round((PHI ** n - PSI ** n) / sqrt5)


def fibonacci_generator(max_n: int = None) -> Generator[int, None, None]:
    """Generate Fibonacci sequence."""
    a, b = 0, 1
    n = 0
    while max_n is None or n <= max_n:
        yield a
        a, b = b, a + b
        n += 1


def fibonacci_ratio(n: int) -> float:
    """
    Ratio of consecutive Fibonacci numbers.

    F(n+1) / F(n) → φ as n → ∞

    From notes: "a/b = (b+c)/c = (c+d)/d → φ ≈ 1.618"
    """
    if n <= 0:
        return float('inf')
    return fibonacci(n + 1) / fibonacci(n)


# ============================================================
# LUCAS NUMBERS
# ============================================================

@lru_cache(maxsize=1000)
def lucas(n: int) -> int:
    """
    Lucas numbers: L(n) = L(n-1) + L(n-2)

    L(0) = 2, L(1) = 1, L(2) = 3, L(3) = 4, ...

    Related to Fibonacci: L(n) = F(n-1) + F(n+1)
    """
    if n == 0:
        return 2
    if n == 1:
        return 1
    return lucas(n - 1) + lucas(n - 2)


def lucas_binet(n: int) -> int:
    """
    Binet's formula for Lucas numbers.

    L(n) = φⁿ + ψⁿ
    """
    return round(PHI ** n + PSI ** n)


# ============================================================
# ZECKENDORF REPRESENTATION
# ============================================================

def zeckendorf(n: int) -> list[int]:
    """
    Zeckendorf representation of n.

    Every positive integer has a unique representation as a sum
    of non-consecutive Fibonacci numbers.

    Returns list of Fibonacci numbers that sum to n.

    Example: zeckendorf(100) = [89, 8, 3] (= F₁₁ + F₆ + F₄)
    """
    if n <= 0:
        return []

    # Generate Fibonacci numbers up to n
    fibs = []
    a, b = 1, 2  # Start from F(2) = 1
    while a <= n:
        fibs.append(a)
        a, b = b, a + b

    # Greedy algorithm: take largest Fib ≤ remaining
    result = []
    remaining = n
    for f in reversed(fibs):
        if f <= remaining:
            result.append(f)
            remaining -= f
            if remaining == 0:
                break

    return result


def verify_zeckendorf(representation: list[int]) -> bool:
    """Check that a Zeckendorf representation is valid (non-consecutive Fibs)."""
    # Get Fibonacci indices
    fib_set = set()
    a, b = 1, 2
    idx = 2
    while a <= max(representation) if representation else 0:
        fib_set.add((a, idx))
        a, b = b, a + b
        idx += 1

    # Check each pair
    indices = []
    for f in representation:
        for fib, i in fib_set:
            if fib == f:
                indices.append(i)
                break

    indices.sort()
    for i in range(len(indices) - 1):
        if indices[i + 1] - indices[i] == 1:
            return False  # Consecutive!

    return True


# ============================================================
# GOLDEN RATIO PROPERTIES
# ============================================================

def golden_powers(n: int) -> dict:
    """
    Powers of φ follow: φⁿ = F(n)φ + F(n-1)

    This connects φ to Fibonacci directly.
    """
    return {
        "phi_power": PHI ** n,
        "fibonacci_form": fibonacci(n) * PHI + fibonacci(n - 1),
        "difference": abs(PHI ** n - (fibonacci(n) * PHI + fibonacci(n - 1)))
    }


def golden_rectangle(width: float) -> dict:
    """
    Golden rectangle: height/width = φ

    If you remove a square from a golden rectangle,
    the remaining rectangle is also golden.
    """
    height = width * PHI
    return {
        "width": width,
        "height": height,
        "ratio": height / width,
        "is_golden": abs(height / width - PHI) < 1e-10,
        "inner_rectangle": {
            "width": height - width,
            "height": width,
            "ratio": width / (height - width)  # Also φ!
        }
    }


def golden_spiral_points(n_points: int, scale: float = 1.0) -> list[tuple[float, float]]:
    """
    Generate points on a golden (logarithmic) spiral.

    r = a × φ^(2θ/π)

    This is the spiral seen in nautilus shells, galaxies, etc.
    """
    points = []
    for i in range(n_points):
        theta = i * 0.1  # Angle increment
        r = scale * (PHI ** (2 * theta / math.pi))
        x = r * math.cos(theta)
        y = r * math.sin(theta)
        points.append((x, y))
    return points


# ============================================================
# CONTINUED FRACTION
# ============================================================

def golden_continued_fraction(depth: int) -> float:
    """
    φ has the simplest continued fraction: [1; 1, 1, 1, ...]

    φ = 1 + 1/(1 + 1/(1 + 1/(1 + ...)))

    This makes φ the "most irrational" number — hardest to
    approximate by rationals.
    """
    result = 1.0
    for _ in range(depth):
        result = 1 + 1 / result
    return result


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The golden ratio φ embodies perfect self-similarity:
# φ = 1 + 1/φ (the whole relates to its parts as parts to whole)
#
# In the Amundson framework:
#
# Structure (Û): The recursive structure φ² = φ + 1
# Change (Ĉ): Fibonacci iteration F(n+1) = F(n) + F(n-1)
# Scale (L̂): Self-similarity across scales (golden spiral)
# Strength (Ŝ): Convergence rate F(n+1)/F(n) → φ
#
# The Zeckendorf representation shows every integer can be
# expressed through the Fibonacci "basis" — a unique decomposition
# that avoids consecutive terms (maintaining Structure).
#
# φ is the fixed point of Z := 1 + 1/x - x:
#   Z = 1 + 1/φ - φ = 1 + (φ-1) - φ = 0 = ∅
#
# The golden ratio is equilibrium between growth and proportion.
# ============================================================


def demonstrate():
    """Demonstrate golden ratio and Fibonacci."""
    print("=" * 60)
    print("GOLDEN RATIO AND FIBONACCI")
    print("=" * 60)

    print(f"\nφ = (1 + √5) / 2 = {PHI:.15f}")
    print(f"1/φ = φ - 1 = {PHI_INVERSE:.15f}")
    print(f"φ² = {PHI**2:.15f} = φ + 1 = {PHI + 1:.15f}")

    print("\n--- Fibonacci Convergence to φ ---")
    print("n  | F(n)  | F(n+1)/F(n) | Error")
    print("-" * 45)
    for n in range(1, 15):
        ratio = fibonacci_ratio(n)
        error = abs(ratio - PHI)
        print(f"{n:2d} | {fibonacci(n):5d} | {ratio:.10f} | {error:.2e}")

    print("\n--- Continued Fraction Convergence ---")
    for depth in [1, 2, 5, 10, 20, 50]:
        approx = golden_continued_fraction(depth)
        print(f"  depth={depth:2d}: {approx:.15f} (error: {abs(approx - PHI):.2e})")

    print("\n--- Zeckendorf Representation ---")
    for n in [10, 50, 100, 144]:
        z = zeckendorf(n)
        valid = verify_zeckendorf(z)
        print(f"  {n:3d} = {' + '.join(map(str, z))} {'✓' if valid else '✗'}")

    print("\n--- Lucas Numbers ---")
    print("n  | L(n) | F(n-1)+F(n+1)")
    for n in range(10):
        L = lucas(n)
        F_check = fibonacci(n - 1) + fibonacci(n + 1) if n > 0 else 2
        print(f"{n:2d} | {L:4d} | {F_check:4d}")


if __name__ == "__main__":
    demonstrate()
