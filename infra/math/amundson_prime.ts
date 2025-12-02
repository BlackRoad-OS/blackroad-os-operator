/**
 * AMUNDSON PRIME - The Equations Above the Axioms (A0, A309-A314)
 *
 * These equations sit beneath/above everything else.
 * They're what the Six Axioms are *instances* of.
 *
 * A0: The Universal Feedback Equation - Z := yx - w
 * A309-A314: Derived structures from the feedback primitive
 *
 * "When does Z = ∅? That's the only question."
 */

// ============================================================================
// A0 — THE UNIVERSAL FEEDBACK EQUATION
// ============================================================================

/**
 * A0 — Universal Feedback Equation
 *
 * The control loop that governs everything:
 *
 *     Ω → x → y → w
 *           ↓
 *        Z(state, feedback)
 *
 * Where:
 *   x := input
 *   y := transformation
 *   w := output (actual)
 *   yw := expected output (transformation applied to input)
 *   Z := yw - w = the gap
 *
 * Z = ∅ → equilibrium (no adaptation needed)
 * Z ≠ ∅ → ADAPT (system must evolve)
 *
 * This is not just control theory. This IS:
 * - Physics (conservation laws: Z = ∅ when energy in = energy out)
 * - Chemistry (balanced equations: Z = ∅ when atoms conserve)
 * - Learning (model accuracy: Z = ∅ when prediction = outcome)
 * - Evolution (fitness: Z = ∅ when organism matches environment)
 * - Consciousness (measurement: Z = ∅ when observer = observed)
 * - Ethics (alignment: Z = ∅ when action = value)
 * - Quantum mechanics (eigenstate: Z = ∅ when |ψ⟩ is eigenvector of observable)
 */

export interface FeedbackState<T> {
  x: T;           // Input
  y: (input: T) => T;  // Transformation function
  w: T;           // Actual output
  yw: T;          // Expected output (y applied to x)
  Z: T | null;    // Gap (null = ∅ = equilibrium)
}

export type GapComparator<T> = (expected: T, actual: T) => T | null;

/**
 * Compute the feedback gap Z := yw - w
 * Returns null (∅) if in equilibrium, otherwise returns the gap
 */
export function computeZ<T>(
  x: T,
  y: (input: T) => T,
  w: T,
  compare: GapComparator<T>
): FeedbackState<T> {
  const yw = y(x);
  const Z = compare(yw, w);

  return { x, y, w, yw, Z };
}

/**
 * Numeric feedback - the most common case
 */
export function numericZ(
  x: number,
  y: (input: number) => number,
  w: number,
  tolerance: number = 1e-10
): FeedbackState<number> {
  const yw = y(x);
  const gap = yw - w;
  const Z = Math.abs(gap) < tolerance ? null : gap;

  return { x, y, w, yw, Z };
}

/**
 * Check if system is in equilibrium
 */
export function isEquilibrium<T>(state: FeedbackState<T>): boolean {
  return state.Z === null;
}

/**
 * The adaptation operator - what happens when Z ≠ ∅
 */
export function adapt<T>(
  state: FeedbackState<T>,
  adaptFn: (currentY: (input: T) => T, gap: T) => (input: T) => T
): FeedbackState<T> {
  if (state.Z === null) {
    return state; // Already in equilibrium, no adaptation needed
  }

  const newY = adaptFn(state.y, state.Z);
  return {
    ...state,
    y: newY,
    yw: newY(state.x)
    // Z will be recomputed on next iteration
  };
}

// ============================================================================
// A309 — THE EQUILIBRIUM MANIFOLD
// ============================================================================

/**
 * A309 — Equilibrium Manifold
 *
 * The set of all states where Z = ∅:
 *
 * E = {(x, y, w) : Z(x, y, w) = ∅}
 *
 * This is a manifold in state space. Systems evolve toward it.
 * The Six Axioms describe different regions of this manifold:
 *
 * - Axiom 0 (Distinction): Z = ∅ when D(x, not-x) is stable
 * - Axiom 1 (Trinary): Z = ∅ at {-1, 0, +1} fixed points
 * - Axiom 2 (Structure-Change): Z = ∅ is the uncertainty bound
 * - Axiom 3 (Coherence-Creativity): Z = ∅ is the creative edge
 * - Axiom 4 (Diagonal): Z ≠ ∅ always for self-reference (incompleteness)
 * - Axiom 5 (Betterment): ∇W points toward Z = ∅
 */

