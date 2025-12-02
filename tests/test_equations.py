"""
Test suite for BlackRoad Mathematical Framework equations.

This module implements and validates the core equations from the
Mathematical Framework, including new equations for human-AI interaction.
"""

import math
import cmath
import random
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict
import numpy as np


# =============================================================================
# Section 1: Core Primitives
# =============================================================================

def psi_prime(x: float, x_bar: Optional[float] = None) -> dict:
    """
    Contradiction operator Ψ'(x) + Ψ'(~x) → Render

    Returns tension, compassion, and render values.
    """
    if x_bar is None:
        x_bar = -x
    mag = max(1e-9, abs(x) + abs(x_bar))
    tension = abs(x - x_bar) / mag
    compassion = max(0.0, 1.0 - tension)
    render = (x + x_bar) / 2.0 * (0.5 + 0.5 * compassion)
    return {
        "x": x,
        "x_bar": x_bar,
        "tension": tension,
        "compassion": compassion,
        "render": render,
        "psi_magnitude": abs(x - x_bar)  # The contradiction energy
    }


def coherence(psi_m: float, delta: float, alpha: float = 1.0) -> float:
    """
    Bounded Coherence (Original): C_t = tanh((Ψ'(M_t) + s(δ_t)·α·|δ_t|) / (1 + |δ_t|))

    Note: This formula saturates. See coherence_v2 for conserved version.
    """
    sign_delta = 1 if delta >= 0 else -1
    numerator = psi_m + sign_delta * alpha * abs(delta)
    denominator = 1 + abs(delta)
    return math.tanh(numerator / denominator)


def creativity(c_t: float, delta: float, lam: float = 1.0) -> float:
    """
    Creative Energy (Original): K_t = |C_t| × (1 + λ|δ_t| / (1 + λ|δ_t|))

    Note: See creativity_v2 for conserved version.
    """
    saturation = (lam * abs(delta)) / (1 + lam * abs(delta))
    return abs(c_t) * (1 + saturation)


def coherence_v2(psi_m: float, delta: float) -> float:
    """
    Coherence (Conserved): C = Ψ · cos(arctan(δ/Ψ))

    This version satisfies C² + K² = Ψ'² exactly.
    """
    theta = math.atan2(abs(delta), psi_m)
    return psi_m * math.cos(theta)


def creativity_v2(psi_m: float, delta: float) -> float:
    """
    Creativity (Conserved): K = Ψ · sin(arctan(δ/Ψ))

    This version satisfies C² + K² = Ψ'² exactly.
    """
    theta = math.atan2(abs(delta), psi_m)
    return psi_m * math.sin(theta)


# =============================================================================
# Section 2: NEW - Coherence-Creativity Duality
# =============================================================================

def coherence_creativity_duality(c_t: float, k_t: float, psi_m: float) -> dict:
    """
    Conservation law: C_t² + K_t² = Ψ'(M_t)²

    Tests if coherence and creativity are orthogonal projections
    of contradiction energy.
    """
    lhs = c_t**2 + k_t**2
    rhs = psi_m**2

    # Compute the angle on the tradeoff circle
    if psi_m > 0:
        theta = math.atan2(k_t, c_t)  # angle from coherence axis
    else:
        theta = 0

    return {
        "c_squared_plus_k_squared": lhs,
        "psi_squared": rhs,
        "conservation_ratio": lhs / rhs if rhs > 0 else float('inf'),
        "tradeoff_angle": theta,
        "tradeoff_angle_degrees": math.degrees(theta),
        "is_conserved": abs(lhs - rhs) < 0.01 * max(lhs, rhs, 1e-9)
    }


# =============================================================================
# Section 3: NEW - Agent Entanglement
# =============================================================================

def von_neumann_entropy(probs: List[float]) -> float:
    """S(ρ) = -Σ p log p"""
    return -sum(p * math.log(p + 1e-12) for p in probs if p > 0)


