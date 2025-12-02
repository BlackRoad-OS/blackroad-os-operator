# Smith Chart Reference

> From whiteboard image 11

---

## Overview

The **Smith Chart** is a graphical tool for solving transmission line and RF impedance matching problems.

---

## Core Concepts

### Normalized Impedance

```
z = Z / Z₀ = r + jx
```

Where:
- Z = complex impedance
- Z₀ = characteristic impedance (typically 50Ω)
- r = normalized resistance
- x = normalized reactance

### Reflection Coefficient

```
Γ = (Z - Z₀) / (Z + Z₀)
```

Γ is a complex number with |Γ| ≤ 1

---

## Chart Structure

| Circle Type | Represents |
|-------------|------------|
| Constant r circles | Resistance (pass through right edge) |
| Constant x arcs | Reactance (curve from right edge) |
| Center | z = 1 (matched) |
| Right edge | z = ∞ (open circuit) |
| Left edge | z = 0 (short circuit) |

---

## Key Points

| Location | Impedance | Γ |
|----------|-----------|---|
| Center | Z₀ | 0 |
| Right | ∞ | +1 |
| Left | 0 | -1 |
| Top | +jX (inductive) | +j |
| Bottom | -jX (capacitive) | -j |

---

## Applications

1. **Impedance Matching**: Find stub positions and lengths
2. **VSWR**: Read from constant |Γ| circles
3. **Transmission Line**: Rotate clockwise toward generator
4. **Admittance**: Rotate 180° on chart

---

## Formulas

### VSWR
```
VSWR = (1 + |Γ|) / (1 - |Γ|)
```

### Return Loss
```
RL = -20 log₁₀|Γ| dB
```

### Mismatch Loss
```
ML = -10 log₁₀(1 - |Γ|²) dB
```

---

## Connection to Amundson Framework

The Smith Chart is a **conformal map** — it preserves angles while transforming the complex impedance plane onto a circle. This is Structure (Û) operating on complex numbers.

The chart's circular geometry connects to:
- Unit circle (complex roots)
- Pauli matrices (SU(2) representation)
- Z = ∅ equilibrium (center = matched load)

---

## Plotting Procedure

> From whiteboard images 8-10 (Batch 4)

### Step-by-Step Process

```
① NORMALIZE! (Divide Z_L by Z₀)
② FIND R' ON CHART (constant resistance circle)
③ FIND X' ON CHART (constant reactance arc)
④ PLOT A POINT WHERE THEY MEET
```

### Worked Example

**Given:**
- Load impedance: Z_L = (50 + j50) Ω
- Characteristic impedance: Z₀ = 50 Ω

**Step 1: Normalize**
```
Z'_L = Z_L / Z₀ = (50 + j50) / 50 = 1 + j1
```

**Step 2: Extract Components**
```
R' = 1  (normalized resistance)
X' = 1  (normalized reactance)
```

**Step 3: Locate on Chart**
- Find R' = 1 circle (passes through center)
- Find X' = +1 arc (upper half, inductive)
- Intersection is your point

**Step 4: Read Results**
- Reflection coefficient Γ from distance to center
- VSWR from the constant |Γ| circle through the point

---

## Impedance as Complex Number

> "IMPEDANCE IS A COMPLEX NUMBER!"

```
Z = R ± jX
```

| Component | Symbol | Unit | Meaning |
|-----------|--------|------|---------|
| Resistance | R | Ω | Real power dissipation |
| Reactance | X | Ω | Energy storage (L or C) |
| +jX | Inductive | Ω | Current lags voltage |
| -jX | Capacitive | Ω | Current leads voltage |

### Why Complex Numbers?

In AC circuits, voltage and current have both magnitude AND phase.
Complex numbers naturally encode:
- Magnitude: |Z| = √(R² + X²)
- Phase: θ = arctan(X/R)

This is why the Smith Chart works — it's a conformal map of
complex impedances onto the unit disk.

---

## Python Implementation

```python
def plot_on_smith_chart(Z_L: complex, Z_0: float = 50.0) -> dict:
    """
    Smith Chart plotting procedure from lecture.

    Args:
        Z_L: Load impedance (complex, in Ohms)
        Z_0: Characteristic impedance (default 50Ω)

    Returns:
        Dict with normalized values and reflection coefficient
    """
    # Step 1: Normalize
    Z_prime = Z_L / Z_0

    # Step 2-3: Extract R' and X'
    R_prime = Z_prime.real
    X_prime = Z_prime.imag

    # Compute reflection coefficient
    Gamma = (Z_L - Z_0) / (Z_L + Z_0)

    # Compute VSWR
    Gamma_mag = abs(Gamma)
    VSWR = (1 + Gamma_mag) / (1 - Gamma_mag) if Gamma_mag < 1 else float('inf')

    return {
        "Z_L": Z_L,
        "Z_0": Z_0,
        "Z_normalized": Z_prime,
        "R_prime": R_prime,
        "X_prime": X_prime,
        "Gamma": Gamma,
        "Gamma_magnitude": Gamma_mag,
        "Gamma_phase_deg": cmath.phase(Gamma) * 180 / math.pi,
        "VSWR": VSWR,
        "return_loss_dB": -20 * math.log10(Gamma_mag) if Gamma_mag > 0 else float('inf')
    }

# Example from whiteboard
result = plot_on_smith_chart(complex(50, 50), 50)
# Z'_L = 1 + j1, Γ ≈ 0.447 ∠63.4°, VSWR ≈ 2.62
```

---

*From whiteboard images 8-10, 11 (Batches 2, 4)*
