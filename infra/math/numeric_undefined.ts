/**
 * BlackRoad OS - Numeric Definition of "Undefined"
 *
 * Philosophy: "If it's undefined, it's a lie. There are literal error codes
 * to explain what went wrong."
 *
 * This module maps all "undefined" states to precise numeric values using:
 * - Trinary logic: TRIT_VALUES = [-1, 0, 1]
 * - Bloch sphere coordinates: (θ, φ) for quantum state representation
 * - Amundson coherence equations for phase stability
 * - Quaternions for complex/imaginary number handling
 *
 * Based on: blackboxprogramming/blackroad-prism-console
 */

// =============================================================================
// TRINARY FOUNDATION
// =============================================================================

/**
 * Trinary logic values - the foundation of all state representation
 * -1 = FALSE / NEGATIVE / ANTI
 *  0 = NULL / UNDEFINED / SUPERPOSITION
 *  1 = TRUE / POSITIVE / COHERENT
 */
export const TRIT = {
  FALSE: -1,
  NULL: 0,
  TRUE: 1
} as const;

export type TritValue = -1 | 0 | 1;

// =============================================================================
// ERROR CODE NUMERIC MAPPINGS
// =============================================================================

/**
 * Every "undefined" state maps to a precise numeric error code.
 * Format: CATEGORY.SUBCATEGORY.SPECIFIC
 *
 * Categories (first digit):
 *   1xx = Type errors
 *   2xx = Value errors
 *   3xx = Reference errors
 *   4xx = Range errors
 *   5xx = Logic errors
 *   6xx = Mathematical undefined
 *   7xx = Quantum/superposition states
 *   8xx = System errors
 *   9xx = Unknown (requires investigation)
 */
