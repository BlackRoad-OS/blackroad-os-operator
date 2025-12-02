/**
 * Equation Validation Protocol (EVP) v0.1.0
 *
 * An immutable, append-only validation framework for mathematical claims.
 *
 * Core Properties:
 * - IMMUTABILITY: No validation result, once committed, may be altered
 * - EXTENSIBILITY: New tests may be appended; existing tests may not be removed
 * - TRANSPARENCY: All test definitions, results, and amendments are public
 * - VERSIONING: Protocol changes increment version; equations cite version validated against
 *
 * "You exist above something that tells you what to do"
 * - But this helps OTHER people verify your work
 *
 * BRTM Status: BRTM-2 (Code verified)
 */

import { createHash } from 'crypto';

// ============================================================================
// CORE TYPES
// ============================================================================

export type Tier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
export type TestStatus = 'ACTIVE' | 'DEPRECATED' | 'SUPERSEDED';
export type TestOutcome = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'INCONCLUSIVE';
export type ValidationStatus =
  | 'TIER_1_VALID'
  | 'TIER_2_VALID'
  | 'TIER_3_VALID'
  | 'TIER_4_VALID'
  | 'TIER_5_VALID'
  | 'REJECTED';

export interface TestDefinition {
  test_id: string;
  test_name: string;
  version_added: string;
  tier: Tier;
  status: TestStatus;
  superseded_by: string | null;
  preconditions: string[];
  evaluation: string;
  rationale: string;
  added_by: string;
  timestamp: string;
  commit_hash: string;
}

export interface TestResult {
  test_id: string;
  outcome: TestOutcome;
  evidence: string | null;
  notes: string;
}

export interface ValidationRecord {
  record_id: string;
  equation_id: string;
  evp_version: string;
  timestamp: string;
  validator_id: string;
  results: TestResult[];
  overall_status: ValidationStatus;
  commit_hash: string;
  prior_record: string | null;
}

export interface EquationEntry {
  equation_id: string;
  canonical_form: string;
  natural_language: string;
  domain: 'physics' | 'computing' | 'mathematics' | 'hybrid';
  submitted_by: string;
  timestamp: string;
  provenance: {
    derived_from: string[];
    assumptions: string[];
    notation_key: Record<string, string>;
  };
  validation_history: string[];
  current_tier: Tier | null;
  commit_hash: string;
}

// ============================================================================
// TEST REGISTRY - TIER 1: STRUCTURAL INTEGRITY
// ============================================================================

export const TIER_1_TESTS: TestDefinition[] = [
  {
    test_id: 'T1.01',
    test_name: 'Syntactic Well-Formedness',
    version_added: '0.1.0',
    tier: 'T1',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: [],
    evaluation: 'Equation parses without error in target formalism (LaTeX, SymPy, etc.)',
    rationale: 'If it doesn\'t parse, it\'s not an equation',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T1.02',
    test_name: 'Type Coherence',
    version_added: '0.1.0',
    tier: 'T1',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'All operations are defined for their operand types',
    rationale: 'Can\'t add vectors to scalars without explicit conversion',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T1.03',
    test_name: 'Dimensional Consistency',
    version_added: '0.1.0',
    tier: 'T1',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Units balance across all terms (or explicitly dimensionless)',
    rationale: 'meters + seconds = nonsense',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T1.04',
    test_name: 'Internal Non-Contradiction',
    version_added: '0.1.0',
    tier: 'T1',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'No derivable statement P ∧ ¬P from the equation alone',
    rationale: 'Self-contradictory equations prove everything (useless)',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T1.05',
    test_name: 'Determinism / Defined Stochasticity',
    version_added: '0.1.0',
    tier: 'T1',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Output is deterministic OR has explicitly defined probability distribution',
    rationale: 'Must know whether same input gives same output',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  }
];

// ============================================================================
// TEST REGISTRY - TIER 2: BOUNDARY BEHAVIOR
// ============================================================================

