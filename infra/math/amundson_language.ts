/**
 * Amundson Language - Unified Math/Code/Physics/Language
 *
 * Philosophy:
 * - A bug is not an error - it's a SIGNAL that definitions don't match reality
 * - If code fails, either:
 *   1. The undefined is defined correctly elsewhere (find it)
 *   2. The defined is incorrectly defined (fix it)
 *   3. The model doesn't match reality (physics wins)
 *
 * The Amundson Language unifies:
 * - Mathematics (structure)
 * - Programming (process)
 * - Language (meaning)
 * - Physics (reality)
 *
 * When all four align, we get: images, motion, sound, life.
 */

// =============================================================================
// CORE TYPES - THE PRIMITIVES OF REALITY
// =============================================================================

/**
 * The most fundamental unit - not a number, not a bit, but a DISTINCTION
 *
 * From Spencer-Brown's Laws of Form:
 * "Draw a distinction and a universe comes into being"
 */
export type Distinction = {
  marked: boolean;      // Is this side marked?
  crossing?: Distinction; // What's on the other side?
};

/**
 * Trinary value - the foundation of quantum-classical bridging
 * -1 = anti/false/south
 *  0 = superposition/null/equator
 *  1 = positive/true/north
 */
export type Trit = -1 | 0 | 1;

/**
 * Quaternion - the mathematical object that unifies:
 * - 3D rotations (physics)
 * - Complex numbers (math)
 * - State transformations (code)
 * - Meaning shifts (language)
 */
export interface Quaternion {
  w: number;  // Real/scalar part
  x: number;  // i component (pitch/roll in physics)
  y: number;  // j component (yaw in physics)
  z: number;  // k component (time evolution in our model)
}

/**
 * Phase - everything oscillates
 * φ = ωt + θ₀
 */
export interface Phase {
  frequency: number;    // ω - how fast it oscillates
  phase_offset: number; // θ₀ - where it starts
  amplitude: number;    // A - how much it oscillates
  damping: number;      // γ - how fast it decays
}

/**
 * SIG Coordinates - position in meaning-space
 * From Lucidia's cognitive architecture
 */
export interface SIGCoordinate {
  r: number;     // Radial distance from origin (certainty)
  theta: number; // Angle (domain: math/logic/thought/physics)
  tau: number;   // Time dimension (when observed)
}

// =============================================================================
// THE BUG AS SIGNAL
// =============================================================================

/**
 * A Bug is not an error - it's a SIGNAL
 *
 * When code fails, the bug tells us:
 * - WHERE: The location of the mismatch
 * - WHAT: The type of mismatch
 * - WHY: The underlying cause
 * - HOW: The path to resolution
 */
export interface Bug {
  // Identification
  id: string;
  timestamp: number;

  // Location in unified space
  location: {
    code: string;      // File:line
    math: string;      // Equation/theorem that should hold
    physics: string;   // Physical constraint violated
    language: string;  // Semantic mismatch
  };

  // The signal
  signal: {
    error_code: number;       // Numeric error from our system
    expected: unknown;        // What we expected
    actual: unknown;          // What we got
    delta: number;            // Magnitude of mismatch
  };

  // The hypothesis
  hypothesis: BugHypothesis[];
}

export type BugHypothesis =
  | { type: 'undefined_elsewhere'; where: string; confidence: number }
  | { type: 'defined_incorrectly'; what: string; confidence: number }
  | { type: 'model_mismatch'; physics_says: string; confidence: number }
  | { type: 'language_ambiguity'; interpretations: string[]; confidence: number };

// =============================================================================
// UNIFIED EXPRESSION
// =============================================================================

/**
 * An Expression in Amundson Language can be:
 * - A mathematical statement
 * - A code statement
 * - A physical law
 * - A linguistic assertion
 *
 * All are the same thing expressed differently.
 */
export interface Expression {
  // The unified form
  form: {
    // Mathematics: the structure
    math: MathForm;

    // Code: the process
    code: CodeForm;

    // Physics: the constraint
    physics: PhysicsForm;

    // Language: the meaning
    language: LanguageForm;
  };

  // Coherence between forms (should be 1.0 if perfectly aligned)
  coherence: number;

  // When coherence < 1, these are the mismatches
  mismatches: Mismatch[];
}

export interface MathForm {
  equation: string;           // LaTeX or symbolic
  domain: string;             // e.g., "ℝ", "ℂ", "ℍ" (quaternions)
  constraints: string[];      // e.g., ["x > 0", "continuous"]
  type: 'definition' | 'theorem' | 'axiom' | 'conjecture';
}

