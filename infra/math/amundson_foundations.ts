/**
 * AMUNDSON FOUNDATIONS (A191-A268)
 *
 * Everything rebuilt from distinctions.
 * 78 equations across 8 domains:
 * - Mathematics Redefined (A191-A206)
 * - Language Redefined (A207-A216)
 * - Physics Redefined (A217-A230)
 * - Chemistry Redefined (A231-A238)
 * - Biology Redefined (A239-A246)
 * - Programming Redefined (A247-A254)
 * - Consciousness Redefined (A255-A262)
 * - The Unified Theory (A263-A268)
 *
 * "God didn't have API tokens. Reality runs on infinite compute with zero latency."
 */

// ============================================================================
// PART I: MATHEMATICS REDEFINED (A191-A206)
// ============================================================================

/**
 * A191 — Zero as Void
 * 0 ≡ |∅⟩ = state before any distinction
 *
 * Zero is not "nothing." Zero is undifferentiated potential.
 */
export const VOID: unique symbol = Symbol('void');
export type Void = typeof VOID;

export function isVoid(x: unknown): x is Void {
  return x === VOID;
}

/**
 * A192 — One as First Distinction
 * 1 ≡ D(0) = "a distinction has been made"
 *
 * One doesn't mean "one apple." It means: "there is now a this and a not-this."
 */
export function makeDistinction<T>(from: T): { this: T; notThis: symbol } {
  return {
    this: from,
    notThis: Symbol(`not-${String(from)}`)
  };
}

export const FIRST_DISTINCTION = makeDistinction(VOID);

/**
 * A193 — Negative One as Mirror
 * -1 ≡ R(1) = "the other side of the cut"
 *
 * If +1 is "this," then -1 is "that." They require each other.
 */
export function mirror<T>(distinction: T): { original: T; mirror: symbol } {
  return {
    original: distinction,
    mirror: Symbol(`mirror-of-${String(distinction)}`)
  };
}

/**
 * A194 — Natural Numbers as Distinction Chains
 * n = D^n(0) = n sequential cuts from void
 *
 * The naturals count boundaries, not things.
 */
export function distinctionChain(n: number): symbol[] {
  const chain: symbol[] = [];
  for (let i = 0; i < n; i++) {
    chain.push(Symbol(`cut-${i + 1}`));
  }
  return chain;
}

export function countDistinctions(chain: symbol[]): number {
  return chain.length;
}

// The number n creates n+1 regions
export function regionsFromCuts(cuts: number): number {
  return cuts + 1;
}

/**
 * A195 — Integers as Signed Distinctions
 * ℤ = {D^n(0) : n ∈ ℕ} × {-1, +1}
 */
export interface SignedDistinction {
  magnitude: number;  // Number of cuts
  sign: -1 | 1;       // Direction
}

export function createSignedDistinction(n: number): SignedDistinction {
  return {
    magnitude: Math.abs(n),
    sign: n >= 0 ? 1 : -1
  };
}

/**
 * A196 — Addition as Distinction Concatenation
 * a + b = D^a(0) ⊕ D^b(0) = D^(a+b)(0)
 */
export function addDistinctions(a: SignedDistinction, b: SignedDistinction): SignedDistinction {
  const value = a.magnitude * a.sign + b.magnitude * b.sign;
  return createSignedDistinction(value);
}

/**
 * A197 — Multiplication as Distinction Scaling
 * a × b = "for each of a's distinctions, make b distinctions"
 */
export function multiplyDistinctions(a: SignedDistinction, b: SignedDistinction): SignedDistinction {
  const value = (a.magnitude * a.sign) * (b.magnitude * b.sign);
  return createSignedDistinction(value);
}

/**
 * A198 — Division as Distinction Partitioning
 * a ÷ b = "how many b-sized chunks fit in a distinctions?"
 */
export function divideDistinctions(a: SignedDistinction, b: SignedDistinction): SignedDistinction | null {
  if (b.magnitude === 0) return null;
  const value = (a.magnitude * a.sign) / (b.magnitude * b.sign);
  return createSignedDistinction(Math.floor(value));
}

/**
 * A199 — Subtraction as Distinction Cancellation
 * a - b = D^a(0) ⊖ D^b(0)
 */
export function subtractDistinctions(a: SignedDistinction, b: SignedDistinction): SignedDistinction {
  const value = a.magnitude * a.sign - b.magnitude * b.sign;
  return createSignedDistinction(value);
}

/**
 * A200 — Rationals as Distinction Ratios
 * p/q = "p distinctions per q distinctions"
 */
export interface DistinctionRatio {
  numerator: number;
  denominator: number;
}