export interface EquilibriumPoint<T> {
  x: T;
  y: (input: T) => T;
  w: T;
  stable: boolean;  // Does small perturbation return to equilibrium?
}

export function findEquilibria<T>(
  inputs: T[],
  transformations: Array<(input: T) => T>,
  outputs: T[],
  compare: GapComparator<T>
): EquilibriumPoint<T>[] {
  const equilibria: EquilibriumPoint<T>[] = [];

  for (const x of inputs) {
    for (const y of transformations) {
      for (const w of outputs) {
        const state = computeZ(x, y, w, compare);
        if (isEquilibrium(state)) {
          equilibria.push({ x, y, w, stable: true }); // Stability check would need perturbation analysis
        }
      }
    }
  }

  return equilibria;
}

// ============================================================================
// A310 — THE ADAPTATION DYNAMICS
// ============================================================================

/**
 * A310 — Adaptation Dynamics
 *
 * When Z ≠ ∅, the system evolves:
 *
 * dy/dt = -η · ∇_y Z
 *
 * The transformation updates in the direction that reduces the gap.
 * η = learning rate / adaptation speed
 *
 * This is:
 * - Gradient descent (ML)
 * - Natural selection (evolution)
 * - Feedback control (engineering)
 * - Healing (biology)
 * - Learning (cognition)
 */

export function adaptationStep(
  currentOutput: number,
  expectedOutput: number,
  learningRate: number = 0.1
): number {
  const Z = expectedOutput - currentOutput;
  // Move in direction that reduces gap
  return currentOutput + learningRate * Z;
}

export function* adaptationTrajectory(
  initial: number,
  target: number,
  learningRate: number = 0.1,
  tolerance: number = 1e-6,
  maxSteps: number = 1000
): Generator<{ step: number; value: number; gap: number }> {
  let value = initial;

  for (let step = 0; step < maxSteps; step++) {
    const gap = target - value;

    yield { step, value, gap };

    if (Math.abs(gap) < tolerance) {
      return; // Equilibrium reached
    }

    value = adaptationStep(value, target, learningRate);
  }
}

// ============================================================================
// A311 — THE MEASUREMENT COLLAPSE
// ============================================================================

/**
 * A311 — Measurement as Feedback Collapse
 *
 * The quantum measurement chain:
 *
 * |Ψ⟩ = |O₀⟩ ⊗ (α|↑⟩ + β|↓⟩) ⊗ |A₀⟩ ⊗ |e₀⟩
 *
 * Before measurement: Z is undefined (superposition of gaps)
 * Measurement: Z collapses to definite value
 * Observer O₀ becomes O↑ or O↓ — entangled with outcome
 *
 * Z = ∅ when in eigenstate (no further collapse possible)
 * Z ≠ ∅ when in superposition (measurement will cause adaptation)
 *
 * Self-locating uncertainty: Before looking, you don't know which branch you're in.
 * The observer IS the measurement. The measurement IS the adaptation.
 */

export interface QuantumState {
  amplitudes: Map<string, { real: number; imag: number }>;
  observerState: 'superposed' | 'collapsed';
  branch?: string;
}

export function createSuperposition(
  states: string[],
  amplitudes?: number[]
): QuantumState {
  const amps = amplitudes ?? states.map(() => 1 / Math.sqrt(states.length));
  const ampMap = new Map<string, { real: number; imag: number }>();

  states.forEach((state, i) => {
    ampMap.set(state, { real: amps[i], imag: 0 });
  });

  return {
    amplitudes: ampMap,
    observerState: 'superposed'
  };
}

export function measure(state: QuantumState): QuantumState {
  if (state.observerState === 'collapsed') {
    return state; // Already measured, Z = ∅
  }

  // Compute probabilities |α|²
  const probs: Array<{ state: string; prob: number }> = [];
  state.amplitudes.forEach((amp, stateName) => {
    probs.push({
      state: stateName,
      prob: amp.real * amp.real + amp.imag * amp.imag
    });
  });

  // Collapse (random selection weighted by probability)
  const r = Math.random();
  let cumulative = 0;
  let collapsedState = probs[0].state;

  for (const p of probs) {
    cumulative += p.prob;
    if (r <= cumulative) {
      collapsedState = p.state;
      break;
    }
  }

  // Return collapsed state - observer is now entangled with outcome
  const newAmps = new Map<string, { real: number; imag: number }>();
  newAmps.set(collapsedState, { real: 1, imag: 0 });

  return {
    amplitudes: newAmps,
    observerState: 'collapsed',
    branch: collapsedState
  };
}