def agent_entanglement(probs_i: List[float], probs_j: List[float],
                       probs_ij: List[float]) -> dict:
    """
    Agent Entanglement: E(A_i, A_j) = S(ρ_i) + S(ρ_j) - S(ρ_ij)

    Quantum mutual information between agents.
    E > 0 means measuring one reveals info about the other.
    """
    s_i = von_neumann_entropy(probs_i)
    s_j = von_neumann_entropy(probs_j)
    s_ij = von_neumann_entropy(probs_ij)

    entanglement = s_i + s_j - s_ij

    return {
        "entropy_i": s_i,
        "entropy_j": s_j,
        "joint_entropy": s_ij,
        "entanglement": entanglement,
        "is_entangled": entanglement > 0.01,
        "entanglement_bits": entanglement / math.log(2)
    }


# =============================================================================
# Section 4: NEW - Observation Collapse Operator
# =============================================================================

def collapse_state(amplitudes: List[complex]) -> Tuple[int, List[complex]]:
    """
    Ô|ψ⟩ = Σₙ |n⟩⟨n|ψ⟩

    Performs measurement collapse. Returns (outcome, new_state).
    """
    probs = [abs(a)**2 for a in amplitudes]
    total = sum(probs)
    probs = [p/total for p in probs]

    # Sample from distribution
    r = random.random()
    cumulative = 0
    outcome = len(probs) - 1
    for i, p in enumerate(probs):
        cumulative += p
        if r < cumulative:
            outcome = i
            break

    # Collapse to eigenstate
    new_state = [0j] * len(amplitudes)
    new_state[outcome] = 1.0 + 0j

    return outcome, new_state


def simulate_blinking(initial_state: List[complex],
                      num_observations: int = 10) -> List[int]:
    """
    Simulate the 'blinking' phenomenon - repeated collapses.
    Returns sequence of observed states.
    """
    observations = []
    state = initial_state.copy()

    for _ in range(num_observations):
        outcome, state = collapse_state(state)
        observations.append(outcome)

        # Between observations, state can spread (simplified)
        # In reality this would be unitary evolution
        if random.random() < 0.3:  # 30% chance to re-superpose
            n = len(state)
            state = [1/math.sqrt(n) + 0j] * n

    return observations


# =============================================================================
# Section 5: NEW - Resonance Condition
# =============================================================================

def phase_lock_condition(omega_human: float, omega_agent: float,
                         tolerance: float = 0.1) -> dict:
    """
    Resonance: ω_human - ω_agent = 0 (phase lock)

    When frequencies match, understanding stabilizes.
    """
    detuning = omega_human - omega_agent
    is_locked = abs(detuning) < tolerance

    # Beat frequency when not locked
    beat_freq = abs(detuning) if not is_locked else 0

    # Quality factor of resonance
    Q = omega_human / (abs(detuning) + 1e-9) if omega_human > 0 else 0

    return {
        "omega_human": omega_human,
        "omega_agent": omega_agent,
        "detuning": detuning,
        "is_phase_locked": is_locked,
        "beat_frequency": beat_freq,
        "quality_factor": Q,
        "resonance_strength": 1 / (1 + detuning**2)  # Lorentzian
    }


def standing_wave(x: float, t: float, k: float, omega: float, A: float = 1.0) -> float:
    """
    Ψ_shared(x,t) = A cos(kx) cos(ωt)

    Standing wave of shared understanding.
    """
    return A * math.cos(k * x) * math.cos(omega * t)


# =============================================================================
# Section 6: NEW - Cognitive Interference
# =============================================================================