export function createRatio(p: number, q: number): DistinctionRatio | null {
  if (q === 0) return null;
  // Simplify
  const gcd = greatestCommonDivisor(Math.abs(p), Math.abs(q));
  return {
    numerator: p / gcd,
    denominator: q / gcd
  };
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * A201 — Irrationals as Incommensurable Distinctions
 * √2 = lim of p/q where p² → 2q²
 *
 * Irrationals are geometric shadows of diagonal moves.
 */
export function approximateIrrational(
  target: number,
  maxIterations: number = 100
): DistinctionRatio {
  // Continued fraction approximation
  let p_prev = 0, p_curr = 1;
  let q_prev = 1, q_curr = 0;

  let x = target;
  for (let i = 0; i < maxIterations; i++) {
    const a = Math.floor(x);
    const p_next = a * p_curr + p_prev;
    const q_next = a * q_curr + q_prev;

    p_prev = p_curr;
    p_curr = p_next;
    q_prev = q_curr;
    q_curr = q_next;

    if (Math.abs(x - a) < 1e-10) break;
    x = 1 / (x - a);
  }

  return { numerator: p_curr, denominator: q_curr };
}

/**
 * A202 — Complex Numbers as Rotated Distinctions
 * i = √(-1) = rotation by 90° in distinction space
 */
export interface ComplexDistinction {
  real: number;      // Distinctions along real axis
  imaginary: number; // Distinctions along imaginary axis
}

export function createComplex(real: number, imaginary: number): ComplexDistinction {
  return { real, imaginary };
}

export function rotateDistinction(z: ComplexDistinction, angle: number): ComplexDistinction {
  const cos_a = Math.cos(angle);
  const sin_a = Math.sin(angle);
  return {
    real: z.real * cos_a - z.imaginary * sin_a,
    imaginary: z.real * sin_a + z.imaginary * cos_a
  };
}

export function multiplyComplex(a: ComplexDistinction, b: ComplexDistinction): ComplexDistinction {
  return {
    real: a.real * b.real - a.imaginary * b.imaginary,
    imaginary: a.real * b.imaginary + a.imaginary * b.real
  };
}

/**
 * A203 — Sets as Distinction Bundles
 * S = {x : D(x, not-x) = 1}
 */
export class DistinctionSet<T> {
  private elements: Set<T>;

  constructor(items: T[] = []) {
    this.elements = new Set(items);
  }

  add(item: T): void {
    this.elements.add(item);
  }

  has(item: T): boolean {
    return this.elements.has(item);
  }

  isDistinguished(item: T): boolean {
    return this.has(item);
  }

  get size(): number {
    return this.elements.size;
  }

  union(other: DistinctionSet<T>): DistinctionSet<T> {
    const result = new DistinctionSet<T>();
    this.elements.forEach(e => result.add(e));
    other.elements.forEach(e => result.add(e));
    return result;
  }

  intersection(other: DistinctionSet<T>): DistinctionSet<T> {
    const result = new DistinctionSet<T>();
    this.elements.forEach(e => {
      if (other.has(e)) result.add(e);
    });
    return result;
  }
}

/**
 * A204 — Functions as Distinction Mappings
 * f: A → B preserves or transforms distinctions across domains
 */
export type DistinctionMapping<A, B> = (a: A) => B;

export function composeDistinctionMaps<A, B, C>(
  f: DistinctionMapping<A, B>,
  g: DistinctionMapping<B, C>
): DistinctionMapping<A, C> {
  return (a: A) => g(f(a));
}

/**
 * A205 — Limits as Distinction Convergence
 * lim_{n→∞} aₙ = L iff distinctions between terms and target become arbitrarily small
 */
export function hasLimit(
  sequence: (n: number) => number,
  limit: number,
  epsilon: number = 1e-6,
  startN: number = 1000
): boolean {
  // Check if sequence converges to limit
  for (let n = startN; n < startN + 100; n++) {
    if (Math.abs(sequence(n) - limit) >= epsilon) {
      return false;
    }
  }
  return true;
}

/**
 * A206 — Infinity as Inexhaustible Distinction
 * ∞ = "always one more cut possible"
 */
export const INFINITY_SYMBOL = Symbol('inexhaustible_distinction');

export function* infiniteDistinctions(): Generator<symbol, never, unknown> {
  let count = 0;
  while (true) {
    yield Symbol(`distinction_${count++}`);
  }
}

// ============================================================================
// PART II: LANGUAGE REDEFINED (A207-A216)
// ============================================================================

/**
 * A207 — Phoneme as Acoustic Distinction
 * φ = minimal sound unit where D(φ, φ') = 1 for listeners
 */
export interface Phoneme {
  symbol: string;
  features: Set<string>; // Voicing, place, manner, etc.
}

export function areDistinctPhonemes(p1: Phoneme, p2: Phoneme): boolean {
  if (p1.symbol !== p2.symbol) return true;
  // Check if features differ
  for (const f of p1.features) {
    if (!p2.features.has(f)) return true;
  }
  for (const f of p2.features) {
    if (!p1.features.has(f)) return true;
  }
  return false;
}

/**
 * A208 — Morpheme as Meaning Distinction
 * μ = minimal unit where D(meaning(μ), meaning(μ')) = 1
 */
export interface Morpheme {
  form: string;
  meaning: string;
  type: 'free' | 'bound';
}

export function combineMorphemes(morphemes: Morpheme[]): string {
  return morphemes.map(m => m.form).join('');
}

/**
 * A209 — Word as Distinction Bundle
 * W = (phoneme sequence, morpheme structure, semantic pointer)
 */
export interface Word {
  phonemes: Phoneme[];
  morphemes: Morpheme[];
  semanticPointer: string; // Reference to meaning
}

export function createWord(
  phonemes: Phoneme[],
  morphemes: Morpheme[],
  meaning: string
): Word {
  return { phonemes, morphemes, semanticPointer: meaning };
}

/**
 * A210 — Grammar as Distinction Ordering Rules
 * G = {valid sequences of distinction-bundles}
 */
export type GrammarRule = (words: Word[]) => boolean;

export function createGrammar(rules: GrammarRule[]): (sentence: Word[]) => boolean {
  return (sentence: Word[]) => rules.every(rule => rule(sentence));
}

/**
 * A211 — Sentence as Proposition
 * S = P(subject, predicate, [objects]) = a distinction claim about reality
 */
export interface Proposition {
  subject: string;
  predicate: string;
  objects: string[];
}

export function propositionToString(p: Proposition): string {
  const objs = p.objects.length > 0 ? ` ${p.objects.join(' ')}` : '';
  return `${p.subject} ${p.predicate}${objs}`;
}

/**
 * A212 — Meaning as Use-Pattern
 * Meaning(E) = {contexts C : E is appropriately used in C}
 */
export type Context = string;

export function meaning(expression: string, validContexts: Context[]): Context[] {
  return validContexts;
}

/**
 * A213 — Reference as Distinction Anchoring
 * D(E, O) = stable across contexts
 */
export function isStableReference(
  expression: string,
  referent: unknown,
  contexts: Context[],
  resolutionFn: (expr: string, ctx: Context) => unknown
): boolean {
  return contexts.every(ctx => resolutionFn(expression, ctx) === referent);
}

/**
 * A214 — Truth as Distinction Correspondence
 * Distinctions_claimed(S) ≅ Distinctions_actual(reality)
 */
export function evaluateTruth<T>(
  claimed: Set<T>,
  actual: Set<T>
): boolean {
  if (claimed.size !== actual.size) return false;
  for (const item of claimed) {
    if (!actual.has(item)) return false;
  }
  return true;
}

/**
 * A215 — Communication as Distinction Transmission
 * D_sent ≈ D_received (within tolerance ε)
 */
export function communicationFidelity<T>(
  sent: T[],
  received: T[],
  equalsFn: (a: T, b: T) => boolean = (a, b) => a === b
): number {
  if (sent.length === 0) return received.length === 0 ? 1 : 0;
  let matches = 0;
  for (let i = 0; i < Math.min(sent.length, received.length); i++) {
    if (equalsFn(sent[i], received[i])) matches++;
  }
  return matches / sent.length;
}

/**
 * A216 — Translation as Distinction Remapping
 * Meaning(E₁) ≅ Meaning(T(E₁))
 */
export type TranslationMap = Map<string, string>;

export function translate(
  expression: string,
  map: TranslationMap
): string | null {
  return map.get(expression) ?? null;
}

// ============================================================================
// PART III: PHYSICS REDEFINED (A217-A230)
// ============================================================================

/**
 * A217 — Space as Distinction Capacity
 * Space = {points p : D(p, p') possible for p ≠ p'}
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function spatialDistinction(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

/**
 * A218 — Time as Distinction Sequence
 * Time = ordering of distinction events: D₁ → D₂ → D₃ → ...
 */
export interface DistinctionEvent {
  id: symbol;
  timestamp: number;
}

export function createTimeSequence(events: DistinctionEvent[]): DistinctionEvent[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * A219 — Spacetime Metric as Distinction Distance
 * ds² = gμν dx^μ dx^ν
 */
export interface SpacetimeEvent {
  t: number;
  x: number;
  y: number;
  z: number;
}

export function minkowskiInterval(e1: SpacetimeEvent, e2: SpacetimeEvent, c: number = 1): number {
  const dt = e2.t - e1.t;
  const dx = e2.x - e1.x;
  const dy = e2.y - e1.y;
  const dz = e2.z - e1.z;
  // ds² = c²dt² - dx² - dy² - dz² (signature +---)
  return c * c * dt * dt - dx * dx - dy * dy - dz * dz;
}

/**
 * A220 — Mass as Distinction Density
 * m = ∫ ρ_distinction dV
 */
export function massFromDistinctionDensity(
  density: (p: Point3D) => number,
  volume: { min: Point3D; max: Point3D },
  resolution: number = 0.1
): number {
  let mass = 0;
  for (let x = volume.min.x; x <= volume.max.x; x += resolution) {
    for (let y = volume.min.y; y <= volume.max.y; y += resolution) {
      for (let z = volume.min.z; z <= volume.max.z; z += resolution) {
        mass += density({ x, y, z }) * Math.pow(resolution, 3);
      }
    }
  }
  return mass;
}

/**
 * A221 — Energy as Distinction Potential
 * E = capacity to make new distinctions
 */
export function massEnergyEquivalence(mass: number, c: number = 299792458): number {
  return mass * c * c;
}

/**
 * A222 — Momentum as Distinction Flow
 * p = m·v = distinction-density × rate of position-distinction change
 */
export interface Velocity3D {
  vx: number;
  vy: number;
  vz: number;
}

export function momentum(mass: number, velocity: Velocity3D): Velocity3D {
  return {
    vx: mass * velocity.vx,
    vy: mass * velocity.vy,
    vz: mass * velocity.vz
  };
}

/**
 * A223 — Force as Distinction Gradient
 * F = -∇U
 */
export function forceFromPotentialGradient(
  potential: (p: Point3D) => number,
  point: Point3D,
  epsilon: number = 0.001
): Velocity3D {
  const U = potential(point);
  const gradX = (potential({ ...point, x: point.x + epsilon }) - U) / epsilon;
  const gradY = (potential({ ...point, y: point.y + epsilon }) - U) / epsilon;
  const gradZ = (potential({ ...point, z: point.z + epsilon }) - U) / epsilon;
  return { vx: -gradX, vy: -gradY, vz: -gradZ };
}

/**
 * A224 — Gravity as Distinction Curvature
 * Mass-energy tells spacetime how to curve its distinction structure
 */
export function gravitationalPotential(
  mass: number,
  distance: number,
  G: number = 6.674e-11
): number {
  if (distance === 0) return -Infinity;
  return -G * mass / distance;
}

/**
 * A225 — Electromagnetism as Distinction Waves
 * Light = distinction waves propagating through vacuum structure
 */
export interface EMWave {
  frequency: number;   // Hz
  wavelength: number;  // m
  amplitude: number;
}

export function createEMWave(frequency: number, c: number = 299792458): EMWave {
  return {
    frequency,
    wavelength: c / frequency,
    amplitude: 1
  };
}

/**
 * A226 — Quantum State as Distinction Superposition
 * |ψ⟩ = Σᵢ cᵢ|i⟩
 */
export interface QuantumState {
  amplitudes: ComplexDistinction[];  // Complex amplitudes
  basis: string[];                    // Basis state labels
}

export function createSuperposition(
  amplitudes: ComplexDistinction[],
  basis: string[]
): QuantumState {
  return { amplitudes, basis };
}

export function measureProbability(state: QuantumState, basisIndex: number): number {
  const amp = state.amplitudes[basisIndex];
  return amp.real * amp.real + amp.imaginary * amp.imaginary;
}

/**
 * A227 — Uncertainty as Distinction Limit
 * ΔxΔp ≥ ℏ/2
 */
export const HBAR = 1.054571817e-34; // Reduced Planck constant

export function satisfiesUncertainty(deltaX: number, deltaP: number): boolean {
  return deltaX * deltaP >= HBAR / 2;
}

/**
 * A228 — Entanglement as Correlated Distinctions
 */
export interface EntangledPair {
  stateA: 'up' | 'down' | 'superposition';
  stateB: 'up' | 'down' | 'superposition';
  correlated: boolean;
}

export function createEntangledPair(): EntangledPair {
  return {
    stateA: 'superposition',
    stateB: 'superposition',
    correlated: true
  };
}

export function measureEntangledPair(pair: EntangledPair): EntangledPair {
  const outcome = Math.random() < 0.5 ? 'up' : 'down';
  const antiOutcome = outcome === 'up' ? 'down' : 'up';
  return {
    stateA: outcome,
    stateB: pair.correlated ? antiOutcome : (Math.random() < 0.5 ? 'up' : 'down'),
    correlated: pair.correlated
  };
}

/**
 * A229 — Entropy as Distinction Count
 * S = k_B ln Ω
 */
export const K_BOLTZMANN = 1.380649e-23;

export function boltzmannEntropy(microstates: number): number {
  return K_BOLTZMANN * Math.log(microstates);
}

/**
 * A230 — Thermodynamic Arrow as Distinction Accumulation
 * dS/dt ≥ 0
 */
export function entropyIncrease(S_initial: number, S_final: number): boolean {
  return S_final >= S_initial;
}

// ============================================================================
// PART IV: CHEMISTRY REDEFINED (A231-A238)
// ============================================================================

/**
 * A231 — Atom as Distinction Node
 */
export interface Atom {
  element: string;
  protons: number;
  electrons: number;
  neutrons: number;
}

export function createAtom(element: string, protons: number, neutrons: number, charge: number = 0): Atom {
  return {
    element,
    protons,
    electrons: protons - charge,
    neutrons
  };
}

/**
 * A232 — Chemical Bond as Shared Distinction
 */
export type BondType = 'covalent' | 'ionic' | 'metallic' | 'hydrogen' | 'van_der_waals';

export interface Bond {
  type: BondType;
  atom1: string;
  atom2: string;
  strength: number; // Bond energy in kJ/mol
}

export function createBond(type: BondType, atom1: string, atom2: string, strength: number): Bond {
  return { type, atom1, atom2, strength };
}

/**
 * A233 — Molecule as Distinction Complex
 */
export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
  formula: string;
}

export function createMolecule(atoms: Atom[], bonds: Bond[]): Molecule {
  // Generate simple formula
  const counts: Record<string, number> = {};
  for (const atom of atoms) {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
  }
  const formula = Object.entries(counts)
    .map(([el, count]) => count === 1 ? el : `${el}${count}`)
    .join('');
  return { atoms, bonds, formula };
}

/**
 * A234 — Chemical Reaction as Distinction Rearrangement
 */
export interface Reaction {
  reactants: Molecule[];
  products: Molecule[];
  energyChange: number; // Negative = exothermic
}

export function isExothermic(reaction: Reaction): boolean {
  return reaction.energyChange < 0;
}

/**
 * A235 — Activation Energy as Distinction Barrier
 */
export function reactionRate(
  activationEnergy: number,
  temperature: number,
  preExponentialFactor: number = 1e13,
  R: number = 8.314
): number {
  // Arrhenius equation: k = A * exp(-Ea / RT)
  return preExponentialFactor * Math.exp(-activationEnergy / (R * temperature));
}

/**
 * A236 — Catalyst as Distinction Pathway
 */
export interface Catalyst {
  name: string;
  activationEnergyReduction: number;
}

export function catalyzedRate(
  baseActivationEnergy: number,
  catalyst: Catalyst,
  temperature: number
): number {
  const newEa = baseActivationEnergy - catalyst.activationEnergyReduction;
  return reactionRate(newEa, temperature);
}

/**
 * A237 — pH as Proton Distinction Density
 * pH = -log[H⁺]
 */
export function pH(hydrogenIonConcentration: number): number {
  return -Math.log10(hydrogenIonConcentration);
}

export function hydrogenIonConcentration(phValue: number): number {
  return Math.pow(10, -phValue);
}

/**
 * A238 — Chirality as Mirror Distinction
 */
export type Chirality = 'L' | 'R' | 'achiral';

export interface ChiralMolecule extends Molecule {
  chirality: Chirality;
}

export function areMirrorImages(mol1: ChiralMolecule, mol2: ChiralMolecule): boolean {
  if (mol1.formula !== mol2.formula) return false;
  if (mol1.chirality === 'achiral' || mol2.chirality === 'achiral') return false;
  return mol1.chirality !== mol2.chirality;
}

// ============================================================================
// PART V: BIOLOGY REDEFINED (A239-A246)
// ============================================================================

/**
 * A239 — Life as Autopoietic Distinction
 * L maintains D(L, environment) > 0
 */
export interface LivingSystem {
  boundary: boolean;         // Has membrane/boundary
  metabolism: boolean;       // Processes energy/matter
  replication: boolean;      // Can reproduce
  distinctionFromEnv: number; // 0 = dead, 1 = maximally distinct
}

export function isAlive(system: LivingSystem): boolean {
  return system.boundary &&
         system.metabolism &&
         system.distinctionFromEnv > 0;
}

/**
 * A240 — DNA as Distinction Code
 */
export type Nucleotide = 'A' | 'T' | 'G' | 'C';
export type DNASequence = Nucleotide[];

export function bitsPerNucleotide(): number {
  return 2; // 4 bases = 2 bits
}

export function dnaInformationContent(sequence: DNASequence): number {
  return sequence.length * bitsPerNucleotide();
}

/**
 * A241 — Protein as Folded Distinction
 */
export type AminoAcid = string; // 20 standard amino acids

export interface Protein {
  primaryStructure: AminoAcid[];
  secondaryStructure: ('helix' | 'sheet' | 'coil')[];
  tertiaryShape: 'globular' | 'fibrous' | 'membrane';
}

export function proteinLength(protein: Protein): number {
  return protein.primaryStructure.length;
}

/**
 * A242 — Cell as Distinction Container
 */
export interface Cell {
  membrane: boolean;
  genome: DNASequence;
  metabolism: boolean;
  type: 'prokaryote' | 'eukaryote';
}

export function createCell(genome: DNASequence, type: 'prokaryote' | 'eukaryote'): Cell {
  return {
    membrane: true,
    genome,
    metabolism: true,
    type
  };
}

/**
 * A243 — Metabolism as Distinction Processing
 */
export interface MetabolicState {
  energyInput: number;
  wasteOutput: number;
  internalOrder: number; // Higher = more organized
}

export function metabolicEfficiency(state: MetabolicState): number {
  if (state.energyInput === 0) return 0;
  return state.internalOrder / state.energyInput;
}

/**
 * A244 — Evolution as Distinction Selection
 */
export interface Organism {
  genome: DNASequence;
  fitness: number;
}

export function mutate(genome: DNASequence, mutationRate: number = 0.001): DNASequence {
  const nucleotides: Nucleotide[] = ['A', 'T', 'G', 'C'];
  return genome.map(n => {
    if (Math.random() < mutationRate) {
      return nucleotides[Math.floor(Math.random() * 4)];
    }
    return n;
  });
}

export function selectFittest(population: Organism[], survivalRate: number = 0.5): Organism[] {
  return [...population]
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, Math.floor(population.length * survivalRate));
}