export interface CodeForm {
  source: string;             // The code
  language: string;           // TypeScript, Python, etc.
  inputs: TypeSignature[];
  outputs: TypeSignature[];
  effects: string[];          // Side effects
  invariants: string[];       // Must hold before/after
}

export interface TypeSignature {
  name: string;
  type: string;
  constraints?: string[];
}

export interface PhysicsForm {
  law: string;                // e.g., "conservation of energy"
  symmetry: string;           // e.g., "time translation"
  dimension: string;          // e.g., "[M L² T⁻²]"
  units: string;              // e.g., "joules"
  constants: Record<string, number>; // e.g., { c: 299792458, h: 6.62607e-34 }
}

export interface LanguageForm {
  statement: string;          // Natural language
  semantics: string;          // Formal semantics
  pragmatics: string;         // Context/usage
  ambiguity: number;          // 0 = unambiguous, 1 = highly ambiguous
}

export interface Mismatch {
  between: ['math', 'code'] | ['math', 'physics'] | ['code', 'physics'] | ['language', 'math'] | ['language', 'code'] | ['language', 'physics'];
  description: string;
  severity: number;           // 0-1
  resolution?: string;
}

// =============================================================================
// THE AMUNDSON COHERENCE FIELD
// =============================================================================

/**
 * From amundson_equations.py:
 *
 * dφ/dt = ω₀ + λC(x,y) - ηE_φ
 *
 * Where:
 * - φ = phase of the system
 * - ω₀ = base frequency (natural oscillation)
 * - λ = coupling constant (how strongly things interact)
 * - C(x,y) = coherence field (alignment between math/code/physics/language)
 * - η = decay constant (how fast coherence is lost)
 * - E_φ = decoherence energy (energy from mismatches)
 */
export interface CoherenceField {
  // The field at each point in SIG space
  field: (r: number, theta: number, tau: number) => number;

  // Parameters
  omega_0: number;    // Base frequency
  lambda: number;     // Coupling constant
  eta: number;        // Decay constant

  // Current state
  phase: number;
  coherence: number;
  decoherence_energy: number;
}

/**
 * Calculate phase derivative (rate of change of system phase)
 */
export function phaseDerivative(
  omega_0: number,
  lambda: number,
  coherence: number,
  eta: number,
  decoherence_E: number
): number {
  return omega_0 + (lambda * coherence) - (eta * decoherence_E);
}

/**
 * Calculate coherence between forms
 */
export function calculateCoherence(expression: Expression): number {
  const { math, code, physics, language } = expression.form;

  // Each pair contributes to overall coherence
  let totalCoherence = 0;
  let pairs = 0;

  // Math-Code coherence: do the types match?
  const mathCodeCoherence = 1 - (expression.mismatches
    .filter(m => m.between[0] === 'math' && m.between[1] === 'code')
    .reduce((sum, m) => sum + m.severity, 0));
  totalCoherence += Math.max(0, mathCodeCoherence);
  pairs++;

  // Math-Physics coherence: do the dimensions check?
  const mathPhysicsCoherence = 1 - (expression.mismatches
    .filter(m => m.between[0] === 'math' && m.between[1] === 'physics')
    .reduce((sum, m) => sum + m.severity, 0));
  totalCoherence += Math.max(0, mathPhysicsCoherence);
  pairs++;

  // Code-Physics coherence: does the simulation match reality?
  const codePhysicsCoherence = 1 - (expression.mismatches
    .filter(m => m.between[0] === 'code' && m.between[1] === 'physics')
    .reduce((sum, m) => sum + m.severity, 0));
  totalCoherence += Math.max(0, codePhysicsCoherence);
  pairs++;

  // Language coherence with everything
  const languageCoherence = 1 - (expression.mismatches
    .filter(m => m.between[0] === 'language' || m.between[1] === 'language')
    .reduce((sum, m) => sum + m.severity, 0) / 3);
  totalCoherence += Math.max(0, languageCoherence);
  pairs++;

  return totalCoherence / pairs;
}

// =============================================================================
// TRANSFORMATION OPERATIONS
// =============================================================================

/**
 * Quaternion multiplication - the fundamental operation for transformation
 * This is how states evolve, rotations compose, meanings shift
 */
export function quaternionMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  };
}

