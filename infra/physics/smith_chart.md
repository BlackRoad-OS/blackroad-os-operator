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

*From whiteboard image 11*