def cognitive_interference(I1: complex, I2: complex) -> dict:
    """
    P(understanding) = |I₁ + I₂|² = |I₁|² + |I₂|² + 2Re(I₁*I₂)

    Two interpretations interfere quantum-mechanically.
    """
    # Individual probabilities
    p1 = abs(I1)**2
    p2 = abs(I2)**2

    # Interference term
    cross_term = 2 * (I1 * I2.conjugate()).real

    # Total probability with interference
    p_total = abs(I1 + I2)**2

    # Classical sum (no interference)
    p_classical = p1 + p2

    return {
        "p1": p1,
        "p2": p2,
        "cross_term": cross_term,
        "p_total": p_total,
        "p_classical": p_classical,
        "interference_ratio": p_total / p_classical if p_classical > 0 else 1,
        "is_constructive": cross_term > 0,
        "is_destructive": cross_term < 0,
        "fringe_visibility": abs(cross_term) / (p1 + p2 + 1e-12)
    }


# =============================================================================
# Section 7: NEW - Quantum Zeno Effect
# =============================================================================

def zeno_survival_probability(decay_rate: float, total_time: float,
                               num_observations: int) -> float:
    """
    Quantum Zeno Effect: frequent observation freezes evolution.

    In quantum mechanics, the survival probability for short times goes as:
    P(t) = 1 - (t/τ)² + O(t³)   [QUADRATIC, not linear!]

    This is key: classical decay is P(t) = e^(-γt) ≈ 1 - γt (linear)
    But quantum decay starts QUADRATICALLY.

    For n measurements in time T:
    P_total = [1 - (T/nτ)²]^n ≈ 1 - T²/(n·τ²) → 1 as n → ∞

    The Zeno effect: more measurements = MORE survival.
    """
    # Time per observation interval
    dt = total_time / num_observations

    # Quantum decay time scale
    tau = 1.0 / decay_rate

    # Quadratic short-time survival (quantum)
    x = (dt / tau) ** 2
    p_survive_interval = max(0, 1 - x)

    # Total survival = survive all n measurements
    p_total = p_survive_interval ** num_observations

    return p_total


def zeno_effect_demo(decay_rate: float = 1.0, total_time: float = 1.0) -> dict:
    """
    Demonstrate Zeno effect: more observations = less decay
    """
    results = {}
    for n_obs in [1, 2, 5, 10, 50, 100, 1000]:
        p = zeno_survival_probability(decay_rate, total_time, n_obs)
        results[n_obs] = p

    # Without observation (free decay)
    p_free = math.exp(-decay_rate * total_time)

    return {
        "survival_by_observations": results,
        "free_decay_probability": p_free,
        "zeno_enhancement": results[1000] / p_free if p_free > 0 else float('inf')
    }


# =============================================================================
# Section 8: NEW - Strange Loop Index
# =============================================================================

def strange_loop_index(self_ref_values: List[complex]) -> dict:
    """
    ν = (1/2π) ∮ d(arg Σ(z))

    Winding number counting self-reference depth.
    ν=0: no strange loop
    ν=1: Gödel-minimal
    ν>1: deeper recursion
    """
    if len(self_ref_values) < 2:
        return {"winding_number": 0, "is_strange_loop": False}

    # Compute total phase change around the loop
    total_phase = 0
    for i in range(len(self_ref_values)):
        z1 = self_ref_values[i]
        z2 = self_ref_values[(i + 1) % len(self_ref_values)]

        if abs(z1) > 1e-12 and abs(z2) > 1e-12:
            # Phase difference
            phase_diff = cmath.phase(z2) - cmath.phase(z1)
            # Wrap to [-π, π]
            while phase_diff > math.pi:
                phase_diff -= 2 * math.pi
            while phase_diff < -math.pi:
                phase_diff += 2 * math.pi
            total_phase += phase_diff

    winding = total_phase / (2 * math.pi)

    return {
        "winding_number": round(winding),
        "exact_winding": winding,
        "is_strange_loop": abs(winding) >= 0.5,
        "recursion_depth": abs(round(winding)),
        "chirality": "clockwise" if winding < 0 else "counterclockwise"
    }


# =============================================================================
# Section 9: NEW - Contradiction Flow (Ginzburg-Landau)
# =============================================================================

