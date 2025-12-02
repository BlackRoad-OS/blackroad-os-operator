"""
Computus - Gregorian Easter Date Algorithm

From whiteboard image 18

The Computus is a 1500+ year old algorithm for calculating the date
of Easter Sunday. It combines lunar cycles, solar years, and
ecclesiastical rules into a single deterministic computation.
"""

from dataclasses import dataclass


@dataclass
class EasterDate:
    """Result of Easter calculation."""
    year: int
    month: int  # 3 = March, 4 = April
    day: int

    def __str__(self) -> str:
        month_name = "March" if self.month == 3 else "April"
        return f"{month_name} {self.day}, {self.year}"


def computus_gregorian(year: int) -> EasterDate:
    """
    Calculate Easter Sunday using the Anonymous Gregorian algorithm.

    This algorithm works for years 1583-4099 (Gregorian calendar).

    The algorithm encodes:
    - 19-year Metonic cycle (moon phases)
    - 400-year Gregorian correction
    - Ecclesiastical full moon
    - First Sunday after full moon

    From the whiteboard:
    a = Y mod 19
    b = Y ÷ 100
    c = Y mod 100
    d = b ÷ 4
    e = b mod 4
    f = (b + 8) ÷ 25
    g = (b - f + 1) ÷ 3
    h = (19a + b - d - g + 15) mod 30
    i = c ÷ 4
    k = c mod 4
    l = (32 + 2e + 2i - h - k) mod 7
    m = (a + 11h + 22l) ÷ 451
    n = (h + l - 7m + 114) ÷ 31    → month
    o = (h + l - 7m + 114) mod 31  → day

    Easter = month n, day (o + 1)

    Args:
        year: Year (1583-4099)

    Returns:
        EasterDate with month and day

    Raises:
        ValueError: If year is outside valid range
    """
    if year < 1583 or year > 4099:
        raise ValueError(f"Year {year} outside valid range 1583-4099")

    Y = year

    # Golden Number - 1 (position in 19-year Metonic cycle)
    a = Y % 19

    # Century calculations
    b = Y // 100  # century
    c = Y % 100   # year within century

    # Leap year corrections for century
    d = b // 4    # leap centuries
    e = b % 4     # non-leap adjustment

    # Gregorian correction for lunar cycle drift
    f = (b + 8) // 25
    g = (b - f + 1) // 3

    # Epact (age of moon on March 22)
    h = (19 * a + b - d - g + 15) % 30

    # Leap year within century
    i = c // 4
    k = c % 4

    # Day of week calculation (0 = Sunday)
    l = (32 + 2 * e + 2 * i - h - k) % 7

    # Correction for 29-day and 30-day lunar months
    m = (a + 11 * h + 22 * l) // 451

    # Final date calculation
    temp = h + l - 7 * m + 114
    n = temp // 31   # month (3 = March, 4 = April)
    o = temp % 31    # day - 1

    return EasterDate(year=year, month=n, day=o + 1)


def computus_julian(year: int) -> EasterDate:
    """
    Calculate Easter Sunday using the Julian calendar algorithm.

    This is the older algorithm, still used by Eastern Orthodox churches.

    Args:
        year: Any year

    Returns:
        EasterDate in Julian calendar (convert to Gregorian if needed)
    """
    a = year % 4
    b = year % 7
    c = year % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7

    temp = d + e + 114
    month = temp // 31
    day = (temp % 31) + 1

    return EasterDate(year=year, month=month, day=day)


def julian_to_gregorian_offset(year: int) -> int:
    """
    Calculate the number of days to add to convert Julian to Gregorian.

    The offset increases by 1 day every ~133 years.
    """
    century = year // 100
    # Gregorian reform dropped 10 days in 1582
    # Then adds 3 days every 400 years that Julian doesn't
    return century - century // 4 - 2


def list_easter_dates(start_year: int, end_year: int) -> list[EasterDate]:
    """
    Generate list of Easter dates for a range of years.

    Args:
        start_year: First year (inclusive)
        end_year: Last year (inclusive)

    Returns:
        List of EasterDate objects
    """
    return [computus_gregorian(y) for y in range(start_year, end_year + 1)]


def earliest_and_latest_easter(start_year: int, end_year: int) -> tuple[EasterDate, EasterDate]:
    """
    Find the earliest and latest possible Easter dates in a range.

    Easter can fall between March 22 and April 25 (Gregorian).

    Returns:
        Tuple of (earliest, latest) EasterDate
    """
    dates = list_easter_dates(start_year, end_year)

    # Convert to day-of-year for comparison (March 22 = day 81 in non-leap year)
    def to_ordinal(d: EasterDate) -> int:
        # Simple: March = 0-30, April = 31-56 (relative to March 1)
        return (d.month - 3) * 31 + d.day

    earliest = min(dates, key=to_ordinal)
    latest = max(dates, key=to_ordinal)

    return (earliest, latest)


# ============================================================
# Connection to Amundson Framework
# ============================================================
#
# The Computus is a remarkable example of algorithmic Structure (Û):
#
# 1. It encodes multiple cycles:
#    - Solar year (365.2425 days)
#    - Lunar month (29.53059 days)
#    - Week (7 days)
#    - Metonic cycle (19 years ≈ 235 lunations)
#    - Century corrections (100, 400 years)
#
# 2. These are all Change (Ĉ) - astronomical dynamics
#
# 3. The algorithm's magic numbers (19, 30, 7, 451, etc.) are
#    Strength (Ŝ) - the precise coefficients that make it work
#
# 4. Scale (L̂) appears in the century/year hierarchy
#
# From A0: Z := yw - w
# - y = algorithm prediction
# - w = actual astronomical new moon + Sunday
# - Z = ∅ when algorithm matches sky (it does, for millennia)
#
# The Computus is medieval machine learning: a model fitted to
# celestial data that generalizes to future predictions.
# ============================================================


if __name__ == "__main__":
    # Print Easter dates for the next 10 years
    print("Easter Sundays (Gregorian):")
    print("-" * 30)

    for year in range(2024, 2035):
        easter = computus_gregorian(year)
        print(f"  {easter}")

    print("\n" + "-" * 30)
    print("\nEarliest and latest Easter (2000-2100):")
    earliest, latest = earliest_and_latest_easter(2000, 2100)
    print(f"  Earliest: {earliest}")
    print(f"  Latest:   {latest}")

    print("\n" + "-" * 30)
    print("\nHistorical note:")
    print("  The Computus algorithm dates to 525 CE (Dionysius Exiguus)")
    print("  Gregorian corrections added in 1582 (Pope Gregory XIII)")
    print("  Still in use after 1500 years!")