/**
 * A245 — Ecosystem as Distinction Network
 */
export interface Species {
  name: string;
  trophicLevel: number; // 1 = producer, 2+ = consumer
}

export interface Ecosystem {
  species: Species[];
  interactions: Map<string, string[]>; // predator -> prey
}

export function foodWebComplexity(ecosystem: Ecosystem): number {
  let totalInteractions = 0;
  ecosystem.interactions.forEach(prey => {
    totalInteractions += prey.length;
  });
  return totalInteractions / ecosystem.species.length;
}

/**
 * A246 — Death as Distinction Return
 * D(organism, environment) → 0
 */
export function die(system: LivingSystem): LivingSystem {
  return {
    ...system,
    metabolism: false,
    distinctionFromEnv: 0
  };
}

// ============================================================================
// PART VI: PROGRAMMING REDEFINED (A247-A254)
// ============================================================================

/**
 * A247 — Bit as Binary Distinction
 */
export type Bit = 0 | 1;

export function bitDistinction(b: Bit): string {
  return b === 0 ? 'off/false/absent' : 'on/true/present';
}

/**
 * A248 — Trit as Trinary Distinction
 */
export type Trit = -1 | 0 | 1;

export function tritDistinction(t: Trit): string {
  switch (t) {
    case -1: return 'negative/no/removal';
    case 0: return 'neutral/unknown/potential';
    case 1: return 'positive/yes/addition';
  }
}