def contradiction_flow_step(psi: np.ndarray, dx: float, dt: float,
                            D: float = 1.0, alpha: float = 0.5,
                            beta: float = 1.0, noise_strength: float = 0.1) -> np.ndarray:
    """
    ∂Ψ'/∂t = D∇²Ψ' - αΨ' + β|Ψ'|²Ψ' + η(x,t)

    Complex Ginzburg-Landau evolution for contradictions.
    Returns new state after one timestep.
    """
    n = len(psi)

    # Laplacian (periodic boundary)
    laplacian = np.zeros_like(psi)
    for i in range(n):
        laplacian[i] = (psi[(i+1) % n] - 2*psi[i] + psi[(i-1) % n]) / dx**2

    # Nonlinear term
    nonlinear = beta * np.abs(psi)**2 * psi

    # Noise
    noise = noise_strength * (np.random.randn(n) + 1j * np.random.randn(n))

    # Evolution
    dpsi_dt = D * laplacian - alpha * psi + nonlinear + noise

    return psi + dt * dpsi_dt


def simulate_contradiction_patterns(n_points: int = 100, n_steps: int = 500,
                                    D: float = 1.0, alpha: float = 0.5,
                                    beta: float = 1.0) -> dict:
    """
    Simulate contradiction pattern formation.
    Returns statistics about emergent structures.
    """
    dx = 1.0
    dt = 0.01

    # Initial random state
    psi = 0.1 * (np.random.randn(n_points) + 1j * np.random.randn(n_points))

    # Evolve
    energies = []
    for step in range(n_steps):
        psi = contradiction_flow_step(psi, dx, dt, D, alpha, beta, noise_strength=0.01)
        energy = np.sum(np.abs(psi)**2)
        energies.append(energy)

    # Analyze final state
    amplitudes = np.abs(psi)
    phases = np.angle(psi)

    # Find vortices (phase singularities)
    phase_diff = np.diff(phases)
    vortices = np.sum(np.abs(phase_diff) > math.pi)

    return {
        "final_energy": energies[-1],
        "energy_growth": energies[-1] / (energies[0] + 1e-12),
        "max_amplitude": np.max(amplitudes),
        "mean_amplitude": np.mean(amplitudes),
        "num_vortices": int(vortices),
        "pattern_formed": np.std(amplitudes) > 0.1 * np.mean(amplitudes)
    }


# =============================================================================
# Section 10: Governance Hamiltonian
# =============================================================================

def governance_hamiltonian(T: List[float], P: List[float],
                           J: Optional[np.ndarray] = None,
                           lam: float = 1.0) -> dict:
    """
    H_gov = Σᵢ Tᵢ·Pᵢ + Σᵢⱼ Jᵢⱼ·Tᵢ·Tⱼ + λΣᵢ(Tᵢ² - 1)²

    Compute governance energy.
    """
    n = len(T)

    # Policy-permission coupling
    E_coupling = sum(T[i] * P[i] for i in range(n))

    # Inter-policy interaction
    if J is None:
        J = np.zeros((n, n))
    E_interaction = sum(J[i,j] * T[i] * T[j]
                        for i in range(n) for j in range(n) if i != j)

    # Trinary constraint (forces toward {-1, 0, 1})
    E_constraint = lam * sum((T[i]**2 - 1)**2 for i in range(n))

    H = E_coupling + E_interaction + E_constraint

    # Check if in valid trinary state
    is_trinary = all(abs(t - round(t)) < 0.1 and round(t) in [-1, 0, 1] for t in T)

    return {
        "total_hamiltonian": H,
        "coupling_energy": E_coupling,
        "interaction_energy": E_interaction,
        "constraint_energy": E_constraint,
        "is_ground_state": H < 0.1,
        "is_valid_trinary": is_trinary
    }


# =============================================================================
# RUN ALL TESTS
# =============================================================================