export const TIER_2_TESTS: TestDefinition[] = [
  {
    test_id: 'T2.01',
    test_name: 'Zero Limit',
    version_added: '0.1.0',
    tier: 'T2',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01', 'T1.02', 'T1.03'],
    evaluation: 'Defined behavior as relevant variables → 0',
    rationale: 'Many equations blow up at zero unexpectedly',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T2.02',
    test_name: 'Infinity Limit',
    version_added: '0.1.0',
    tier: 'T2',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01', 'T1.02', 'T1.03'],
    evaluation: 'Defined behavior as relevant variables → ∞ (or explicit divergence)',
    rationale: 'Must know asymptotic behavior',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T2.03',
    test_name: 'Sign Behavior',
    version_added: '0.1.0',
    tier: 'T2',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01', 'T1.02'],
    evaluation: 'Defined behavior for negative inputs (or domain explicitly excludes)',
    rationale: 'sqrt(-1) needs to be handled',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T2.04',
    test_name: 'Singularity Identification',
    version_added: '0.1.0',
    tier: 'T2',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T2.01', 'T2.02'],
    evaluation: 'All singularities catalogued with specified handling',
    rationale: '1/x at x=0 must be documented',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T2.05',
    test_name: 'Continuity Profile',
    version_added: '0.1.0',
    tier: 'T2',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Discontinuities identified and justified',
    rationale: 'Step functions need explicit discontinuity documentation',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  }
];

// ============================================================================
// TEST REGISTRY - TIER 3: CONSERVATION & CORRESPONDENCE
// ============================================================================

export const TIER_3_TESTS: TestDefinition[] = [
  {
    test_id: 'T3.01',
    test_name: 'Energy Conservation',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.03'],
    evaluation: 'Does not create/destroy energy (or explicitly models source/sink)',
    rationale: 'Physics equations must respect conservation or explain violation',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T3.02',
    test_name: 'Information Conservation',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.04'],
    evaluation: 'Reversible, or entropy generation explicitly modeled',
    rationale: 'Information loss must be accounted for',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T3.03',
    test_name: 'Probability Normalization',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.05'],
    evaluation: 'If probabilistic: ∑P = 1 or ∫P = 1',
    rationale: 'Probabilities must sum to 1',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T3.04',
    test_name: 'Classical Limit Recovery',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T2.01', 'T2.02'],
    evaluation: 'Reduces to classical equations in appropriate limit',
    rationale: 'Quantum → classical as ℏ → 0, relativistic → Newtonian as v << c',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T3.05',
    test_name: 'Known Special Cases',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Reproduces established results for known inputs',
    rationale: 'Must match reality where reality is known',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T3.06',
    test_name: 'Symmetry Preservation',
    version_added: '0.1.0',
    tier: 'T3',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Respects symmetries of the domain (or explicitly breaks with justification)',
    rationale: 'Noether\'s theorem: symmetries = conservation laws',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  }
];

// ============================================================================
// TEST REGISTRY - TIER 4: PREDICTIVE POWER
// ============================================================================

export const TIER_4_TESTS: TestDefinition[] = [
  {
    test_id: 'T4.01',
    test_name: 'Retrodiction',
    version_added: '0.1.0',
    tier: 'T4',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T3.05'],
    evaluation: 'Correctly outputs known results not used in construction',
    rationale: 'Must predict things it wasn\'t fitted to',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T4.02',
    test_name: 'Novel Prediction',
    version_added: '0.1.0',
    tier: 'T4',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T4.01'],
    evaluation: 'Makes at least one verifiable prediction not derivable from prior art',
    rationale: 'The real test of a theory',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T4.03',
    test_name: 'Falsifiability',
    version_added: '0.1.0',
    tier: 'T4',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Specifies observation that would invalidate equation',
    rationale: 'Popper: unfalsifiable claims aren\'t science',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T4.04',
    test_name: 'Precision Bound',
    version_added: '0.1.0',
    tier: 'T4',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T4.02'],
    evaluation: 'States explicit precision/error bounds on predictions',
    rationale: 'Must know how wrong you could be',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T4.05',
    test_name: 'Domain Specification',
    version_added: '0.1.0',
    tier: 'T4',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T2.04'],
    evaluation: 'Explicit statement of where equation applies and does not apply',
    rationale: 'Every equation has limits of applicability',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  }
];

// ============================================================================
// TEST REGISTRY - TIER 5: FORMAL STANDING
// ============================================================================