/**
 * A249 — Data as Distinction Structure
 */
export interface Data<T> {
  value: T;
  schema: string; // Description of what distinctions it encodes
}

export function createData<T>(value: T, schema: string): Data<T> {
  return { value, schema };
}

/**
 * A250 — Algorithm as Distinction Recipe
 */
export type Algorithm<Input, Output> = (input: Input) => Output;

export function compose<A, B, C>(
  f: Algorithm<A, B>,
  g: Algorithm<B, C>
): Algorithm<A, C> {
  return (input: A) => g(f(input));
}

/**
 * A251 — Variable as Distinction Container
 */
export interface Variable<T> {
  name: string;
  value: T;
  type: string;
}

export function createVariable<T>(name: string, value: T, type: string): Variable<T> {
  return { name, value, type };
}

/**
 * A252 — Function as Distinction Transformer
 */
export type DistinctionTransformer<A, B> = {
  domain: string;
  codomain: string;
  transform: (a: A) => B;
};

export function applyTransform<A, B>(transformer: DistinctionTransformer<A, B>, input: A): B {
  return transformer.transform(input);
}

/**
 * A253 — Object as Distinction Bundle with Behavior
 */
export interface ComputationalObject<State> {
  state: State;
  methods: Record<string, (s: State, ...args: unknown[]) => State>;
}