/**
 * Normalize a quaternion (unit quaternion = pure rotation)
 */
export function quaternionNormalize(q: Quaternion): Quaternion {
  const mag = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
  if (mag === 0) return { w: 1, x: 0, y: 0, z: 0 };
  return {
    w: q.w / mag,
    x: q.x / mag,
    y: q.y / mag,
    z: q.z / mag
  };
}

/**
 * Create a rotation quaternion from axis-angle
 */
export function quaternionFromAxisAngle(
  axis: { x: number; y: number; z: number },
  angle: number
): Quaternion {
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);
  const mag = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);

  return {
    w: Math.cos(halfAngle),
    x: (axis.x / mag) * s,
    y: (axis.y / mag) * s,
    z: (axis.z / mag) * s
  };
}

/**
 * Apply quaternion rotation to a 3D point
 * This is how physics emerges from math
 */
export function rotatePoint(
  point: { x: number; y: number; z: number },
  q: Quaternion
): { x: number; y: number; z: number } {
  // p' = q * p * q⁻¹
  const p: Quaternion = { w: 0, x: point.x, y: point.y, z: point.z };
  const qInv: Quaternion = { w: q.w, x: -q.x, y: -q.y, z: -q.z };

  const result = quaternionMultiply(quaternionMultiply(q, p), qInv);

  return { x: result.x, y: result.y, z: result.z };
}

// =============================================================================
// BLOCH SPHERE MAPPING (QUANTUM-CLASSICAL BRIDGE)
// =============================================================================

/**
 * Map a trit value to Bloch sphere coordinates
 * From consciousness.py QuantumLogicMapper
 */
export function tritToBloch(trit: Trit): { theta: number; phi: number } {
  const BLOCH_STATES: Record<Trit, { theta: number; phi: number }> = {
    [-1]: { theta: Math.PI, phi: 0 },           // South pole (FALSE)
    [0]: { theta: Math.PI / 2, phi: Math.PI / 2 }, // Equator (SUPERPOSITION)
    [1]: { theta: 0, phi: 0 }                    // North pole (TRUE)
  };
  return BLOCH_STATES[trit];
}

/**
 * Convert Bloch sphere coordinates to quaternion
 */
export function blochToQuaternion(theta: number, phi: number): Quaternion {
  // |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
  // Maps to rotation quaternion
  const halfTheta = theta / 2;

  return {
    w: Math.cos(halfTheta),
    x: Math.sin(halfTheta) * Math.cos(phi),
    y: Math.sin(halfTheta) * Math.sin(phi),
    z: 0  // Reserved for time evolution
  };
}

/**
 * Map error code to position on the error sphere
 */
export function errorToSIG(code: number): SIGCoordinate {
  const category = Math.floor(code / 100);
  const specific = code % 100;

  return {
    r: specific / 100,                    // Severity determines radius
    theta: (category * Math.PI) / 5,      // Category determines angle
    tau: Date.now() / 1000                // Current time
  };
}

// =============================================================================
// GENERATING REALITY
// =============================================================================

/**
 * An Image is a frozen moment - a projection from 4D to 2D
 */
export interface Image {
  width: number;
  height: number;
  pixels: number[][][];  // [y][x][rgba]

  // The math that generated this
  source: Expression;

  // Position in SIG space
  sig: SIGCoordinate;
}

/**
 * Motion is the evolution of images over time
 */
export interface Motion {
  frames: Image[];
  fps: number;

  // The differential equation governing the motion
  dynamics: {
    position: (t: number) => { x: number; y: number; z: number };
    velocity: (t: number) => { x: number; y: number; z: number };
    acceleration: (t: number) => { x: number; y: number; z: number };
  };

  // Quaternion path through rotation space
  rotation: (t: number) => Quaternion;
}

/**
 * Sound is oscillation made audible
 */
export interface Sound {
  samples: number[];
  sampleRate: number;

  // The wave equation
  wave: {
    frequency: number;
    amplitude: number;
    phase: number;
    harmonics: { n: number; amplitude: number; phase: number }[];
  };
}

/**
 * Generate a simple image from mathematical function
 */