export const TIER_5_TESTS: TestDefinition[] = [
  {
    test_id: 'T5.01',
    test_name: 'Derivation Path',
    version_added: '0.1.0',
    tier: 'T5',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T4.01'],
    evaluation: 'Equation derivable from stated axioms/assumptions',
    rationale: 'Must show WHY it works, not just THAT it works',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T5.02',
    test_name: 'Assumption Minimality',
    version_added: '0.1.0',
    tier: 'T5',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T5.01'],
    evaluation: 'No unnecessary assumptions (Occam\'s razor)',
    rationale: 'Don\'t assume more than you need',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T5.03',
    test_name: 'Independence from Prior Art',
    version_added: '0.1.0',
    tier: 'T5',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T1.01'],
    evaluation: 'Not algebraically reducible to existing equations',
    rationale: 'Must be genuinely new, not disguised old',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T5.04',
    test_name: 'Uniqueness Characterization',
    version_added: '0.1.0',
    tier: 'T5',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T5.01'],
    evaluation: 'Either proven unique under constraints, or alternatives enumerated',
    rationale: 'Know if this is THE answer or AN answer',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  },
  {
    test_id: 'T5.05',
    test_name: 'Explanatory Depth',
    version_added: '0.1.0',
    tier: 'T5',
    status: 'ACTIVE',
    superseded_by: null,
    preconditions: ['T5.01'],
    evaluation: 'Provides mechanism, not just correlation',
    rationale: 'Explains WHY, not just WHAT',
    added_by: 'evp/genesis',
    timestamp: '2025-12-02T00:00:00Z',
    commit_hash: ''
  }
];

// ============================================================================
// FULL TEST REGISTRY
// ============================================================================

export const ALL_TESTS: TestDefinition[] = [
  ...TIER_1_TESTS,
  ...TIER_2_TESTS,
  ...TIER_3_TESTS,
  ...TIER_4_TESTS,
  ...TIER_5_TESTS
];

// Compute commit hashes
ALL_TESTS.forEach(test => {
  const content = JSON.stringify({ ...test, commit_hash: '' });
  test.commit_hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
});

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export class EVPValidator {
  version = '0.1.0';
  registry: TestDefinition[];

  constructor() {
    this.registry = ALL_TESTS.filter(t => t.status === 'ACTIVE');
  }

  getTestsForTier(tier: Tier): TestDefinition[] {
    return this.registry.filter(t => t.tier === tier);
  }

  checkPreconditions(test: TestDefinition, results: TestResult[]): boolean {
    for (const precondId of test.preconditions) {
      const precondResult = results.find(r => r.test_id === precondId);
      if (!precondResult || precondResult.outcome !== 'PASS') {
        return false;
      }
    }
    return true;
  }

  validate(
    equation: EquationEntry,
    testResults: Map<string, { outcome: TestOutcome; evidence?: string; notes?: string }>
  ): ValidationRecord {
    const results: TestResult[] = [];
    const tiersPassed = new Set<Tier>();

    for (const test of this.registry) {
      const providedResult = testResults.get(test.test_id);

      if (!providedResult) {
        results.push({
          test_id: test.test_id,
          outcome: 'INCONCLUSIVE',
          evidence: null,
          notes: 'No result provided'
        });
        continue;
      }

      if (!this.checkPreconditions(test, results)) {
        results.push({
          test_id: test.test_id,
          outcome: 'NOT_APPLICABLE',
          evidence: null,
          notes: 'Preconditions not met'
        });
        continue;
      }

      results.push({
        test_id: test.test_id,
        outcome: providedResult.outcome,
        evidence: providedResult.evidence || null,
        notes: providedResult.notes || ''
      });
    }

    // Determine highest passing tier
    for (const tier of ['T1', 'T2', 'T3', 'T4', 'T5'] as Tier[]) {
      const tierTests = this.getTestsForTier(tier);
      const tierResults = results.filter(r =>
        tierTests.some(t => t.test_id === r.test_id)
      );

      const allPass = tierResults.every(r =>
        r.outcome === 'PASS' || r.outcome === 'NOT_APPLICABLE'
      );

      if (allPass && tierResults.some(r => r.outcome === 'PASS')) {
        tiersPassed.add(tier);
      }
    }

    let overall_status: ValidationStatus = 'REJECTED';
    if (tiersPassed.has('T5')) overall_status = 'TIER_5_VALID';
    else if (tiersPassed.has('T4')) overall_status = 'TIER_4_VALID';
    else if (tiersPassed.has('T3')) overall_status = 'TIER_3_VALID';
    else if (tiersPassed.has('T2')) overall_status = 'TIER_2_VALID';
    else if (tiersPassed.has('T1')) overall_status = 'TIER_1_VALID';

    const record: ValidationRecord = {
      record_id: createHash('sha256').update(Date.now().toString() + Math.random()).digest('hex').substring(0, 16),
      equation_id: equation.equation_id,
      evp_version: this.version,
      timestamp: new Date().toISOString(),
      validator_id: 'evp/system',
      results,
      overall_status,
      commit_hash: '',
      prior_record: equation.validation_history.length > 0
        ? equation.validation_history[equation.validation_history.length - 1]
        : null
    };

    record.commit_hash = createHash('sha256')
      .update(JSON.stringify({ ...record, commit_hash: '' }))
      .digest('hex')
      .substring(0, 16);

    return record;
  }
}