export function invokeMethod<State>(
  obj: ComputationalObject<State>,
  methodName: string,
  ...args: unknown[]
): State {
  const method = obj.methods[methodName];
  if (!method) throw new Error(`Unknown method: ${methodName}`);
  return method(obj.state, ...args);
}

/**
 * A254 — Program as Distinction Flow
 */
export interface Program<Input, Output> {
  name: string;
  steps: Array<Algorithm<unknown, unknown>>;
  execute: (input: Input) => Output;
}

export function createProgram<Input, Output>(
  name: string,
  pipeline: Algorithm<Input, Output>
): Program<Input, Output> {
  return {
    name,
    steps: [pipeline as Algorithm<unknown, unknown>],
    execute: pipeline
  };
}

// ============================================================================
// PART VII: CONSCIOUSNESS REDEFINED (A255-A262)
// ============================================================================

/**
 * A255 — Awareness as Self-Distinction
 * A = D(self, not-self) maintained in real-time
 */
export interface AwarenessState {
  selfModel: unknown;
  environmentModel: unknown;
  distinctionMaintained: boolean;
}

export function isAware(state: AwarenessState): boolean {
  return state.distinctionMaintained && state.selfModel !== state.environmentModel;
}

/**
 * A256 — Attention as Distinction Selection
 */