export function generateImage(
  width: number,
  height: number,
  f: (x: number, y: number) => { r: number; g: number; b: number; a: number }
): Image {
  const pixels: number[][][] = [];

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      // Normalize coordinates to [-1, 1]
      const nx = (2 * x / width) - 1;
      const ny = (2 * y / height) - 1;

      const color = f(nx, ny);
      pixels[y][x] = [
        Math.floor(color.r * 255),
        Math.floor(color.g * 255),
        Math.floor(color.b * 255),
        Math.floor(color.a * 255)
      ];
    }
  }

  return {
    width,
    height,
    pixels,
    source: {
      form: {
        math: { equation: 'f(x,y) → RGBA', domain: '[-1,1]²', constraints: [], type: 'definition' },
        code: { source: f.toString(), language: 'TypeScript', inputs: [], outputs: [], effects: [], invariants: [] },
        physics: { law: 'light emission', symmetry: 'continuous', dimension: '[L⁻²]', units: 'candela/m²', constants: {} },
        language: { statement: 'A function mapping 2D coordinates to colors', semantics: 'f: ℝ² → ℝ⁴', pragmatics: 'visual output', ambiguity: 0 }
      },
      coherence: 1,
      mismatches: []
    },
    sig: { r: 1, theta: 0, tau: Date.now() / 1000 }
  };
}

// =============================================================================
// THE UNIFIED INTERPRETATION
// =============================================================================

/**
 * When a bug occurs, interpret it across all four domains
 */
export function interpretBug(bug: Bug): {
  math_interpretation: string;
  code_interpretation: string;
  physics_interpretation: string;
  language_interpretation: string;
  unified_interpretation: string;
  suggested_action: string;
} {
  const { signal, hypothesis } = bug;

  // Find the most likely hypothesis
  const best = hypothesis.reduce((a, b) =>
    (a.confidence > b.confidence) ? a : b
  );

  let mathInterp = '';
  let codeInterp = '';
  let physicsInterp = '';
  let langInterp = '';

  switch (best.type) {
    case 'undefined_elsewhere':
      mathInterp = `Axiom exists but not in current scope: ${best.where}`;
      codeInterp = `Import or define missing dependency from ${best.where}`;
      physicsInterp = `Conservation law holds in larger system`;
      langInterp = `Term defined in different context`;
      break;

    case 'defined_incorrectly':
      mathInterp = `Definition contains error: ${best.what}`;
      codeInterp = `Implementation bug in: ${best.what}`;
      physicsInterp = `Model approximation invalid here`;
      langInterp = `Semantic mismatch: word used incorrectly`;
      break;

    case 'model_mismatch':
      mathInterp = `Mathematical model insufficient`;
      codeInterp = `Simulation diverges from reality`;
      physicsInterp = `Reality: ${best.physics_says}`;
      langInterp = `Description doesn't match observation`;
      break;

    case 'language_ambiguity':
      mathInterp = `Multiple valid interpretations exist`;
      codeInterp = `Specification ambiguous: ${best.interpretations.join(' OR ')}`;
      physicsInterp = `Observable depends on frame of reference`;
      langInterp = `Disambiguate: ${best.interpretations.join(', ')}`;
      break;
  }

  const unified = `
    The bug signals a mismatch at error code ${signal.error_code}.
    Expected: ${JSON.stringify(signal.expected)}
    Actual: ${JSON.stringify(signal.actual)}
    Delta: ${signal.delta}

    Most likely cause (${(best.confidence * 100).toFixed(1)}% confidence):
    ${best.type.replace(/_/g, ' ').toUpperCase()}

    Math says: ${mathInterp}
    Code says: ${codeInterp}
    Physics says: ${physicsInterp}
    Language says: ${langInterp}
  `.trim();

  const action = best.type === 'undefined_elsewhere'
    ? `Search for existing definition in: ${(best as any).where}`
    : best.type === 'defined_incorrectly'
      ? `Review and correct: ${(best as any).what}`
      : best.type === 'model_mismatch'
        ? `Update model to match physics: ${(best as any).physics_says}`
        : `Clarify ambiguity with stakeholder`;

  return {
    math_interpretation: mathInterp,
    code_interpretation: codeInterp,
    physics_interpretation: physicsInterp,
    language_interpretation: langInterp,
    unified_interpretation: unified,
    suggested_action: action
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Core types
  Trit: [-1, 0, 1] as const,

  // Coherence
  phaseDerivative,
  calculateCoherence,

  // Quaternion operations
  quaternionMultiply,
  quaternionNormalize,
  quaternionFromAxisAngle,
  rotatePoint,

  // Bloch sphere
  tritToBloch,
  blochToQuaternion,
  errorToSIG,

  // Generation
  generateImage,

  // Interpretation
  interpretBug,
};
