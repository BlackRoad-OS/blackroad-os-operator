"""
Integer Partition Function

From equations reference (Batch 6)

The Hardy-Ramanujan-Rademacher formula for p(n),
the number of ways to write n as a sum of positive integers.
"""

import math
from functools import lru_cache
from typing import Generator


# ============================================================
# BASIC PARTITION COUNTING
# ============================================================

@lru_cache(maxsize=10000)
def partition_count(n: int) -> int:
    """
    Count the number of partitions of n using dynamic programming.

    p(n) = number of ways to write n as sum of positive integers
    (order doesn't matter)

    Examples:
        p(1) = 1: {1}
        p(2) = 2: {2}, {1,1}
        p(3) = 3: {3}, {2,1}, {1,1,1}
        p(4) = 5: {4}, {3,1}, {2,2}, {2,1,1}, {1,1,1,1}
        p(5) = 7: {5}, {4,1}, {3,2}, {3,1,1}, {2,2,1}, {2,1,1,1}, {1,1,1,1,1}
    """
    if n < 0:
        return 0
    if n == 0:
        return 1

    # Use Euler's pentagonal number theorem for recurrence
    # p(n) = Σ (-1)^(k+1) [p(n - k(3k-1)/2) + p(n - k(3k+1)/2)]
    result = 0
    k = 1
    while True:
        # Generalized pentagonal numbers
        pent1 = k * (3 * k - 1) // 2  # k(3k-1)/2
        pent2 = k * (3 * k + 1) // 2  # k(3k+1)/2 = (-k)(3(-k)-1)/2

        if pent1 > n and pent2 > n:
            break

        sign = (-1) ** (k + 1)

        if pent1 <= n:
            result += sign * partition_count(n - pent1)
        if pent2 <= n:
            result += sign * partition_count(n - pent2)

        k += 1

    return result


def generate_partitions(n: int) -> Generator[tuple[int, ...], None, None]:
    """
    Generate all partitions of n in descending order.

    Yields tuples like (3, 2, 1) for n=6.
    """
    def _generate(n: int, max_val: int) -> Generator[tuple[int, ...], None, None]:
        if n == 0:
            yield ()
            return

        for i in range(min(n, max_val), 0, -1):
            for partition in _generate(n - i, i):
                yield (i,) + partition

    yield from _generate(n, n)


# ============================================================
# HARDY-RAMANUJAN APPROXIMATION
# ============================================================

def hardy_ramanujan_asymptotic(n: int) -> float:
    """
    Hardy-Ramanujan asymptotic formula for p(n).

    p(n) ~ (1 / (4n√3)) × exp(π√(2n/3))

    This gives the leading term of the asymptotic expansion.
    Remarkably accurate even for moderate n.
    """
    if n <= 0:
        return 1 if n == 0 else 0

    sqrt_term = math.sqrt(2 * n / 3)
    exp_term = math.exp(math.pi * sqrt_term)
    denom = 4 * n * math.sqrt(3)

    return exp_term / denom


def hardy_ramanujan_rademacher_term(n: int, k: int) -> float:
    """
    One term of the Rademacher series.

    The full formula is:
    p(n) = (2π)/(24n-1)^(3/4) × Σ_{k=1}^∞ [A_k(n)/k × I_{3/2}(π√(24n-1)/(6k))]

    This is an EXACT formula (the series converges to an integer!).

    This function computes the k-th term (simplified, without full A_k).
    """
    if n <= 0 or k <= 0:
        return 0

    # Argument for Bessel function
    c = math.pi * math.sqrt(24 * n - 1) / (6 * k)

    # Modified Bessel function I_{3/2}(x) = √(2/(πx)) × (cosh(x) - sinh(x)/x)
    # For large x: I_{3/2}(x) ≈ e^x / √(2πx)
    if c > 100:  # Large argument approximation
        bessel_term = math.exp(c) / math.sqrt(2 * math.pi * c)
    else:
        # Exact formula for I_{3/2}
        bessel_term = math.sqrt(2 / (math.pi * c)) * (math.cosh(c) - math.sinh(c) / c)

    # Prefactor
    prefactor = (2 * math.pi) / ((24 * n - 1) ** 0.75)

    # Simplified A_k (full Kloosterman sum is more complex)
    # For k=1, A_1(n) = 1
    A_k = 1 if k == 1 else math.cos(math.pi * (6 * k - 1) / (12 * k))

    return prefactor * A_k * bessel_term / k