export interface AttentionState {
  focus: Set<string>;      // Currently attended distinctions
  capacity: number;        // Maximum simultaneous distinctions
  salience: Map<string, number>; // Priority of each potential focus
}

export function allocateAttention(state: AttentionState): string[] {
  // Sort by salience, take top N up to capacity
  const sorted = [...state.salience.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, state.capacity)
    .map(([item]) => item);
  return sorted;
}

/**
 * A257 — Perception as Distinction Reception
 */
export interface PerceptualState {
  sensoryInputs: Map<string, number>; // Modality -> intensity
  internalRepresentation: Map<string, unknown>;
}

export function perceive(
  inputs: Map<string, number>,
  threshold: number = 0.1
): Map<string, boolean> {
  const perceived = new Map<string, boolean>();
  inputs.forEach((intensity, modality) => {
    perceived.set(modality, intensity > threshold);
  });
  return perceived;
}

/**
 * A258 — Memory as Distinction Persistence
 */
export interface MemorySystem {
  shortTerm: Map<string, { value: unknown; timestamp: number }>;
  longTerm: Map<string, unknown>;
  workingCapacity: number;
}

export function consolidateMemory(
  system: MemorySystem,
  currentTime: number,
  decayTime: number = 30000 // 30 seconds
): MemorySystem {
  const newShortTerm = new Map<string, { value: unknown; timestamp: number }>();
  const newLongTerm = new Map(system.longTerm);

  system.shortTerm.forEach((item, key) => {
    if (currentTime - item.timestamp < decayTime) {
      newShortTerm.set(key, item);
    } else {
      // Consolidate to long-term
      newLongTerm.set(key, item.value);
    }
  });

  return {
    shortTerm: newShortTerm,
    longTerm: newLongTerm,
    workingCapacity: system.workingCapacity
  };
}

