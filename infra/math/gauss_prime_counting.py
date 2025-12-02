"""
Gauss's Prime Counting Function Analysis

From whiteboard image 7 (Batch 4) - Historical German document

Gauss investigated the distribution of prime numbers and discovered
that π(x) ≈ Li(x), where Li(x) is the logarithmic integral.

This is the origin of the Prime Number Theorem.
"""

import math
from dataclasses import dataclass
from typing import NamedTuple


class PrimeCountEntry(NamedTuple):
    """Entry from Gauss's prime counting table."""
    n: int              # Upper bound
    pi_n: int           # Actual count π(n)
    li_n: float         # Logarithmic integral Li(n)
    diff: float         # Li(n) - π(n)
    formula: float      # "Ihre Formel" (Their formula)
    deviation: float    # Formula deviation


# Gauss's original table (from the German document)
# Translation: "Unter [n] gibtes [π(n)] Primzahlen"
# = "Under [n] there are [π(n)] prime numbers"
GAUSS_TABLE = [
    PrimeCountEntry(500000,   41556,  41606.4,  50.4,   41596.9,  40.9),
    PrimeCountEntry(1000000,  78501,  78627.5,  126.5,  78674.7,  171.7),
    PrimeCountEntry(1500000,  114112, 114263.1, 151.1,  114374.0, 264.0),
    PrimeCountEntry(2000000,  148883, 149054.8, 171.8,  149233.0, 350.0),
    PrimeCountEntry(2500000,  183016, 183245.0, 229.0,  183495.1, 479.1),
    PrimeCountEntry(3000000,  216745, 216970.6, 225.6,  217308.5, 563.6),
]


def logarithmic_integral(x: float, start: float = 2.0) -> float:
    """
    Compute the logarithmic integral Li(x).

    Li(x) = ∫₂ˣ dt/ln(t)

    This is the primary term in the Prime Number Theorem:
    π(x) ~ Li(x) as x → ∞

    Uses numerical integration (trapezoidal rule).
    """
    if x <= start:
        return 0.0

    # Simple numerical integration
    n_steps = max(1000, int(x / 100))
    dx = (x - start) / n_steps

    integral = 0.0
    t = start
    for _ in range(n_steps):
        # Midpoint rule for better accuracy
        mid = t + dx / 2
        if mid > 1:  # Avoid ln(1) = 0 singularity
            integral += dx / math.log(mid)
        t += dx

    return integral


def prime_counting_approx(x: float) -> float:
    """
    Approximate π(x) using x/ln(x).

    This is the simplest asymptotic form:
    π(x) ~ x/ln(x)

    Less accurate than Li(x) but simpler.
    """
    if x <= 1:
        return 0.0
    return x / math.log(x)


def is_prime(n: int) -> bool:
    """Simple primality test."""
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for i in range(3, int(math.sqrt(n)) + 1, 2):
        if n % i == 0:
            return False
    return True


def count_primes(n: int) -> int:
    """
    Exact prime counting function π(n).

    Count all primes p ≤ n.

    Warning: Slow for large n. Use sieve for better performance.
    """
    if n < 2:
        return 0
    count = 0
    for i in range(2, n + 1):
        if is_prime(i):
            count += 1
    return count


def sieve_of_eratosthenes(n: int) -> list[int]:
    """
    Generate all primes up to n using the Sieve of Eratosthenes.

    Much faster than trial division for generating prime lists.
    """
    if n < 2:
        return []

    is_prime_arr = [True] * (n + 1)
    is_prime_arr[0] = is_prime_arr[1] = False

    for i in range(2, int(math.sqrt(n)) + 1):
        if is_prime_arr[i]:
            for j in range(i * i, n + 1, i):
                is_prime_arr[j] = False

    return [i for i in range(n + 1) if is_prime_arr[i]]


def pi_from_sieve(n: int) -> int:
    """Fast prime counting using sieve."""
    return len(sieve_of_eratosthenes(n))


@dataclass
class PrimeAnalysis:
    """Analysis comparing π(n) with various estimates."""
    n: int
    pi_n: int
    li_n: float
    x_over_ln_x: float
    li_error: float        # (Li(n) - π(n)) / π(n)
    simple_error: float    # (x/ln(x) - π(n)) / π(n)