# ============================================================
# PARTITION GENERATING FUNCTION
# ============================================================

def partition_generating_function_coeffs(max_n: int) -> list[int]:
    """
    Compute coefficients of the partition generating function.

    Π_{k=1}^∞ 1/(1 - x^k) = Σ_{n=0}^∞ p(n) x^n

    Returns p(0), p(1), ..., p(max_n).
    """
    coeffs = [0] * (max_n + 1)
    coeffs[0] = 1  # p(0) = 1

    # Multiply by 1/(1 - x^k) for each k
    for k in range(1, max_n + 1):
        for n in range(k, max_n + 1):
            coeffs[n] += coeffs[n - k]

    return coeffs


# ============================================================
# SPECIAL PARTITION TYPES
# ============================================================

def distinct_partitions(n: int) -> int:
    """
    Count partitions of n into DISTINCT parts.

    q(n) = number of partitions where all parts are different.

    By Euler's theorem: q(n) = p_odd(n)
    (partitions into distinct parts = partitions into odd parts)
    """
    # Use generating function: Π (1 + x^k) for k = 1, 2, ...
    coeffs = [0] * (n + 1)
    coeffs[0] = 1

    for k in range(1, n + 1):
        # Multiply by (1 + x^k), working backwards to avoid double counting
        for j in range(n, k - 1, -1):
            coeffs[j] += coeffs[j - k]

    return coeffs[n]


def odd_partitions(n: int) -> int:
    """
    Count partitions of n into ODD parts only.

    By Euler's theorem, this equals distinct_partitions(n).
    """
    coeffs = [0] * (n + 1)
    coeffs[0] = 1

    # Only odd numbers
    for k in range(1, n + 1, 2):
        for j in range(k, n + 1):
            coeffs[j] += coeffs[j - k]

    return coeffs[n]


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The partition function p(n) counts the ways to decompose
# an integer into parts — the fundamental act of DIVISION.
#
# In the Amundson framework:
#
# Structure (Û): The integer n itself (what we're partitioning)
# Change (Ĉ): The operation of decomposition
# Scale (L̂): The sizes of the parts (from 1 to n)
# Strength (Ŝ): p(n) measures the "richness" of decomposition space
#
# The Hardy-Ramanujan formula shows exponential growth:
#   p(n) ~ exp(π√(2n/3)) / (4n√3)
#
# This means the number of ways to divide grows VERY fast.
# But each partition sums back to n:
#   Σ parts = n (always)
#
# This is Z = ∅ for integer decomposition:
# No matter how you partition, the parts reunite to the whole.
#
# The Rademacher series is remarkable: an INFINITE sum of
# oscillating terms that converges to an EXACT integer.
# This connects analysis (Bessel functions) to number theory.
# ============================================================


def demonstrate():
    """Demonstrate partition functions."""
    print("=" * 60)
    print("INTEGER PARTITION FUNCTION")
    print("=" * 60)

    print("\n--- First 20 partition numbers ---")
    print("n   | p(n)  | HR approx | Error %")
    print("-" * 40)
    for n in range(1, 21):
        p_exact = partition_count(n)
        p_approx = hardy_ramanujan_asymptotic(n)
        error = 100 * abs(p_exact - p_approx) / p_exact if p_exact > 0 else 0
        print(f"{n:3d} | {p_exact:5d} | {p_approx:9.1f} | {error:6.2f}%")

    print("\n--- Partitions of 5 ---")
    for i, partition in enumerate(generate_partitions(5), 1):
        print(f"  {i}. {partition}")

    print("\n--- Distinct vs Odd partitions (Euler's theorem) ---")
    print("n   | q(n) distinct | p_odd(n)")
    print("-" * 35)
    for n in range(1, 11):
        q = distinct_partitions(n)
        p_odd = odd_partitions(n)
        match = "✓" if q == p_odd else "✗"
        print(f"{n:3d} | {q:13d} | {p_odd:8d}  {match}")

    print("\n--- Large partition numbers ---")
    for n in [50, 100, 200]:
        p = partition_count(n)
        hr = hardy_ramanujan_asymptotic(n)
        error = 100 * abs(p - hr) / p
        print(f"p({n}) = {p:,}")
        print(f"  HR approx: {hr:,.0f} (error: {error:.2f}%)")


if __name__ == "__main__":
    demonstrate()