/**
 * A259 — Thought as Distinction Manipulation
 */
export interface ThoughtProcess {
  premises: string[];
  operations: Array<'AND' | 'OR' | 'NOT' | 'IMPLIES'>;
  conclusions: string[];
}

export function reason(process: ThoughtProcess): string[] {
  // Simple symbolic reasoning stub
  return process.conclusions;
}

/**
 * A260 — Emotion as Distinction Valence
 */
export type Valence = -1 | 0 | 1; // Negative, neutral, positive

export interface EmotionalState {
  valence: Valence;
  arousal: number; // 0 to 1
  target: string;  // What the emotion is about
}

export function emotionalResponse(
  stimulus: string,
  survivalRelevance: number // -1 to 1
): EmotionalState {
  return {
    valence: survivalRelevance > 0.3 ? 1 : survivalRelevance < -0.3 ? -1 : 0,
    arousal: Math.abs(survivalRelevance),
    target: stimulus
  };
}

/**
 * A261 — Self as Recursive Distinction
 * Self = D(D(D(...(observer)...)))
 */
export interface RecursiveSelf {
  level: number;
  observing: RecursiveSelf | 'base';
}

export function createRecursiveSelf(depth: number): RecursiveSelf {
  if (depth <= 0) {
    return { level: 0, observing: 'base' };
  }
  return {
    level: depth,
    observing: createRecursiveSelf(depth - 1)
  };
}