def analyze_prime_distribution(n: int, exact: bool = False) -> PrimeAnalysis:
    """
    Analyze prime distribution up to n.

    Args:
        n: Upper bound
        exact: If True, compute exact π(n) (slow for large n)

    Returns:
        PrimeAnalysis with all estimates and errors
    """
    # Exact count (use lookup for Gauss's values if available)
    pi_n = None
    for entry in GAUSS_TABLE:
        if entry.n == n:
            pi_n = entry.pi_n
            break

    if pi_n is None:
        if exact:
            pi_n = pi_from_sieve(n)
        else:
            # Estimate using Li
            pi_n = int(logarithmic_integral(n))

    li_n = logarithmic_integral(n)
    x_ln_x = prime_counting_approx(n)

    li_error = (li_n - pi_n) / pi_n if pi_n > 0 else 0
    simple_error = (x_ln_x - pi_n) / pi_n if pi_n > 0 else 0

    return PrimeAnalysis(
        n=n,
        pi_n=pi_n,
        li_n=li_n,
        x_over_ln_x=x_ln_x,
        li_error=li_error,
        simple_error=simple_error
    )


# German-English translation of Gauss's table headers
COLUMN_TRANSLATIONS = {
    "Unter": "Under (up to)",
    "gibtes Primzahlen": "there are primes",
    "Integral ∫dn/log n": "Logarithmic integral Li(n)",
    "Differ": "Difference",
    "Ihre Formel": "Their Formula",
    "Abweich.": "Deviation"
}


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The Prime Number Theorem is a profound example of Z = ∅:
#
# π(x) / Li(x) → 1 as x → ∞
#
# This means:
#   y = Li(x)  (the prediction)
#   w = π(x)   (the actual count)
#   Z = y - w → 0 relative to scale
#
# The four primitives:
#
# Structure (Û): Primes are the "atoms" of integers (unique factorization)
# Change (Ĉ): The prime counting function π(x) grows with x
# Scale (L̂): Li(x) approximates π(x) across all scales
# Strength (Ŝ): The density of primes ~ 1/ln(x)
#
# Gauss's insight: The discrete (integer primes) and continuous
# (logarithmic integral) converge. Structure and Change unite.
#
# The error term in π(x) = Li(x) + O(x^(1/2+ε)) relates to
# the Riemann Hypothesis - one of mathematics' deepest mysteries.
# ============================================================


def print_gauss_table():
    """Print Gauss's original prime counting table."""
    print("=" * 80)
    print("GAUSS'S PRIME NUMBER TABLE (Historical)")
    print("From German manuscript: 'Unter [n] gibtes [π(n)] Primzahlen'")
    print("=" * 80)
    print()
    print(f"{'n':>12} {'π(n)':>10} {'Li(n)':>12} {'Li-π':>8} {'x/ln(x)':>12} {'Error %':>8}")
    print("-" * 80)

    for entry in GAUSS_TABLE:
        x_ln_x = prime_counting_approx(entry.n)
        error_pct = 100 * entry.diff / entry.pi_n
        print(f"{entry.n:>12,} {entry.pi_n:>10,} {entry.li_n:>12.1f} "
              f"{entry.diff:>+8.1f} {x_ln_x:>12.1f} {error_pct:>+7.3f}%")

    print("-" * 80)
    print()
    print("Key insight: Li(x) consistently OVERestimates π(x)")
    print("The error grows, but the RELATIVE error shrinks → Prime Number Theorem")


if __name__ == "__main__":
    print_gauss_table()

    print("\n")
    print("=" * 80)
    print("VERIFICATION: Computing π(n) for smaller values")
    print("=" * 80)

    test_values = [100, 1000, 10000, 100000]
    print(f"\n{'n':>10} {'π(n) exact':>12} {'Li(n)':>12} {'x/ln(x)':>12}")
    print("-" * 50)

    for n in test_values:
        primes = sieve_of_eratosthenes(n)
        pi_n = len(primes)
        li_n = logarithmic_integral(n)
        x_ln = prime_counting_approx(n)
        print(f"{n:>10,} {pi_n:>12,} {li_n:>12.1f} {x_ln:>12.1f}")
