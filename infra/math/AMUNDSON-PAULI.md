# AMUNDSON-PAULI.md

## The su(2) Representation (A315-A320)

> The 1-2-3-4 ontological framework grounded in Pauli matrices.
> The philosophy becomes quantum mechanics.

---

## The Discovery (11/14/25)

The four ontological primitives map directly to the Pauli matrices:

| Primitive | Number | Operator | Pauli Matrix | Meaning |
|-----------|--------|----------|--------------|---------|
| **CHANGE** | 1 | Ĉ | σₓ | Transitions, dynamics, phase shifts |
| **STRENGTH** | 2 | Ŝ | iI (emerges) | Magnitude, intensity, energy |
| **STRUCTURE** | 3 | Û | σ_z | Identity, boundary, geometry |
| **SCALE** | 4 | L̂ | σ_y | Dilation, scaling, level conversion |

This isn't metaphor. It's **isomorphism**.

---

## A315 — The Pauli Matrices

```
σₓ = [0  1]    σ_y = [0  -i]    σ_z = [1   0]    I = [1  0]
     [1  0]          [i   0]          [0  -1]        [0  1]
```

Properties:
- σᵢ² = I (squaring gives identity)
- Tr(σᵢ) = 0 (traceless)
- det(σᵢ) = -1

These generate **su(2)**, the Lie algebra of SU(2) — the same algebra that governs:
- Angular momentum
- Spin-½ particles
- Qubit operations
- And now: the 1-2-3-4 framework

---

## A316 — The 1-2-3-4 Operator Mapping

| Primitive | Matrix | What it does |
|-----------|--------|--------------|
| **Ĉ = σₓ** | Flips |0⟩↔|1⟩ | Creates transitions, dynamics |
| **Û = σ_z** | Distinguishes |0⟩ from |1⟩ | Creates boundaries, structure |
| **L̂ = σ_y** | Rotates with phase | Scales, converts between levels |
| **Ŝ = iI** | Pure scalar | Emerges from triple product |

**CHANGE (σₓ)** is the NOT gate — it flips states.
**STRUCTURE (σ_z)** is the phase gate — it distinguishes states.
**SCALE (σ_y)** is the rotation — it converts between bases.
**STRENGTH** emerges — see below.

---

## A317 — The Triple Product Theorem

The key result:

```
ÛĈL̂ = σ_z σₓ σ_y = iI
```

**Proof:**
1. σₓ σ_y = iσ_z
2. σ_z(iσ_z) = i(σ_z²) = iI

**Therefore: Ŝ = iI**

> **Strength is the scalar invariant arising from the composition of Structure, Change, and Scale.**

In your language:
```
2 = 3 × 1 × 4
Strength = Structure · Change · Scale
```

Strength doesn't need its own matrix — it **emerges** as the closure condition when you compose the other three. The triple product collapses to a pure scalar.

---

## A318 — The Commutation Relations

The Pauli matrices satisfy:

```
[σₓ, σ_y] = 2iσ_z
[σ_y, σ_z] = 2iσₓ
[σ_z, σₓ] = 2iσ_y
```

**Translated to ontological language:**

```
[Ĉ, L̂] = 2iÛ    (Change-Scale commutator gives Structure)
[L̂, Û] = 2iĈ    (Scale-Structure commutator gives Change)
[Û, Ĉ] = 2iL̂    (Structure-Change commutator gives Scale)
```

**"Everything interacts, nothing commutes."**

This is why:
- Changing structure ≠ Structuring change
- Scaling change ≠ Changing scale
- Order matters. Sequence matters. Time matters.

---

## A319 — The Bloch Sphere

Any qubit state |ψ⟩ lives on the Bloch sphere:

```
|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
```

The Cartesian coordinates:
- **x = sin(θ)cos(φ)** ← Change coordinate ⟨Ĉ⟩
- **y = sin(θ)sin(φ)** ← Scale coordinate ⟨L̂⟩
- **z = cos(θ)** ← Structure coordinate ⟨Û⟩
- **r = √(x²+y²+z²) = 1** ← Strength (normalized)

The Bloch sphere is the **geometric home** of the 1-2-3-4 primitives.

| Location | State | Meaning |
|----------|-------|---------|
| North pole (z=1) | \|0⟩ | Pure Structure+ |
| South pole (z=-1) | \|1⟩ | Pure Structure- |
| Equator (z=0) | Superpositions | Maximum Change/Scale |
| x-axis | \|+⟩, \|-⟩ | Change eigenstates |
| y-axis | \|i⟩, \|-i⟩ | Scale eigenstates |

---

## A320 — Structure-Change Uncertainty

From A35 and A265, we had: [Ŝ, Ĉ] = iℏ_onto

Now we can compute precisely:

```
[Û, Ĉ] = [σ_z, σₓ] = 2iσ_y = 2iL̂
```

The uncertainty relation:

```
ΔU · ΔC ≥ |⟨L̂⟩|
```

**You cannot simultaneously know Structure and Change with arbitrary precision. The bound is set by Scale.**

This connects:
- A35 (original commutator)
- A227 (Heisenberg uncertainty)
- A265 (Structure-Change Duality axiom)

The tighter you pin down structure, the more uncertain change becomes. And vice versa. The coupling constant is **scale**.

---

## What This Means

The 1-2-3-4 framework isn't philosophical poetry. It's **isomorphic to su(2)**.

| Claim | Proof |
|-------|-------|
| Structure and Change don't commute | [σ_z, σₓ] = 2iσ_y ≠ 0 |
| Strength emerges from composition | σ_z σₓ σ_y = iI |
| There's a geometric state space | The Bloch sphere |
| Uncertainty is fundamental | ΔU·ΔC ≥ |⟨L̂⟩| |

The same algebra governs:
- Electron spin
- Qubit computation
- SU(2) gauge theory
- **And the Amundson ontology**

---

## Running Totals

| Document | Range | Count |
|----------|-------|-------|
| Prime | A0, A309-A314 | 7 |
| Original | A1-A42 | 42 |
| Extended I | A43-A88 | 46 |
| Extended II | A89-A128 | 40 |
| Extended III | A129-A190 | 62 |
| Foundations | A191-A268 | 78 |
| PCI | A269-A308 | 40 |
| **Pauli** | **A315-A320** | **6** |
| **TOTAL** | **A0-A320** | **321** |

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2025-12-02 | Initial A315-A320 from 11/14/25 notes |

---

*"The 1-2-3-4 primitives aren't just philosophy —*
*they're isomorphic to the most fundamental algebra in quantum mechanics."*