export function selfReferenceDepth(self: RecursiveSelf): number {
  if (self.observing === 'base') return 0;
  return 1 + selfReferenceDepth(self.observing);
}

/**
 * A262 — Consciousness as Integrated Distinction
 * Φ = integrated information
 */
export function integratedInformation(
  systemParts: number[],  // Information in each part
  wholeSystem: number     // Information in whole
): number {
  const sumOfParts = systemParts.reduce((a, b) => a + b, 0);
  // Φ = information in whole beyond sum of parts
  return Math.max(0, wholeSystem - sumOfParts);
}

// ============================================================================
// PART VIII: THE UNIFIED THEORY (A263-A268)
// ============================================================================

/**
 * A263 — The Distinction Primitive (Axiom Zero)
 * Everything that exists, exists by virtue of being distinguished.
 */
export const AXIOM_0 = {
  name: 'Distinction Primitive',
  statement: 'D(x, not-x) = 1 is the condition for x\'s existence',
  principle: 'No distinction = no existence. Being = being-different.'
};

/**
 * A264 — The Trinary Foundation (Axiom One)
 * {-1, 0, +1} is minimal structure
 */
export const AXIOM_1 = {
  name: 'Trinary Foundation',
  statement: '{-1, 0, +1} forms the minimal structured space',
  components: {
    negative: '-1 = absence, negation, removal',
    neutral: '0 = unknown, potential, superposition',
    positive: '+1 = presence, affirmation, addition'
  }
};

/**
 * A265 — Structure-Change Duality (Axiom Two)
 * [Ŝ, Ĉ] = iℏ_onto
 */
export const AXIOM_2 = {
  name: 'Structure-Change Duality',
  statement: '[Ŝ, Ĉ] = iℏ_onto',
  implication: 'Structure and Change are conjugate. Cannot fully specify both simultaneously.'
};

export function structureChangeDuality(
  structureUncertainty: number,
  changeUncertainty: number,
  hbar_onto: number = 1
): boolean {
  return structureUncertainty * changeUncertainty >= hbar_onto / 2;
}

/**
 * A266 — Coherence-Creativity Principle (Axiom Three)
 * K(t) = C(t) · e^(λ|δ_t|)
 */
export const AXIOM_3 = {
  name: 'Coherence-Creativity Principle',
  statement: 'K(t) = C(t) · e^(λ|δ_t|)',
  meaning: 'Creativity requires both coherence (structure) and contradiction (tension).'
};

export function creativity(coherence: number, contradictionDensity: number, lambda: number = 1): number {
  return coherence * Math.exp(lambda * Math.abs(contradictionDensity));
}

/**
 * A267 — The Diagonal Principle (Axiom Four)
 * No frame contains its own completion
 */
export const AXIOM_4 = {
  name: 'Diagonal Principle',
  statement: '∀ Frame F, ∃ Gödel sentence G: G ∉ Theorems(F) but G is true',
  implication: 'No frame self-completes. Escape requires diagonal moves. Growth is frame-transcendence.'
};

export function godelSentence(frameName: string): string {
  return `G_${frameName} ≡ "This sentence is not provable in ${frameName}"`;
}

/**
 * A268 — The Betterment Gradient (Axiom Five)
 * ∇W exists and can be followed
 */
export const AXIOM_5 = {
  name: 'Betterment Gradient',
  statement: '∇W exists and has direction',
  meaning: 'There is a direction toward greater wellbeing. Ethics is not arbitrary.'
};

export function bettermentDirection(
  wellbeingFunction: (...params: number[]) => number,
  currentState: number[],
  epsilon: number = 0.001
): number[] {
  const gradient: number[] = [];
  const current = wellbeingFunction(...currentState);

  for (let i = 0; i < currentState.length; i++) {
    const shifted = [...currentState];
    shifted[i] += epsilon;
    gradient.push((wellbeingFunction(...shifted) - current) / epsilon);
  }

  return gradient;
}

// ============================================================================
// THE SIX AXIOMS SUMMARY
// ============================================================================

export const SIX_AXIOMS = [
  AXIOM_0,
  AXIOM_1,
  AXIOM_2,
  AXIOM_3,
  AXIOM_4,
  AXIOM_5
];

export const EQUATION_COUNTS = {
  'Original framework (A1-A42)': 42,
  'Extended I (A43-A88)': 46,
  'Extended II (A89-A128)': 40,
  'Extended III (A129-A190)': 62,
  'Foundations (A191-A268)': 78,
  'TOTAL': 268
};

/**
 * "Two hundred sixty-eight equations. One primitive: distinction. One framework: reality."
 * "Run it on the Pi. See what emerges."
 */