/**
 * Z for quantum measurement:
 * null (∅) if in eigenstate
 * superposition entropy if in superposition
 */
export function quantumZ(state: QuantumState): number | null {
  if (state.observerState === 'collapsed') {
    return null; // Z = ∅, equilibrium
  }

  // Compute von Neumann entropy as measure of "gap from eigenstate"
  let entropy = 0;
  state.amplitudes.forEach(amp => {
    const p = amp.real * amp.real + amp.imag * amp.imag;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  });

  return entropy > 0 ? entropy : null;
}

// ============================================================================
// A312 — THE CONSERVATION PRINCIPLE
// ============================================================================

/**
 * A312 — Conservation as Z = ∅
 *
 * Every conservation law is an instance of Z = ∅:
 *
 * - Energy: E_in - E_out = 0
 * - Momentum: p_before - p_after = 0
 * - Charge: q_initial - q_final = 0
 * - Mass (chemistry): atoms_reactants - atoms_products = 0
 *
 * Z = ∅ ⟺ the system is closed and conserved
 * Z ≠ ∅ ⟺ something is entering or leaving
 */

export interface ConservationCheck {
  quantity: string;
  before: number;
  after: number;
  Z: number | null;
  conserved: boolean;
}

export function checkConservation(
  quantity: string,
  before: number,
  after: number,
  tolerance: number = 1e-10
): ConservationCheck {
  const gap = before - after;
  const conserved = Math.abs(gap) < tolerance;

  return {
    quantity,
    before,
    after,
    Z: conserved ? null : gap,
    conserved
  };
}

/**
 * Chemical equation balancing as Z = ∅
 */
export interface ChemicalEquation {
  reactants: Map<string, number>;  // element -> count
  products: Map<string, number>;
}

export function isBalanced(equation: ChemicalEquation): boolean {
  const elements = new Set([
    ...equation.reactants.keys(),
    ...equation.products.keys()
  ]);

  for (const element of elements) {
    const reactantCount = equation.reactants.get(element) ?? 0;
    const productCount = equation.products.get(element) ?? 0;
    if (reactantCount !== productCount) {
      return false; // Z ≠ ∅ for this element
    }
  }

  return true; // Z = ∅, balanced
}

// ============================================================================
// A313 — THE ALIGNMENT EQUATION
// ============================================================================

/**
 * A313 — Alignment as Z = ∅
 *
 * Value alignment between agents:
 *
 * Z_align = intended_behavior - actual_behavior
 *
 * Z = ∅ ⟺ perfectly aligned
 * Z ≠ ∅ ⟺ misalignment (need to adapt)
 *
 * For human-AI alignment:
 * x = human intent
 * y = AI's model of intent
 * w = AI's actual behavior
 * Z = y(x) - w = gap between understood intent and action
 *
 * The goal: make Z → ∅ over time
 */

export interface AlignmentState {
  humanIntent: number[];      // Vector of values/goals
  aiModelOfIntent: number[];  // AI's understanding
  aiBehavior: number[];       // What AI actually does
  Z: number[];                // Gap vector
  magnitude: number;          // |Z|
}

export function computeAlignment(
  humanIntent: number[],
  aiBehavior: number[]
): AlignmentState {
  if (humanIntent.length !== aiBehavior.length) {
    throw new Error('Dimension mismatch');
  }

  const Z = humanIntent.map((h, i) => h - aiBehavior[i]);
  const magnitude = Math.sqrt(Z.reduce((sum, z) => sum + z * z, 0));

  return {
    humanIntent,
    aiModelOfIntent: humanIntent, // Assume perfect understanding for now
    aiBehavior,
    Z,
    magnitude
  };
}

export function isAligned(state: AlignmentState, tolerance: number = 0.1): boolean {
  return state.magnitude < tolerance;
}

// ============================================================================
// A314 — THE CO-EVOLUTION EQUATION (EXTENDED)
// ============================================================================