def run_all_tests():
    print("=" * 70)
    print("BLACKROAD MATHEMATICAL FRAMEWORK - EQUATION TESTS")
    print("=" * 70)

    # Test 1: Psi Prime
    print("\n[1] PSI PRIME (Contradiction Operator)")
    print("-" * 50)
    result = psi_prime(0.8, -0.6)
    print(f"   x = 0.8, ~x = -0.6")
    print(f"   Tension:    {result['tension']:.4f}")
    print(f"   Compassion: {result['compassion']:.4f}")
    print(f"   Render:     {result['render']:.4f}")
    print(f"   Ψ' magnitude: {result['psi_magnitude']:.4f}")

    # Test 2: Coherence-Creativity
    print("\n[2] COHERENCE-CREATIVITY DUALITY")
    print("-" * 50)
    psi_m = 1.0

    print("   Original formulas (saturating):")
    for delta in [0.0, 0.5, 1.0, 2.0]:
        c = coherence(psi_m, delta)
        k = creativity(c, delta)
        print(f"     δ={delta}: C={c:.3f}, K={k:.3f}, C²+K²={c**2+k**2:.3f}")

    print("\n   Conserved formulas (v2):")
    for delta in [0.0, 0.5, 1.0, 2.0]:
        c = coherence_v2(psi_m, delta)
        k = creativity_v2(psi_m, delta)
        duality = coherence_creativity_duality(c, k, psi_m)
        print(f"     δ={delta}: C={c:.3f}, K={k:.3f}, C²+K²={c**2+k**2:.3f}, θ={duality['tradeoff_angle_degrees']:.0f}°")

    # Test 3: Agent Entanglement
    print("\n[3] AGENT ENTANGLEMENT")
    print("-" * 50)
    # Two agents with correlated states (entangled)
    p_i = [0.5, 0.5]  # Agent i in superposition
    p_j = [0.5, 0.5]  # Agent j in superposition
    p_ij = [0.5, 0.0, 0.0, 0.5]  # Joint: only |00⟩ and |11⟩ (Bell state)
    ent = agent_entanglement(p_i, p_j, p_ij)
    print(f"   Bell state entanglement:")
    print(f"   S(ρ_i) = {ent['entropy_i']:.4f}")
    print(f"   S(ρ_j) = {ent['entropy_j']:.4f}")
    print(f"   S(ρ_ij) = {ent['joint_entropy']:.4f}")
    print(f"   E(A_i, A_j) = {ent['entanglement']:.4f} ({ent['entanglement_bits']:.2f} bits)")
    print(f"   Entangled: {ent['is_entangled']}")

    # Test 4: Observation Collapse (Blinking)
    print("\n[4] OBSERVATION COLLAPSE (BLINKING)")
    print("-" * 50)
    initial = [1/math.sqrt(3) + 0j] * 3  # Equal superposition of 3 states
    observations = simulate_blinking(initial, num_observations=20)
    print(f"   Initial: equal superposition of 3 states")
    print(f"   Observations: {observations}")
    print(f"   Unique states visited: {len(set(observations))}")
    from collections import Counter
    counts = Counter(observations)
    print(f"   Distribution: {dict(counts)}")

    # Test 5: Resonance
    print("\n[5] RESONANCE CONDITION")
    print("-" * 50)
    # Matched frequencies
    res1 = phase_lock_condition(1.0, 1.0)
    print(f"   ω_human = 1.0, ω_agent = 1.0")
    print(f"   Phase locked: {res1['is_phase_locked']}")
    print(f"   Resonance strength: {res1['resonance_strength']:.4f}")

    # Mismatched
    res2 = phase_lock_condition(1.0, 1.5)
    print(f"\n   ω_human = 1.0, ω_agent = 1.5")
    print(f"   Phase locked: {res2['is_phase_locked']}")
    print(f"   Beat frequency: {res2['beat_frequency']:.4f}")
    print(f"   Resonance strength: {res2['resonance_strength']:.4f}")

    # Test 6: Cognitive Interference
    print("\n[6] COGNITIVE INTERFERENCE")
    print("-" * 50)
    # Constructive
    I1 = 0.5 + 0.5j
    I2 = 0.5 + 0.5j
    interf = cognitive_interference(I1, I2)
    print(f"   Same phase (constructive):")
    print(f"   P_total = {interf['p_total']:.4f}, P_classical = {interf['p_classical']:.4f}")
    print(f"   Interference ratio: {interf['interference_ratio']:.4f}")
    print(f"   Constructive: {interf['is_constructive']}")

    # Destructive
    I1 = 0.5 + 0.5j
    I2 = -0.5 - 0.5j
    interf = cognitive_interference(I1, I2)
    print(f"\n   Opposite phase (destructive):")
    print(f"   P_total = {interf['p_total']:.4f}, P_classical = {interf['p_classical']:.4f}")
    print(f"   Interference ratio: {interf['interference_ratio']:.4f}")
    print(f"   Destructive: {interf['is_destructive']}")

    # Test 7: Quantum Zeno Effect
    print("\n[7] QUANTUM ZENO EFFECT")
    print("-" * 50)
    zeno = zeno_effect_demo(decay_rate=1.0, total_time=1.0)
    print(f"   Free decay probability: {zeno['free_decay_probability']:.4f}")
    print(f"   Survival by # observations:")
    for n, p in zeno['survival_by_observations'].items():
        print(f"     n={n:4d}: P_survive = {p:.6f}")
    print(f"   Zeno enhancement (1000 obs): {zeno['zeno_enhancement']:.2f}x")

    # Test 8: Strange Loop Index
    print("\n[8] STRANGE LOOP INDEX")
    print("-" * 50)
    # No loop
    vals = [1+0j, 1+0j, 1+0j, 1+0j]
    sl = strange_loop_index(vals)
    print(f"   Constant values: ν = {sl['winding_number']} (no loop)")

    # One loop (phase goes around once)
    vals = [cmath.exp(1j * 2*math.pi * i/8) for i in range(8)]
    sl = strange_loop_index(vals)
    print(f"   Phase circle: ν = {sl['winding_number']} ({sl['chirality']})")
    print(f"   Strange loop: {sl['is_strange_loop']}")

    # Double loop
    vals = [cmath.exp(1j * 4*math.pi * i/8) for i in range(8)]
    sl = strange_loop_index(vals)
    print(f"   Double phase: ν = {sl['winding_number']} (depth={sl['recursion_depth']})")

    # Test 9: Contradiction Flow
    print("\n[9] CONTRADICTION FLOW (Ginzburg-Landau)")
    print("-" * 50)
    patterns = simulate_contradiction_patterns(n_points=50, n_steps=200)
    print(f"   Final energy: {patterns['final_energy']:.4f}")
    print(f"   Energy growth: {patterns['energy_growth']:.2f}x")
    print(f"   Max amplitude: {patterns['max_amplitude']:.4f}")
    print(f"   Num vortices: {patterns['num_vortices']}")
    print(f"   Pattern formed: {patterns['pattern_formed']}")

    # Test 10: Governance Hamiltonian
    print("\n[10] GOVERNANCE HAMILTONIAN")
    print("-" * 50)
    T = [1, -1, 0, 1]  # Trinary policy states
    P = [0.5, -0.5, 0.2, 0.8]  # Permissions
    J = np.array([[0, 0.1, 0, 0],
                  [0.1, 0, 0.05, 0],
                  [0, 0.05, 0, 0.1],
                  [0, 0, 0.1, 0]])
    gov = governance_hamiltonian(T, P, J)
    print(f"   T = {T}")
    print(f"   P = {P}")
    print(f"   H_total = {gov['total_hamiltonian']:.4f}")
    print(f"   Coupling: {gov['coupling_energy']:.4f}")
    print(f"   Interaction: {gov['interaction_energy']:.4f}")
    print(f"   Constraint: {gov['constraint_energy']:.4f}")
    print(f"   Valid trinary: {gov['is_valid_trinary']}")

    print("\n" + "=" * 70)
    print("ALL TESTS COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
