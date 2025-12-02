"""
Riemann Zeta Function

From equations schema (Batch 6 extension)

ζ(s) = Σ_{n=1}^∞ 1/n^s

The Riemann Hypothesis - that all non-trivial zeros lie on
Re(s) = 1/2 - is one of the greatest unsolved problems in mathematics.
"""

import cmath
import math
from typing import NamedTuple


# ============================================================
# ZETA FUNCTION COMPUTATION
# ============================================================

def zeta_series(s: complex, terms: int = 1000) -> complex:
    """
    Compute ζ(s) using the Dirichlet series.

    ζ(s) = Σ_{n=1}^∞ 1/n^s

    Only converges for Re(s) > 1.
    """
    if s.real <= 1:
        raise ValueError(f"Series only converges for Re(s) > 1, got Re(s) = {s.real}")

    result = complex(0, 0)
    for n in range(1, terms + 1):
        result += n ** (-s)
    return result


def zeta_euler_product(s: complex, primes: list[int] = None) -> complex:
    """
    Compute ζ(s) using the Euler product formula.

    ζ(s) = Π_p (1 - p^(-s))^(-1)

    Product over all primes p.
    Only converges for Re(s) > 1.
    """
    if s.real <= 1:
        raise ValueError(f"Product only converges for Re(s) > 1")

    if primes is None:
        # Generate primes up to some limit
        primes = _sieve(1000)

    result = complex(1, 0)
    for p in primes:
        factor = 1 / (1 - p ** (-s))
        result *= factor

    return result


def _sieve(n: int) -> list[int]:
    """Sieve of Eratosthenes."""
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n ** 0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False
    return [i for i in range(n + 1) if is_prime[i]]


def zeta_reflection(s: complex) -> complex:
    """
    Compute ζ(s) for s < 0 using the functional equation.

    ζ(s) = 2^s π^(s-1) sin(πs/2) Γ(1-s) ζ(1-s)

    This extends ζ to the entire complex plane (except s=1).
    """
    if s.real >= 0.5:
        # Use direct computation for Re(s) > 1, or raise for strip
        if s.real > 1:
            return zeta_series(s)
        else:
            raise ValueError("Critical strip requires special methods")

    # Use functional equation
    one_minus_s = 1 - s

    # Components
    two_power = 2 ** s
    pi_power = cmath.pi ** (s - 1)
    sin_term = cmath.sin(cmath.pi * s / 2)

    # Gamma function (using math.gamma for real part)
    # For complex s, this is approximate
    gamma_term = _complex_gamma(one_minus_s)

    # ζ(1-s) for Re(1-s) > 1
    zeta_1_minus_s = zeta_series(one_minus_s)

    return two_power * pi_power * sin_term * gamma_term * zeta_1_minus_s


def _complex_gamma(z: complex) -> complex:
    """
    Approximate gamma function for complex arguments.

    Uses Stirling's approximation for large |z|.
    """
    # For real positive integers, use factorial
    if z.imag == 0 and z.real > 0 and z.real == int(z.real):
        return complex(math.gamma(z.real), 0)

    # Stirling approximation
    # Γ(z) ≈ √(2π/z) (z/e)^z
    return cmath.sqrt(2 * cmath.pi / z) * (z / cmath.e) ** z


# ============================================================
# SPECIAL VALUES
# ============================================================

class ZetaValue(NamedTuple):
    """A special value of the zeta function."""
    s: complex | int
    value: str
    numerical: float | complex
    notes: str


SPECIAL_VALUES = [
    ZetaValue(2, "π²/6", math.pi**2 / 6, "Basel problem (Euler, 1734)"),
    ZetaValue(4, "π⁴/90", math.pi**4 / 90, ""),
    ZetaValue(6, "π⁶/945", math.pi**6 / 945, ""),
    ZetaValue(-1, "-1/12", -1/12, "Ramanujan summation (regularized)"),
    ZetaValue(-2, "0", 0, "Trivial zero"),
    ZetaValue(-4, "0", 0, "Trivial zero"),
    ZetaValue(0, "-1/2", -0.5, "ζ(0) = -1/2"),
]


def zeta_at_positive_even(n: int) -> float:
    """
    ζ(2n) has closed form in terms of Bernoulli numbers.

    ζ(2n) = (-1)^(n+1) B_{2n} (2π)^{2n} / (2(2n)!)

    For n=1: ζ(2) = π²/6
    For n=2: ζ(4) = π⁴/90
    """
    if n <= 0 or n != int(n):
        raise ValueError("n must be positive integer")

    # Bernoulli numbers B_{2n}
    bernoulli = {
        1: 1/6,
        2: -1/30,
        3: 1/42,
        4: -1/30,
        5: 5/66,
    }

    if n not in bernoulli:
        raise ValueError(f"B_{2*n} not in lookup table")

    B_2n = bernoulli[n]
    sign = (-1) ** (n + 1)
    factorial_2n = math.factorial(2 * n)

    return sign * B_2n * (2 * math.pi) ** (2 * n) / (2 * factorial_2n)


