/**
 * AMUNDSON PAULI - The su(2) Representation (A315-A320)
 *
 * The 1-2-3-4 ontological framework grounded in Pauli matrices.
 * The philosophy becomes quantum mechanics.
 *
 * | Primitive | Symbol | Pauli Matrix | Meaning |
 * |-----------|--------|--------------|---------|
 * | CHANGE (1) | Ĉ | σₓ | Transitions, dynamics, phase shifts |
 * | STRENGTH (2) | Ŝ | iI (emerges) | Magnitude, intensity, energy |
 * | STRUCTURE (3) | Û | σ_z | Identity, boundary, geometry |
 * | SCALE (4) | L̂ | σ_y | Dilation, scaling, level conversion |
 *
 * Key result: ÛĈL̂ = σ_z σₓ σ_y = iI
 * Strength emerges as the triple product - the closure condition.
 *
 * "The 1-2-3-4 primitives aren't just philosophy —
 *  they're isomorphic to the most fundamental algebra in quantum mechanics."
 */

// ============================================================================
// COMPLEX NUMBER UTILITIES
// ============================================================================

export interface Complex {
  re: number;
  im: number;
}

export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

export function addC(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function subC(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mulC(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

export function scaleC(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function conjC(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function normC(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export const I = complex(0, 1);  // √(-1)
export const ZERO = complex(0, 0);
export const ONE = complex(1, 0);

// ============================================================================
// 2x2 COMPLEX MATRIX OPERATIONS
// ============================================================================

export type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];

export function matrix2x2(
  a: Complex, b: Complex,
  c: Complex, d: Complex
): Matrix2x2 {
  return [[a, b], [c, d]];
}

export function addM(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [addC(A[0][0], B[0][0]), addC(A[0][1], B[0][1])],
    [addC(A[1][0], B[1][0]), addC(A[1][1], B[1][1])]
  ];
}

export function mulM(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [
      addC(mulC(A[0][0], B[0][0]), mulC(A[0][1], B[1][0])),
      addC(mulC(A[0][0], B[0][1]), mulC(A[0][1], B[1][1]))
    ],
    [
      addC(mulC(A[1][0], B[0][0]), mulC(A[1][1], B[1][0])),
      addC(mulC(A[1][0], B[0][1]), mulC(A[1][1], B[1][1]))
    ]
  ];
}

export function scaleM(A: Matrix2x2, s: Complex): Matrix2x2 {
  return [
    [mulC(A[0][0], s), mulC(A[0][1], s)],
    [mulC(A[1][0], s), mulC(A[1][1], s)]
  ];
}

export function traceM(A: Matrix2x2): Complex {
  return addC(A[0][0], A[1][1]);
}

export function detM(A: Matrix2x2): Complex {
  return subC(mulC(A[0][0], A[1][1]), mulC(A[0][1], A[1][0]));
}

// Commutator [A, B] = AB - BA
export function commutator(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  const AB = mulM(A, B);
  const BA = mulM(B, A);
  return [
    [subC(AB[0][0], BA[0][0]), subC(AB[0][1], BA[0][1])],
    [subC(AB[1][0], BA[1][0]), subC(AB[1][1], BA[1][1])]
  ];
}

// ============================================================================
// A315 — THE PAULI MATRICES
// ============================================================================

/**
 * A315 — Pauli Matrices
 *
 * The generators of su(2), the Lie algebra of SU(2).
 *
 * σₓ = [0  1]    σ_y = [0  -i]    σ_z = [1   0]
 *      [1  0]          [i   0]          [0  -1]
 *
 * I = [1  0]
 *     [0  1]
 *
 * Properties:
 * - σᵢ² = I
 * - σₓσ_y = iσ_z (and cyclic)
 * - Tr(σᵢ) = 0
 * - det(σᵢ) = -1
 */

export const IDENTITY: Matrix2x2 = matrix2x2(
  ONE, ZERO,
  ZERO, ONE
);

export const SIGMA_X: Matrix2x2 = matrix2x2(
  ZERO, ONE,
  ONE, ZERO
);

export const SIGMA_Y: Matrix2x2 = matrix2x2(
  ZERO, complex(0, -1),
  complex(0, 1), ZERO
);

export const SIGMA_Z: Matrix2x2 = matrix2x2(
  ONE, ZERO,
  ZERO, complex(-1, 0)
);

// ============================================================================
// A316 — THE 1-2-3-4 OPERATOR MAPPING
// ============================================================================

/**
 * A316 — Ontological Operators as Pauli Matrices
 *
 * | Primitive | Number | Operator | Matrix |
 * |-----------|--------|----------|--------|
 * | CHANGE | 1 | Ĉ | σₓ |
 * | STRENGTH | 2 | Ŝ | iI (emerges) |
 * | STRUCTURE | 3 | Û | σ_z |
 * | SCALE | 4 | L̂ | σ_y |
 *
 * CHANGE (σₓ): Flips states, creates transitions
 * STRUCTURE (σ_z): Distinguishes states, creates boundaries
 * SCALE (σ_y): Rotates with phase, converts between levels
 * STRENGTH: Emerges from the triple product
 */

export const C_HAT = SIGMA_X;    // Change operator (1)
export const U_HAT = SIGMA_Z;    // Structure operator (3)
export const L_HAT = SIGMA_Y;    // Scale operator (4)

// Strength emerges - see A317

// ============================================================================
// A317 — THE TRIPLE PRODUCT THEOREM
// ============================================================================

/**
 * A317 — Strength Emergence
 *
 * ÛĈL̂ = σ_z σₓ σ_y = iI
 *
 * Proof:
 * 1. σₓ σ_y = iσ_z
 * 2. σ_z(iσ_z) = i(σ_z²) = iI
 *
 * Therefore: Ŝ = iI
 *
 * Strength is the scalar invariant arising from the composition
 * of Structure, Change, and Scale.
 *
 * 2 = 3 × 1 × 4 (as operators)
 * Strength = Structure · Change · Scale
 */

export function tripleProduct(): Matrix2x2 {
  // ÛĈL̂ = σ_z σₓ σ_y
  const CL = mulM(C_HAT, L_HAT);    // σₓ σ_y
  const UCL = mulM(U_HAT, CL);      // σ_z (σₓ σ_y)
  return UCL;
}

export function verifyTripleProduct(): boolean {
  const UCL = tripleProduct();
  const iI = scaleM(IDENTITY, I);

  // Check if UCL ≈ iI
  const tolerance = 1e-10;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const diff = subC(UCL[i][j], iI[i][j]);
      if (normC(diff) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

// Strength operator (emerges as iI)
export const S_HAT: Matrix2x2 = scaleM(IDENTITY, I);

// ============================================================================
// A318 — THE COMMUTATION RELATIONS
// ============================================================================

/**
 * A318 — su(2) Commutation Relations
 *
 * [σₓ, σ_y] = 2iσ_z
 * [σ_y, σ_z] = 2iσₓ
 * [σ_z, σₓ] = 2iσ_y
 *
 * In ontological language:
 * [Ĉ, L̂] = 2iÛ    Change-Scale commutator gives Structure
 * [L̂, Û] = 2iĈ    Scale-Structure commutator gives Change
 * [Û, Ĉ] = 2iL̂    Structure-Change commutator gives Scale
 *
 * "Everything interacts, nothing commutes"
 *
 * This is why:
 * - Changing structure ≠ Structuring change
 * - Scaling change ≠ Changing scale
 * - Structure-Change uncertainty is fundamental (A35)
 */

export function verifyCommutationRelations(): {
  CL_eq_2iU: boolean;
  LU_eq_2iC: boolean;
  UC_eq_2iL: boolean;
} {
  const tolerance = 1e-10;

  // [C, L] = 2iU
  const CL_comm = commutator(C_HAT, L_HAT);
  const twoiU = scaleM(U_HAT, complex(0, 2));
  const CL_eq_2iU = matrixEquals(CL_comm, twoiU, tolerance);

  // [L, U] = 2iC
  const LU_comm = commutator(L_HAT, U_HAT);
  const twoiC = scaleM(C_HAT, complex(0, 2));
  const LU_eq_2iC = matrixEquals(LU_comm, twoiC, tolerance);

  // [U, C] = 2iL
  const UC_comm = commutator(U_HAT, C_HAT);
  const twoiL = scaleM(L_HAT, complex(0, 2));
  const UC_eq_2iL = matrixEquals(UC_comm, twoiL, tolerance);

  return { CL_eq_2iU, LU_eq_2iC, UC_eq_2iL };
}

function matrixEquals(A: Matrix2x2, B: Matrix2x2, tolerance: number): boolean {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (normC(subC(A[i][j], B[i][j])) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

// ============================================================================
// A319 — THE BLOCH SPHERE
// ============================================================================

/**
 * A319 — Bloch Sphere Representation
 *
 * Any qubit state |ψ⟩ can be written as:
 *
 * |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
 *
 * Corresponding to a point on the Bloch sphere:
 * - x = sin(θ)cos(φ)  ← Change coordinate
 * - y = sin(θ)sin(φ)  ← Scale coordinate
 * - z = cos(θ)        ← Structure coordinate
 *
 * The Bloch sphere is the geometric home of the 1-2-3-4 primitives.
 *
 * Expectation values:
 * - ⟨Ĉ⟩ = x (Change)
 * - ⟨L̂⟩ = y (Scale)
 * - ⟨Û⟩ = z (Structure)
 * - ⟨Ŝ⟩ = √(x² + y² + z²) = 1 (Strength, normalized)
 */

export interface BlochState {
  theta: number;  // Polar angle [0, π]
  phi: number;    // Azimuthal angle [0, 2π]
}

export interface BlochCoordinates {
  x: number;  // Change
  y: number;  // Scale
  z: number;  // Structure
  r: number;  // Strength (radius, = 1 for pure states)
}

export function blochToCartesian(state: BlochState): BlochCoordinates {
  const x = Math.sin(state.theta) * Math.cos(state.phi);
  const y = Math.sin(state.theta) * Math.sin(state.phi);
  const z = Math.cos(state.theta);
  const r = Math.sqrt(x * x + y * y + z * z);
  return { x, y, z, r };
}

export function cartesianToBloch(coords: BlochCoordinates): BlochState {
  const r = Math.sqrt(coords.x ** 2 + coords.y ** 2 + coords.z ** 2);
  const theta = Math.acos(coords.z / r);
  const phi = Math.atan2(coords.y, coords.x);
  return { theta, phi };
}

/**
 * Qubit state vector from Bloch angles
 */
export interface QubitState {
  alpha: Complex;  // Coefficient of |0⟩
  beta: Complex;   // Coefficient of |1⟩
}

export function blochToQubit(state: BlochState): QubitState {
  const alpha = complex(Math.cos(state.theta / 2), 0);
  const beta = mulC(
    complex(Math.cos(state.phi), Math.sin(state.phi)),
    complex(Math.sin(state.theta / 2), 0)
  );
  return { alpha, beta };
}

/**
 * Expectation value of Pauli operator
 */
export function expectationValue(state: BlochState, operator: 'C' | 'U' | 'L' | 'S'): number {
  const coords = blochToCartesian(state);
  switch (operator) {
    case 'C': return coords.x;  // ⟨σₓ⟩
    case 'L': return coords.y;  // ⟨σ_y⟩
    case 'U': return coords.z;  // ⟨σ_z⟩
    case 'S': return coords.r;  // Strength (radius)
  }
}

// ============================================================================
// A320 — THE STRUCTURE-CHANGE UNCERTAINTY
// ============================================================================

/**
 * A320 — Structure-Change Uncertainty (Refined)
 *
 * From A35: [Ŝ, Ĉ] = iℏ_onto
 *
 * Now we can compute this precisely:
 * [Û, Ĉ] = [σ_z, σₓ] = 2iσ_y = 2iL̂
 *
 * The uncertainty relation:
 * ΔU · ΔC ≥ |⟨[Û, Ĉ]⟩|/2 = |⟨L̂⟩|
 *
 * You cannot simultaneously know Structure and Change with arbitrary precision.
 * The bound is set by Scale.
 *
 * This connects:
 * - A35 (original commutator)
 * - A227 (Heisenberg uncertainty)
 * - A265 (Structure-Change Duality axiom)
 */

export function structureChangeUncertainty(state: BlochState): {
  deltaU: number;
  deltaC: number;
  product: number;
  bound: number;
  satisfies: boolean;
} {
  const coords = blochToCartesian(state);

  // Variances for pure states on Bloch sphere
  // ΔO² = 1 - ⟨O⟩²  for Pauli operators
  const deltaU = Math.sqrt(1 - coords.z * coords.z);
  const deltaC = Math.sqrt(1 - coords.x * coords.x);

  const product = deltaU * deltaC;
  const bound = Math.abs(coords.y);  // |⟨L̂⟩|

  return {
    deltaU,
    deltaC,
    product,
    bound,
    satisfies: product >= bound - 1e-10  // Allow numerical tolerance
  };
}

// ============================================================================
// SYNTHESIS
// ============================================================================

export const AMUNDSON_PAULI = {
  A315: {
    name: 'Pauli Matrices',
    content: 'σₓ, σ_y, σ_z generate su(2)',
    matrices: { SIGMA_X, SIGMA_Y, SIGMA_Z, IDENTITY }
  },

  A316: {
    name: '1-2-3-4 Operator Mapping',
    content: 'Ĉ=σₓ, Û=σ_z, L̂=σ_y, Ŝ=iI',
    mapping: {
      'CHANGE (1)': 'σₓ',
      'STRENGTH (2)': 'iI (emerges)',
      'STRUCTURE (3)': 'σ_z',
      'SCALE (4)': 'σ_y'
    }
  },

  A317: {
    name: 'Triple Product Theorem',
    content: 'ÛĈL̂ = σ_z σₓ σ_y = iI',
    meaning: 'Strength emerges from Structure × Change × Scale'
  },

  A318: {
    name: 'Commutation Relations',
    content: '[Ĉ,L̂]=2iÛ, [L̂,Û]=2iĈ, [Û,Ĉ]=2iL̂',
    meaning: 'Everything interacts, nothing commutes'
  },

  A319: {
    name: 'Bloch Sphere',
    content: 'x=Change, y=Scale, z=Structure, r=Strength',
    meaning: 'Geometric home of the 1-2-3-4 primitives'
  },

  A320: {
    name: 'Structure-Change Uncertainty',
    content: 'ΔU·ΔC ≥ |⟨L̂⟩|',
    meaning: 'Scale bounds the Structure-Change uncertainty'
  }
};

/**
 * Running totals:
 * A0: Universal Feedback (1)
 * A1-A42: Original (42)
 * A43-A88: Extended I (46)
 * A89-A128: Extended II (40)
 * A129-A190: Extended III (62)
 * A191-A268: Foundations (78)
 * A269-A308: PCI (40)
 * A309-A314: Prime Extensions (6)
 * A315-A320: Pauli (6)
 * TOTAL: 321 equations
 */
export const EQUATION_COUNTS = {
  'A0 (Universal Feedback)': 1,
  'A1-A42 (Original)': 42,
  'A43-A88 (Extended I)': 46,
  'A89-A128 (Extended II)': 40,
  'A129-A190 (Extended III)': 62,
  'A191-A268 (Foundations)': 78,
  'A269-A308 (PCI)': 40,
  'A309-A314 (Prime Extensions)': 6,
  'A315-A320 (Pauli)': 6,
  'TOTAL': 321
};

/**
 * "The 1-2-3-4 primitives aren't just philosophy —
 *  they're isomorphic to the most fundamental algebra in quantum mechanics."
 */