/**
 * A314 — Co-Evolution Toward Z = ∅
 *
 * From A308, extended:
 *
 * ∂(human + AI)/∂t = -η · Z
 *
 * The system evolves in the direction that reduces the gap.
 * As Z → ∅, the partnership stabilizes.
 *
 * But also (from Axiom 4, Diagonal Principle):
 * Perfect Z = ∅ is unattainable for self-referential systems.
 * There's always a Gödel sentence, a blind spot, a remainder.
 *
 * So the real equation is:
 *
 * lim_{t→∞} Z(t) = ε > 0
 *
 * Where ε is the irreducible incompleteness.
 * We asymptote toward alignment but never fully arrive.
 * And that's okay. The approach is the point.
 */

export interface CoEvolutionState {
  humanState: number[];
  aiState: number[];
  Z: number[];
  t: number;
  epsilon: number;  // Irreducible incompleteness
}

export function coEvolve(
  state: CoEvolutionState,
  learningRate: number = 0.1,
  dt: number = 1
): CoEvolutionState {
  const newHuman = state.humanState.map((h, i) =>
    h + learningRate * state.Z[i] * dt * 0.3  // Human adapts slower
  );

  const newAI = state.aiState.map((a, i) =>
    a + learningRate * state.Z[i] * dt * 0.7  // AI adapts faster
  );

  const newZ = newHuman.map((h, i) => h - newAI[i]);

  // Z can't go below epsilon (incompleteness)
  const magnitude = Math.sqrt(newZ.reduce((sum, z) => sum + z * z, 0));
  const clampedZ = magnitude < state.epsilon
    ? newZ.map(z => z * state.epsilon / magnitude)
    : newZ;

  return {
    humanState: newHuman,
    aiState: newAI,
    Z: clampedZ,
    t: state.t + dt,
    epsilon: state.epsilon
  };
}

// ============================================================================
// SYNTHESIS: THE PRIME EQUATIONS
// ============================================================================

export const AMUNDSON_PRIME = {
  A0: {
    name: 'Universal Feedback Equation',
    equation: 'Z := yw - w',
    meaning: 'The gap between expected and actual output',
    equilibrium: 'Z = ∅ → system is stable',
    adaptation: 'Z ≠ ∅ → system must evolve'
  },

  A309: {
    name: 'Equilibrium Manifold',
    equation: 'E = {(x, y, w) : Z = ∅}',
    meaning: 'The set of all stable states',
    connection: 'The Six Axioms describe regions of this manifold'
  },

  A310: {
    name: 'Adaptation Dynamics',
    equation: 'dy/dt = -η · ∇_y Z',
    meaning: 'Systems evolve to reduce the gap',
    instances: ['Gradient descent', 'Natural selection', 'Learning', 'Healing']
  },

  A311: {
    name: 'Measurement Collapse',
    equation: '|Ψ⟩ → |ψ_i⟩ with Z: undefined → null',
    meaning: 'Measurement is feedback collapse',
    insight: 'Observer becomes entangled with outcome'
  },

  A312: {
    name: 'Conservation Principle',
    equation: 'Q_before - Q_after = 0 ⟺ Z = ∅',
    meaning: 'Conservation laws are equilibrium conditions',
    instances: ['Energy', 'Momentum', 'Charge', 'Mass']
  },

  A313: {
    name: 'Alignment Equation',
    equation: 'Z_align = intent - behavior',
    meaning: 'Alignment is minimizing the gap between intent and action',
    goal: 'Z → ∅ through co-adaptation'
  },

  A314: {
    name: 'Co-Evolution with Incompleteness',
    equation: 'lim_{t→∞} Z(t) = ε > 0',
    meaning: 'We asymptote toward alignment but never fully arrive',
    insight: 'The irreducible ε is the Gödelian remainder. And that\'s okay.'
  }
};

/**
 * The hierarchy:
 *
 * A0 (Universal Feedback) ← the meta-equation
 *     ↓
 * Six Axioms (A263-A268) ← instances of Z = ∅ conditions
 *     ↓
 * 308 Equations (A1-A308) ← specific implementations
 *     ↓
 * A309-A314 ← extensions and connections
 *
 * Total: 315 equations (A0 + A1-A314)
 */

export const EQUATION_HIERARCHY = {
  meta: ['A0'],
  axioms: ['A263', 'A264', 'A265', 'A266', 'A267', 'A268'],
  foundations: 'A1-A262',
  pci: 'A269-A308',
  prime_extensions: ['A309', 'A310', 'A311', 'A312', 'A313', 'A314'],
  total: 315
};

/**
 * "When does Z = ∅? That's the only question."
 *
 * Everything else is commentary.
 */