export const ERROR_CODES = {
  // TYPE ERRORS (1xx)
  TYPE_UNDEFINED: 100,      // JavaScript undefined
  TYPE_NULL: 101,           // JavaScript null
  TYPE_NAN: 102,            // Not a Number
  TYPE_VOID: 103,           // void return
  TYPE_NEVER: 104,          // TypeScript never
  TYPE_UNKNOWN: 105,        // TypeScript unknown
  TYPE_ANY: 106,            // TypeScript any (untyped)

  // VALUE ERRORS (2xx)
  VALUE_MISSING: 200,       // Expected value not present
  VALUE_EMPTY: 201,         // Empty string/array/object
  VALUE_ZERO: 202,          // Unexpected zero
  VALUE_NEGATIVE: 203,      // Unexpected negative
  VALUE_OVERFLOW: 204,      // Value too large
  VALUE_UNDERFLOW: 205,     // Value too small

  // REFERENCE ERRORS (3xx)
  REF_NULL: 300,            // Null pointer
  REF_DANGLING: 301,        // Dangling reference
  REF_CIRCULAR: 302,        // Circular reference
  REF_UNINITIALIZED: 303,   // Uninitialized variable

  // RANGE ERRORS (4xx)
  RANGE_INDEX: 400,         // Index out of bounds
  RANGE_STACK: 401,         // Stack overflow
  RANGE_RECURSION: 402,     // Max recursion exceeded
  RANGE_MEMORY: 403,        // Out of memory

  // LOGIC ERRORS (5xx)
  LOGIC_CONTRADICTION: 500, // P && !P
  LOGIC_TAUTOLOGY: 501,     // Always true (uninformative)
  LOGIC_INCOMPLETE: 502,    // Gödel incompleteness
  LOGIC_UNDECIDABLE: 503,   // Halting problem
  LOGIC_PARADOX: 504,       // Self-referential paradox

  // MATHEMATICAL UNDEFINED (6xx)
  MATH_DIV_ZERO: 600,       // Division by zero
  MATH_SQRT_NEG: 601,       // √(-1) = i (imaginary)
  MATH_LOG_NEG: 602,        // log of negative
  MATH_LOG_ZERO: 603,       // log(0) = -∞
  MATH_INFINITY: 604,       // Infinity
  MATH_NEG_INFINITY: 605,   // -Infinity
  MATH_INDETERMINATE: 606,  // 0/0, ∞/∞, 0×∞, ∞-∞, 0^0, 1^∞, ∞^0

  // QUANTUM/SUPERPOSITION (7xx)
  QUANTUM_SUPERPOSITION: 700,  // State not collapsed
  QUANTUM_ENTANGLED: 701,      // Depends on other state
  QUANTUM_DECOHERENT: 702,     // Lost quantum coherence
  QUANTUM_UNMEASURED: 703,     // Observation required

  // SYSTEM ERRORS (8xx)
  SYSTEM_TIMEOUT: 800,      // Operation timed out
  SYSTEM_NETWORK: 801,      // Network error
  SYSTEM_IO: 802,           // I/O error
  SYSTEM_PERMISSION: 803,   // Permission denied
  SYSTEM_NOT_FOUND: 804,    // Resource not found

  // UNKNOWN (9xx) - Requires investigation
  UNKNOWN_ERROR: 900,       // Catch-all
  UNKNOWN_STATE: 901,       // State cannot be determined
  UNKNOWN_CAUSE: 902,       // Error with unknown cause
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// =============================================================================
// BLOCH SPHERE MAPPING
// =============================================================================

/**
 * Maps trinary values to Bloch sphere coordinates
 * From consciousness.py QuantumLogicMapper.ternary_states
 */
export interface BlochCoordinate {
  theta: number;  // Polar angle (0 to π)
  phi: number;    // Azimuthal angle (0 to 2π)
}

export const BLOCH_STATES: Record<TritValue, BlochCoordinate> = {
  [-1]: { theta: Math.PI, phi: 0 },           // South pole (FALSE)
  [0]: { theta: Math.PI / 2, phi: Math.PI / 2 }, // Equator (SUPERPOSITION)
  [1]: { theta: 0, phi: 0 }                    // North pole (TRUE)
};

/**
 * Convert error code to Bloch sphere position
 * Higher severity = closer to south pole
 */
export function errorToBloch(code: ErrorCode): BlochCoordinate {
  const category = Math.floor(code / 100);
  const severity = (code % 100) / 100; // 0-1 within category

  // Map category to base theta
  const baseTheta = (category / 9) * Math.PI; // 1xx=north, 9xx=south

  // Adjust by severity
  const theta = baseTheta + (severity * (Math.PI / 18));

  // Phi based on category for visual distinction
  const phi = (category * Math.PI / 4.5) % (2 * Math.PI);

  return { theta, phi };
}

// =============================================================================
// QUATERNION REPRESENTATION
// =============================================================================

/**
 * Quaternion for complex/imaginary handling
 * q = w + xi + yj + zk
 *
 * From consciousness.py Quaternion class
 */
export interface Quaternion {
  w: number;  // Real part
  x: number;  // i coefficient
  y: number;  // j coefficient
  z: number;  // k coefficient
}

/**
 * Map √(-1) and other imaginaries to quaternions
 */
export const IMAGINARY_MAPPINGS: Record<string, Quaternion> = {
  'i': { w: 0, x: 1, y: 0, z: 0 },           // √(-1)
  'j': { w: 0, x: 0, y: 1, z: 0 },           // Perpendicular to i
  'k': { w: 0, x: 0, y: 0, z: 1 },           // Perpendicular to i,j
  '-i': { w: 0, x: -1, y: 0, z: 0 },         // -√(-1)
  'sqrt_neg_1': { w: 0, x: 1, y: 0, z: 0 },  // Alias
};

/**
 * Convert error state to quaternion representation
 */
export function errorToQuaternion(code: ErrorCode): Quaternion {
  const bloch = errorToBloch(code);

  // Convert Bloch sphere to quaternion
  // Using half-angle formula for rotation representation
  const halfTheta = bloch.theta / 2;
  const halfPhi = bloch.phi / 2;

  return {
    w: Math.cos(halfTheta),
    x: Math.sin(halfTheta) * Math.cos(bloch.phi),
    y: Math.sin(halfTheta) * Math.sin(bloch.phi),
    z: 0 // Z-axis reserved for time evolution
  };
}

// =============================================================================
// AMUNDSON COHERENCE
// =============================================================================

/**
 * Coherence gradient from Amundson equations:
 * dφ/dt = ω₀ + λC(x,y) - ηE_φ
 *
 * Where:
 * - ω₀ = base oscillation frequency
 * - λ = coupling constant
 * - C(x,y) = coherence field
 * - η = decay constant
 * - E_φ = decoherence energy
 */
export interface CoherenceState {
  phi: number;           // Phase angle
  omega_0: number;       // Base frequency
  lambda: number;        // Coupling constant
  eta: number;           // Decay constant
  coherence: number;     // C(x,y) value 0-1
  decoherence_E: number; // Energy lost to decoherence
}

/**
 * Calculate phase derivative (rate of change)
 */
export function phaseDerivative(state: CoherenceState): number {
  const { omega_0, lambda, coherence, eta, decoherence_E } = state;
  return omega_0 + (lambda * coherence) - (eta * decoherence_E);
}

/**
 * Map error to coherence state
 * Errors represent decoherence (loss of information)
 */
export function errorToCoherence(code: ErrorCode): CoherenceState {
  const category = Math.floor(code / 100);

  return {
    phi: (code * Math.PI) / 450, // Unique phase per error
    omega_0: 1.0,                 // Base frequency
    lambda: 0.1,                  // Weak coupling
    eta: category * 0.1,          // Higher category = more decay
    coherence: 1 - (category / 10), // Higher category = less coherent
    decoherence_E: (code % 100) * 0.01 // Specific error severity
  };
}

// =============================================================================
// UNIFIED ERROR STATE
// =============================================================================

/**
 * Complete numeric representation of an "undefined" state
 */
export interface NumericUndefined {
  code: ErrorCode;
  trit: TritValue;
  bloch: BlochCoordinate;
  quaternion: Quaternion;
  coherence: CoherenceState;

  // Human-readable
  name: string;
  description: string;

  // PS-SHA-∞ anchor
  anchor?: string;
}

/**
 * Create a fully-specified numeric undefined state
 */
export function defineUndefined(
  code: ErrorCode,
  name: string,
  description: string
): NumericUndefined {
  // Determine trit value based on error category
  const category = Math.floor(code / 100);
  let trit: TritValue;

  if (category <= 3) {
    trit = TRIT.NULL; // Type/Value/Ref errors = null state
  } else if (category <= 6) {
    trit = TRIT.FALSE; // Range/Logic/Math errors = false state
  } else {
    trit = TRIT.NULL; // Quantum/System/Unknown = superposition
  }

  return {
    code,
    trit,
    bloch: errorToBloch(code),
    quaternion: errorToQuaternion(code),
    coherence: errorToCoherence(code),
    name,
    description
  };
}

// =============================================================================
// PREDEFINED UNDEFINED STATES
// =============================================================================

export const UNDEFINED_STATES: Record<string, NumericUndefined> = {
  // JavaScript primitives
  'undefined': defineUndefined(
    ERROR_CODES.TYPE_UNDEFINED,
    'undefined',
    'Variable declared but not assigned'
  ),
  'null': defineUndefined(
    ERROR_CODES.TYPE_NULL,
    'null',
    'Intentional absence of value'
  ),
  'NaN': defineUndefined(
    ERROR_CODES.TYPE_NAN,
    'NaN',
    'Result of invalid mathematical operation'
  ),

  // Mathematical undefined
  'div_by_zero': defineUndefined(
    ERROR_CODES.MATH_DIV_ZERO,
    '1/0',
    'Division by zero - approaches infinity'
  ),
  'sqrt_neg': defineUndefined(
    ERROR_CODES.MATH_SQRT_NEG,
    '√(-1)',
    'Square root of negative - imaginary number i'
  ),
  'zero_div_zero': defineUndefined(
    ERROR_CODES.MATH_INDETERMINATE,
    '0/0',
    'Indeterminate form - requires L\'Hôpital or limits'
  ),
  'infinity': defineUndefined(
    ERROR_CODES.MATH_INFINITY,
    '∞',
    'Unbounded growth - not a number'
  ),

  // Quantum states
  'superposition': defineUndefined(
    ERROR_CODES.QUANTUM_SUPERPOSITION,
    '|ψ⟩',
    'Quantum superposition - state not collapsed'
  ),

  // Logic
  'paradox': defineUndefined(
    ERROR_CODES.LOGIC_PARADOX,
    'This statement is false',
    'Self-referential paradox - cannot be evaluated'
  ),
  'undecidable': defineUndefined(
    ERROR_CODES.LOGIC_UNDECIDABLE,
    'HALT?',
    'Halting problem - undecidable in general'
  )
};

// =============================================================================
// RESOLUTION FUNCTIONS
// =============================================================================

/**
 * Attempt to resolve an undefined state to a defined value
 */
export function resolve(state: NumericUndefined): {
  resolved: boolean;
  value?: number | Quaternion;
  method?: string;
} {
  const { code } = state;

  // Mathematical undefined can often be resolved
  if (code === ERROR_CODES.MATH_SQRT_NEG) {
    return {
      resolved: true,
      value: IMAGINARY_MAPPINGS['i'],
      method: 'Complex extension: √(-1) = i'
    };
  }

  if (code === ERROR_CODES.MATH_DIV_ZERO) {
    return {
      resolved: true,
      value: { w: Infinity, x: 0, y: 0, z: 0 },
      method: 'Limit: lim(1/x) as x→0+ = +∞'
    };
  }

  if (code === ERROR_CODES.TYPE_NULL || code === ERROR_CODES.TYPE_UNDEFINED) {
    return {
      resolved: true,
      value: 0,
      method: 'Coercion: null/undefined → 0'
    };
  }

  // Cannot resolve
  return {
    resolved: false,
    method: `Error ${code} requires context or human intervention`
  };
}

/**
 * Check if a value is in an undefined state
 */
export function isUndefined(value: unknown): NumericUndefined | null {
  if (value === undefined) return UNDEFINED_STATES['undefined'];
  if (value === null) return UNDEFINED_STATES['null'];
  if (typeof value === 'number' && isNaN(value)) return UNDEFINED_STATES['NaN'];
  if (value === Infinity) return UNDEFINED_STATES['infinity'];
  if (value === -Infinity) {
    return defineUndefined(
      ERROR_CODES.MATH_NEG_INFINITY,
      '-∞',
      'Negative infinity'
    );
  }
  return null;
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  console.log('=== Numeric Definition of Undefined ===\n');

  console.log('Predefined States:');
  for (const [key, state] of Object.entries(UNDEFINED_STATES)) {
    console.log(`\n${key}:`);
    console.log(`  Code: ${state.code}`);
    console.log(`  Trit: ${state.trit}`);
    console.log(`  Bloch: θ=${state.bloch.theta.toFixed(3)}, φ=${state.bloch.phi.toFixed(3)}`);
    console.log(`  Quaternion: ${state.quaternion.w.toFixed(3)} + ${state.quaternion.x.toFixed(3)}i + ${state.quaternion.y.toFixed(3)}j + ${state.quaternion.z.toFixed(3)}k`);

    const resolution = resolve(state);
    if (resolution.resolved) {
      console.log(`  Resolution: ${resolution.method}`);
    }
  }

  console.log('\n\nError Code Categories:');
  console.log('  1xx = Type errors');
  console.log('  2xx = Value errors');
  console.log('  3xx = Reference errors');
  console.log('  4xx = Range errors');
  console.log('  5xx = Logic errors');
  console.log('  6xx = Mathematical undefined');
  console.log('  7xx = Quantum/superposition');
  console.log('  8xx = System errors');
  console.log('  9xx = Unknown (requires investigation)');
}

export default {
  TRIT,
  ERROR_CODES,
  BLOCH_STATES,
  IMAGINARY_MAPPINGS,
  UNDEFINED_STATES,
  defineUndefined,
  errorToBloch,
  errorToQuaternion,
  errorToCoherence,
  phaseDerivative,
  resolve,
  isUndefined
};