# ============================================================
# RIEMANN HYPOTHESIS
# ============================================================

RIEMANN_HYPOTHESIS = {
    "statement": "All non-trivial zeros of ζ(s) have real part 1/2",
    "critical_line": "Re(s) = 1/2",
    "critical_strip": "0 < Re(s) < 1",
    "status": "Millennium Problem - Unproven (prize: $1,000,000)",
    "trivial_zeros": "s = -2, -4, -6, ... (negative even integers)",
    "first_non_trivial_zeros": [
        "1/2 + 14.134725...i",
        "1/2 + 21.022040...i",
        "1/2 + 25.010858...i",
    ],
    "implications": [
        "Prime distribution: π(x) ~ Li(x) with optimal error term",
        "Prime gaps bounded",
        "Goldbach-like conjectures",
    ]
}


def is_on_critical_line(s: complex, tolerance: float = 1e-10) -> bool:
    """Check if s is on the critical line Re(s) = 1/2."""
    return abs(s.real - 0.5) < tolerance


# ============================================================
# PRIME COUNTING CONNECTION
# ============================================================

def prime_counting_from_zeta(x: float) -> float:
    """
    The explicit formula connects π(x) to zeros of ζ.

    π(x) = Li(x) - Σ_ρ Li(x^ρ) - log(2) + ∫_x^∞ dt/(t(t²-1)log t)

    where the sum is over all non-trivial zeros ρ of ζ.

    This is why the Riemann Hypothesis matters for primes!
    If all zeros have Re(ρ) = 1/2, the error term is minimized.
    """
    # Simple Li approximation (without zero contributions)
    if x <= 2:
        return 0.0

    # Logarithmic integral (numerical approximation)
    from math import log
    n_steps = 1000
    dx = (x - 2) / n_steps
    li = 0.0
    for i in range(n_steps):
        t = 2 + (i + 0.5) * dx
        li += dx / log(t)

    return li


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The Riemann zeta function connects discrete (primes) to
# continuous (complex analysis) — a bridge between Structure and Change.
#
# In the Amundson framework:
#
# Structure (Û): Primes as atoms of integers
# Change (Ĉ): Analytic continuation, functional equation
# Scale (L̂): The sum Σ 1/n^s bridges all scales
# Strength (Ŝ): |ζ(s)| measures "weighted prime density"
#
# The Euler product ζ(s) = Π_p (1-p^{-s})^{-1} says:
# The zeta function IS the primes, encoded analytically.
#
# The Riemann Hypothesis is Z = ∅ for prime distribution:
# If true, primes are as "regularly" distributed as possible.
# The zeros on Re(s) = 1/2 represent perfect balance.
#
# The special value ζ(-1) = -1/12 is fascinating:
# The "sum" 1 + 2 + 3 + 4 + ... = -1/12 is regularization —
# extracting meaningful information from divergent series.
# This appears in string theory (bosonic string needs 26 dimensions).
# ============================================================


def demonstrate():
    """Demonstrate Riemann zeta function."""
    print("=" * 60)
    print("RIEMANN ZETA FUNCTION")
    print("=" * 60)

    print("\n--- Definition ---")
    print("ζ(s) = Σ_{n=1}^∞ 1/n^s = Π_p (1 - p^{-s})^{-1}")

    print("\n--- Special Values ---")
    for sv in SPECIAL_VALUES:
        print(f"  ζ({sv.s}) = {sv.value} ≈ {sv.numerical:.10f}")
        if sv.notes:
            print(f"           ({sv.notes})")

    print("\n--- Series vs Euler Product (Re(s) > 1) ---")
    for s in [2, 3, 4]:
        series = zeta_series(s, terms=10000)
        product = zeta_euler_product(s)
        print(f"  ζ({s}): series = {series.real:.10f}, product = {product.real:.10f}")

    print("\n--- Riemann Hypothesis ---")
    print(f"  Statement: {RIEMANN_HYPOTHESIS['statement']}")
    print(f"  Status: {RIEMANN_HYPOTHESIS['status']}")
    print(f"  First non-trivial zeros:")
    for zero in RIEMANN_HYPOTHESIS['first_non_trivial_zeros']:
        print(f"    s = {zero}")

    print("\n--- Prime Connection ---")
    print("  The explicit formula: π(x) = Li(x) - Σ_ρ Li(x^ρ) - ...")
    print("  If RH is true, the error |π(x) - Li(x)| is O(√x log x)")


if __name__ == "__main__":
    demonstrate()