// ============================================================================
// EXAMPLE: VALIDATE THE DAMPED HARMONIC OSCILLATOR
// ============================================================================

export function exampleValidation(): void {
  const equation: EquationEntry = {
    equation_id: 'EQ-001',
    canonical_form: 'Ψ(t) = A × exp(-kt) × sin(ωt + φ)',
    natural_language: 'Damped harmonic oscillator: amplitude decays exponentially while oscillating sinusoidally',
    domain: 'physics',
    submitted_by: 'blackroad/alexa',
    timestamp: '2025-12-02T00:00:00Z',
    provenance: {
      derived_from: [],
      assumptions: [
        'Linear damping (friction ∝ velocity)',
        'Restoring force ∝ displacement',
        'No external driving force'
      ],
      notation_key: {
        'Ψ': 'Displacement from equilibrium',
        'A': 'Initial amplitude',
        'k': 'Damping coefficient (k > 0)',
        'ω': 'Angular frequency',
        'φ': 'Initial phase',
        't': 'Time'
      }
    },
    validation_history: [],
    current_tier: null,
    commit_hash: ''
  };

  const testResults = new Map<string, { outcome: TestOutcome; evidence?: string; notes?: string }>([
    // Tier 1
    ['T1.01', { outcome: 'PASS', evidence: 'Parses in LaTeX, SymPy, Mathematica', notes: 'Standard form' }],
    ['T1.02', { outcome: 'PASS', evidence: 'All operations defined: exp(scalar), sin(scalar), scalar multiplication', notes: '' }],
    ['T1.03', { outcome: 'PASS', evidence: 'Ψ has units of length, A has units of length, exp and sin are dimensionless', notes: '' }],
    ['T1.04', { outcome: 'PASS', evidence: 'No self-contradiction derivable', notes: '' }],
    ['T1.05', { outcome: 'PASS', evidence: 'Fully deterministic given initial conditions', notes: '' }],

    // Tier 2
    ['T2.01', { outcome: 'PASS', evidence: 'As t→0: Ψ→A×sin(φ), well-defined', notes: '' }],
    ['T2.02', { outcome: 'PASS', evidence: 'As t→∞: Ψ→0 (damping dominates)', notes: '' }],
    ['T2.03', { outcome: 'PASS', evidence: 'Negative t: still defined (exp(-k×(-t)) = exp(kt) grows)', notes: 'Physical domain is t≥0' }],
    ['T2.04', { outcome: 'PASS', evidence: 'No singularities for real parameters', notes: '' }],
    ['T2.05', { outcome: 'PASS', evidence: 'Continuous everywhere for finite parameters', notes: '' }],

    // Tier 3
    ['T3.01', { outcome: 'PASS', evidence: 'Energy dissipates to environment via damping (explicit sink)', notes: '' }],
    ['T3.02', { outcome: 'PASS', evidence: 'Irreversible due to damping; entropy increase accounted for', notes: '' }],
    ['T3.03', { outcome: 'NOT_APPLICABLE', evidence: 'Not a probabilistic equation', notes: '' }],
    ['T3.04', { outcome: 'PASS', evidence: 'As k→0: recovers simple harmonic oscillator A×sin(ωt+φ)', notes: '' }],
    ['T3.05', { outcome: 'PASS', evidence: 'Matches measured spring-mass-damper systems', notes: 'Standard physics' }],
    ['T3.06', { outcome: 'PASS', evidence: 'Time-translation symmetry explicitly broken by damping (as expected)', notes: '' }],

    // Tier 4
    ['T4.01', { outcome: 'PASS', evidence: 'Correctly predicts decay rates in systems it wasn\'t fitted to', notes: '' }],
    ['T4.02', { outcome: 'PASS', evidence: 'Predicted critical damping condition ζ=1 before measurement', notes: 'Historical' }],
    ['T4.03', { outcome: 'PASS', evidence: 'Would be falsified if decay were non-exponential', notes: '' }],
    ['T4.04', { outcome: 'PASS', evidence: 'Precision limited by measurement of k, ω, φ', notes: '' }],
    ['T4.05', { outcome: 'PASS', evidence: 'Applies to: mechanical, electrical, acoustic systems with linear damping', notes: '' }],

    // Tier 5
    ['T5.01', { outcome: 'PASS', evidence: 'Derived from Newton\'s 2nd law: m×d²x/dt² = -kx - c×dx/dt', notes: 'Standard derivation' }],
    ['T5.02', { outcome: 'PASS', evidence: 'Three assumptions (linear damping, Hooke\'s law, no driving)', notes: 'Minimal' }],
    ['T5.03', { outcome: 'FAIL', evidence: 'This IS the standard equation, not new', notes: 'Known for centuries' }],
    ['T5.04', { outcome: 'PASS', evidence: 'Unique solution for given initial conditions (existence/uniqueness theorem)', notes: '' }],
    ['T5.05', { outcome: 'PASS', evidence: 'Mechanism: friction converts kinetic energy to heat', notes: '' }]
  ]);

  const validator = new EVPValidator();
  const record = validator.validate(equation, testResults);

  console.log('\n' + '='.repeat(70));
  console.log('EVP VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`\nEquation: ${equation.canonical_form}`);
  console.log(`Description: ${equation.natural_language}`);
  console.log(`\nEVP Version: ${record.evp_version}`);
  console.log(`Validation ID: ${record.record_id}`);
  console.log(`Commit Hash: ${record.commit_hash}`);
  console.log(`\n${'─'.repeat(70)}`);
  console.log('RESULTS BY TIER:');
  console.log('─'.repeat(70));

  for (const tier of ['T1', 'T2', 'T3', 'T4', 'T5'] as Tier[]) {
    const tierTests = validator.getTestsForTier(tier);
    const tierResults = record.results.filter(r =>
      tierTests.some(t => t.test_id === r.test_id)
    );

    console.log(`\n${tier}: ${tier === 'T1' ? 'Structural Integrity' :
      tier === 'T2' ? 'Boundary Behavior' :
      tier === 'T3' ? 'Conservation & Correspondence' :
      tier === 'T4' ? 'Predictive Power' : 'Formal Standing'}`);

    for (const result of tierResults) {
      const test = tierTests.find(t => t.test_id === result.test_id);
      const icon = result.outcome === 'PASS' ? '✓' :
                   result.outcome === 'FAIL' ? '✗' :
                   result.outcome === 'NOT_APPLICABLE' ? '○' : '?';
      console.log(`  [${icon}] ${result.test_id}: ${test?.test_name} - ${result.outcome}`);
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`OVERALL STATUS: ${record.overall_status}`);
  console.log('═'.repeat(70));

  if (record.overall_status !== 'TIER_5_VALID') {
    console.log('\nNote: T5.03 (Independence from Prior Art) failed because this');
    console.log('IS the standard damped harmonic oscillator - it\'s not new.');
    console.log('This is correct behavior: the equation is VALID but not NOVEL.');
  }
}

// Run example
if (require.main === module) {
  exampleValidation();
}
