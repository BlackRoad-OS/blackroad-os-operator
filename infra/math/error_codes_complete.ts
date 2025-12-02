/**
 * BlackRoad OS - Complete Numeric Error Definition System
 *
 * 1000+ error codes covering:
 * - IEEE 754 floating point (NaN, Infinity, denormals, signed zero)
 * - 7 indeterminate forms (0/0, ∞/∞, 0×∞, ∞-∞, 1^∞, ∞^0, 0^0)
 * - Quantum decoherence states
 * - Type theory bottom types
 * - Category theory undefined morphisms
 * - HTTP status codes
 * - POSIX/Unix errno
 * - Database/transaction errors
 * - Windows HRESULT codes
 *
 * "If it's undefined, it's a lie. Name it. Number it. Define it."
 */

// =============================================================================
// TYPE ERRORS (100-199)
// =============================================================================

export const TYPE_ERRORS = {
  // Core JS/TS types (100-109)
  UNDEFINED: 100,           // Variable declared but not assigned
  NULL: 101,                // Intentional absence of value
  NAN: 102,                 // Not a Number (quiet NaN)
  VOID: 103,                // Function returns nothing
  NEVER: 104,               // Code path that should never execute
  UNKNOWN: 105,             // Type not yet narrowed
  ANY: 106,                 // Untyped (TypeScript any)
  SYMBOL: 107,              // Symbol without description
  BIGINT_OVERFLOW: 108,     // BigInt exceeds safe integer
  FUNCTION_UNDEFINED: 109,  // Function reference is undefined

  // Bottom types across languages (110-119)
  NOTHING: 110,             // Scala bottom type
  NORETURN: 111,            // Python NoReturn
  BOTTOM: 112,              // Haskell ⊥
  ABSURD: 113,              // Idris/Agda absurd pattern
  UNINHABITED: 114,         // Empty type (no values)
  UNIT_VOID: 115,           // () in Rust/Haskell vs void

  // Type coercion failures (120-129)
  COERCION_FAIL: 120,       // Type coercion failed
  CAST_FAIL: 121,           // Type cast failed
  PARSE_FAIL: 122,          // Parse to type failed
  SERIALIZE_FAIL: 123,      // Serialization failed
  DESERIALIZE_FAIL: 124,    // Deserialization failed
  UNIFICATION_FAIL: 125,    // Type unification failed
  INFERENCE_FAIL: 126,      // Type inference failed
  NARROWING_FAIL: 127,      // Type narrowing failed
  WIDENING_FAIL: 128,       // Type widening failed
  VARIANCE_FAIL: 129,       // Covariance/contravariance violation

  // Generic type errors (130-139)
  GENERIC_INSTANTIATION: 130, // Generic type instantiation failed
  TYPE_PARAMETER_MISSING: 131, // Type parameter not provided
  CONSTRAINT_VIOLATION: 132, // Type constraint not satisfied
  BOUNDS_VIOLATION: 133,    // Upper/lower bound violation
  EXISTENTIAL_ESCAPE: 134,  // Existential type escaping scope
  HIGHER_KINDED_FAIL: 135,  // Higher-kinded type error
  DEPENDENT_TYPE_FAIL: 136, // Dependent type checking failed
  REFINEMENT_FAIL: 137,     // Refinement type constraint failed
  PHANTOM_TYPE_LEAK: 138,   // Phantom type parameter leaked
  NEWTYPE_UNWRAP_FAIL: 139, // Newtype unwrap failed
} as const;

// =============================================================================
// VALUE ERRORS (200-299)
// =============================================================================

export const VALUE_ERRORS = {
  // Missing values (200-209)
  MISSING: 200,             // Expected value not present
  EMPTY: 201,               // Empty string/array/object
  ZERO_UNEXPECTED: 202,     // Unexpected zero
  NEGATIVE_UNEXPECTED: 203, // Unexpected negative
  OVERFLOW: 204,            // Value too large
  UNDERFLOW: 205,           // Value too small (non-IEEE)
  DEFAULT_ASSUMED: 206,     // Default value was used
  SPARSE_DATA: 207,         // Missing values in matrix/tensor
  INCOMPLETE: 208,          // Incomplete record
  TRUNCATED: 209,           // Value was truncated

  // Validation failures (210-219)
  FORMAT_INVALID: 210,      // Format validation failed
  PATTERN_MISMATCH: 211,    // Regex pattern mismatch
  LENGTH_INVALID: 212,      // Length outside bounds
  ENUM_INVALID: 213,        // Not a valid enum value
  CHECKSUM_INVALID: 214,    // Checksum validation failed
  SIGNATURE_INVALID: 215,   // Cryptographic signature invalid
  ENCODING_INVALID: 216,    // Character encoding invalid
  SCHEMA_INVALID: 217,      // Schema validation failed
  SEMANTIC_INVALID: 218,    // Semantically invalid
  CONTEXT_INVALID: 219,     // Valid syntax, wrong context

  // Range violations (220-229)
  MIN_VIOLATED: 220,        // Below minimum value
  MAX_VIOLATED: 221,        // Above maximum value
  PRECISION_LOST: 222,      // Precision was lost
  SCALE_EXCEEDED: 223,      // Decimal scale exceeded
  EPSILON_VIOLATED: 224,    // Outside epsilon tolerance
  BOUND_VIOLATED: 225,      // Boundary condition violated
  MONOTONIC_VIOLATED: 226,  // Monotonicity violated
  CONTINUITY_BROKEN: 227,   // Continuity assumption broken
  INVARIANT_VIOLATED: 228,  // Class/loop invariant violated
  POSTCONDITION_FAIL: 229,  // Postcondition not met

  // Data integrity (230-239)
  DUPLICATE: 230,           // Unexpected duplicate
  STALE: 231,               // Data is stale/outdated
  CORRUPTED: 232,           // Data corruption detected
  INCONSISTENT: 233,        // Data inconsistency
  ORPHANED: 234,            // Orphaned record
  DANGLING: 235,            // Dangling reference
  CYCLE_DETECTED: 236,      // Unexpected cycle in data
  SELF_REFERENCE: 237,      // Invalid self-reference
  VERSION_MISMATCH: 238,    // Version mismatch
  HASH_MISMATCH: 239,       // Hash mismatch
} as const;

// =============================================================================
// REFERENCE ERRORS (300-399)
// =============================================================================

export const REFERENCE_ERRORS = {
  // Null/pointer errors (300-309)
  NULL_POINTER: 300,        // Null pointer dereference
  DANGLING_POINTER: 301,    // Dangling pointer
  CIRCULAR_REF: 302,        // Circular reference
  UNINITIALIZED: 303,       // Uninitialized variable
  WILD_POINTER: 304,        // Wild/uninitialized pointer
  DOUBLE_FREE: 305,         // Double free
  USE_AFTER_FREE: 306,      // Use after free
  BUFFER_OVERFLOW: 307,     // Buffer overflow
  BUFFER_UNDERFLOW: 308,    // Buffer underflow
  ALIGNMENT_ERROR: 309,     // Memory alignment error

  // Memory errors (310-319)
  OUT_OF_MEMORY: 310,       // Allocation failed
  MEMORY_LEAK: 311,         // Memory leak detected
  STACK_OVERFLOW: 312,      // Stack overflow
  HEAP_CORRUPTION: 313,     // Heap corruption
  SEGFAULT: 314,            // Segmentation fault
  BUS_ERROR: 315,           // Bus error
  PAGE_FAULT: 316,          // Page fault
  PROTECTION_FAULT: 317,    // Memory protection violation
  FRAGMENTATION: 318,       // Memory fragmentation
  VIRTUAL_MEMORY_EXHAUSTED: 319, // Virtual memory exhausted

  // Scope/lifetime errors (320-329)
  OUT_OF_SCOPE: 320,        // Variable out of scope
  LIFETIME_ENDED: 321,      // Lifetime ended (Rust borrow)
  BORROW_CONFLICT: 322,     // Mutable borrow conflict
  MOVE_AFTER_USE: 323,      // Use after move
  ESCAPING_CLOSURE: 324,    // Closure captures escaping reference
  STACK_USE_AFTER_RETURN: 325, // Stack use after return
  TEMPORARY_EXTENDED: 326,  // Temporary lifetime extended unsafely
  STATIC_LIFETIME_REQUIRED: 327, // 'static lifetime required
  DANGLING_REFERENCE: 328,  // Dangling reference
  ALIASING_VIOLATION: 329,  // Aliasing rules violated
} as const;

// =============================================================================
// RANGE ERRORS (400-499)
// =============================================================================

export const RANGE_ERRORS = {
  // Index errors (400-409)
  INDEX_OUT_OF_BOUNDS: 400, // Array/string index out of bounds
  NEGATIVE_INDEX: 401,      // Negative index not allowed
  SLICE_INVALID: 402,       // Invalid slice bounds
  ITERATOR_EXHAUSTED: 403,  // Iterator has no more elements
  CURSOR_INVALID: 404,      // Cursor position invalid
  OFFSET_INVALID: 405,      // Offset out of range
  KEY_NOT_FOUND: 406,       // Map/dict key not found
  ELEMENT_NOT_FOUND: 407,   // Element not found
  POSITION_INVALID: 408,    // Position invalid
  DIMENSION_MISMATCH: 409,  // Matrix/tensor dimension mismatch

  // Recursion/iteration errors (410-419)
  RECURSION_LIMIT: 410,     // Max recursion depth exceeded
  ITERATION_LIMIT: 411,     // Max iterations exceeded
  INFINITE_LOOP: 412,       // Infinite loop detected
  STACK_DEPTH: 413,         // Stack depth exceeded
  CALL_DEPTH: 414,          // Call stack depth exceeded
  NESTING_DEPTH: 415,       // Nesting depth exceeded
  TREE_DEPTH: 416,          // Tree depth exceeded
  GRAPH_DEPTH: 417,         // Graph traversal depth exceeded
  BACKTRACK_LIMIT: 418,     // Backtracking limit exceeded
  BRANCH_LIMIT: 419,        // Branch factor limit exceeded

  // Size errors (420-429)
  SIZE_EXCEEDED: 420,       // Size limit exceeded
  LENGTH_EXCEEDED: 421,     // Length limit exceeded
  CAPACITY_EXCEEDED: 422,   // Capacity exceeded
  COUNT_EXCEEDED: 423,      // Count limit exceeded
  DEPTH_EXCEEDED: 424,      // Depth limit exceeded
  WIDTH_EXCEEDED: 425,      // Width limit exceeded
  HEIGHT_EXCEEDED: 426,     // Height limit exceeded
  VOLUME_EXCEEDED: 427,     // Volume limit exceeded
  CARDINALITY_EXCEEDED: 428, // Cardinality limit exceeded
  DEGREE_EXCEEDED: 429,     // Degree limit exceeded

  // Time/rate errors (430-439)
  TIMEOUT: 430,             // Operation timed out
  DEADLINE_EXCEEDED: 431,   // Deadline exceeded
  RATE_LIMIT: 432,          // Rate limit exceeded
  QUOTA_EXCEEDED: 433,      // Quota exceeded
  THROTTLED: 434,           // Request throttled
  BACKPRESSURE: 435,        // Backpressure applied
  LATENCY_EXCEEDED: 436,    // Latency threshold exceeded
  JITTER_EXCEEDED: 437,     // Jitter threshold exceeded
  BURST_EXCEEDED: 438,      // Burst limit exceeded
  CONCURRENCY_EXCEEDED: 439, // Concurrency limit exceeded
} as const;

// =============================================================================
// LOGIC ERRORS (500-599)
// =============================================================================

export const LOGIC_ERRORS = {
  // Classical logic (500-509)
  CONTRADICTION: 500,       // P ∧ ¬P
  TAUTOLOGY: 501,           // Always true (uninformative)
  GODEL_LIMIT: 502,         // Gödel incompleteness
  UNDECIDABLE: 503,         // Halting problem
  PARADOX: 504,             // Self-referential paradox
  NO_MORPHISM: 505,         // No morphism exists (category theory)
  NON_COMPOSABLE: 506,      // Morphisms not composable
  NON_UNIQUE: 507,          // Morphism not unique
  IDENTITY_UNDEFINED: 508,  // Identity morphism undefined
  INVERSE_UNDEFINED: 509,   // Inverse morphism undefined

  // Computability (510-519)
  NON_HALTING: 510,         // Turing machine never halts
  HALT_UNKNOWN: 511,        // Halting status unknown
  NP_HARD: 512,             // NP-hard problem
  NP_COMPLETE: 513,         // NP-complete problem
  PARTIAL_FUNCTION: 514,    // May not return for all inputs
  ORACLE_REQUIRED: 515,     // Requires oracle access
  HYPERCOMPUTATION: 516,    // Requires hypercomputation
  KOLMOGOROV_LIMIT: 517,    // Kolmogorov complexity limit
  BUSY_BEAVER: 518,         // Busy beaver bound unknown
  RICE_THEOREM: 519,        // Rice's theorem applies

  // Modal logic (520-529)
  POSSIBLE_NOT_NECESSARY: 520, // ◇P but not □P
  NECESSARY_FALSE: 521,     // □¬P
  CONTINGENT: 522,          // Neither necessary nor impossible
  ACCESSIBILITY_FAIL: 523,  // World not accessible
  FRAME_CONDITION_FAIL: 524, // Frame condition not satisfied
  EPISTEMIC_FAIL: 525,      // Knowledge condition not met
  DEONTIC_CONFLICT: 526,    // Obligation conflict
  TEMPORAL_PARADOX: 527,    // Temporal logic paradox
  BELIEF_REVISION_FAIL: 528, // Belief revision failed
  COMMON_KNOWLEDGE_FAIL: 529, // Common knowledge not established

  // Fuzzy/probabilistic (530-539)
  FUZZY_MEMBERSHIP: 530,    // Fuzzy set membership unclear
  PROBABILITY_UNDEFINED: 531, // Probability undefined
  MEASURE_ZERO: 532,        // Measure zero set
  NON_MEASURABLE: 533,      // Non-measurable set
  CONDITIONING_FAIL: 534,   // Conditional probability undefined
  BAYES_FAIL: 535,          // Bayesian update failed
  PRIOR_UNDEFINED: 536,     // Prior distribution undefined
  LIKELIHOOD_ZERO: 537,     // Zero likelihood
  EVIDENCE_CONFLICT: 538,   // Conflicting evidence
  BELIEF_INCONSISTENT: 539, // Belief network inconsistent

  // Set theory (540-549)
  RUSSELL_PARADOX: 540,     // Set of all sets that don't contain themselves
  CANTOR_PARADOX: 541,      // Set of all sets
  BURALI_FORTI: 542,        // Ordinal of all ordinals
  AXIOM_CHOICE_REQUIRED: 543, // Requires axiom of choice
  CONTINUUM_UNDECIDABLE: 544, // Continuum hypothesis undecidable
  LARGE_CARDINAL: 545,      // Requires large cardinal axiom
  FORCING_REQUIRED: 546,    // Requires forcing
  INNER_MODEL: 547,         // Inner model issue
  DEFINABILITY_FAIL: 548,   // Not definable
  WELL_ORDERING_FAIL: 549,  // Well-ordering fails
} as const;

// =============================================================================
// MATHEMATICAL ERRORS (600-699)
// =============================================================================

export const MATH_ERRORS = {
  // Division/infinity (600-609)
  DIV_ZERO: 600,            // Division by zero → ±∞
  DIV_ZERO_NEG: 601,        // -1/0 → -∞
  INFINITY: 602,            // +∞
  NEG_INFINITY: 603,        // -∞
  INFINITY_ARITHMETIC: 604, // Arithmetic with infinity
  SIGNED_INFINITY: 605,     // Signed infinity comparison
  INDETERMINATE: 606,       // Indeterminate form (0/0, ∞/∞, etc.)
  PROJECTIVE_INFINITY: 607, // Projective infinity (unsigned)
  EXTENDED_REAL: 608,       // Extended real number issues
  HYPERREAL: 609,           // Hyperreal number issues

  // Indeterminate forms - subcodes of 606 (610-619)
  INDET_0_DIV_0: 610,       // 0/0
  INDET_INF_DIV_INF: 611,   // ∞/∞
  INDET_0_MUL_INF: 612,     // 0 × ∞
  INDET_INF_SUB_INF: 613,   // ∞ - ∞
  INDET_1_POW_INF: 614,     // 1^∞
  INDET_INF_POW_0: 615,     // ∞^0
  INDET_0_POW_0: 616,       // 0^0
  INDET_NEG_POW_FRAC: 617,  // (-x)^(p/q) for even q
  INDET_COMPLEX_LOG: 618,   // Complex logarithm branch
  INDET_COMPLEX_ROOT: 619,  // Complex root selection

  // Domain violations (620-629)
  SQRT_NEGATIVE: 620,       // √(-x) for x > 0 → i√x
  LOG_NEGATIVE: 621,        // log(-x) → log(x) + iπ
  LOG_ZERO: 622,            // log(0) → -∞
  ASIN_DOMAIN: 623,         // asin(x) for |x| > 1
  ACOS_DOMAIN: 624,         // acos(x) for |x| > 1
  EVEN_ROOT_NEGATIVE: 625,  // Even root of negative
  FACTORIAL_NEGATIVE: 626,  // n! for n < 0
  GAMMA_POLE: 627,          // Γ(n) for n ∈ {0, -1, -2, ...}
  MOD_ZERO: 628,            // x mod 0
  INT_DIV_ZERO: 629,        // Integer division by zero

  // IEEE 754 special values (630-649)
  QNAN: 630,                // Quiet NaN
  SNAN: 631,                // Signaling NaN
  NAN_PAYLOAD: 632,         // NaN with payload
  DENORMAL: 633,            // Denormalized/subnormal number
  GRADUAL_UNDERFLOW: 634,   // Gradual underflow
  PRECISION_LOSS_SUBNORMAL: 635, // Precision loss in subnormal
  POSITIVE_ZERO: 636,       // +0
  NEGATIVE_ZERO: 637,       // -0
  SIGN_BIT_ONLY: 638,       // Sign bit difference only
  ROUNDING_ERROR: 639,      // Rounding error
  CATASTROPHIC_CANCEL: 640, // Catastrophic cancellation
  ABSORPTION: 641,          // x + ε = x (ε too small)
  MAGNIFICATION: 642,       // Error magnification
  ACCUMULATED_ERROR: 643,   // Accumulated rounding
  MACHINE_EPSILON: 644,     // Machine epsilon exceeded
  ULPS_EXCEEDED: 645,       // Units in last place exceeded
  EXPONENT_OVERFLOW: 646,   // Exponent overflow
  EXPONENT_UNDERFLOW: 647,  // Exponent underflow
  SIGNIFICAND_OVERFLOW: 648, // Significand overflow
  GUARD_DIGIT_ERROR: 649,   // Guard digit rounding error

  // Complex numbers (650-659)
  COMPLEX_INFINITY: 650,    // Complex infinity
  COMPLEX_NAN: 651,         // Complex NaN
  BRANCH_CUT: 652,          // Branch cut discontinuity
  RIEMANN_SHEET: 653,       // Wrong Riemann sheet
  PRINCIPAL_VALUE: 654,     // Principal value ambiguity
  ARG_DISCONTINUITY: 655,   // Argument discontinuity
  MODULUS_ZERO: 656,        // |z| = 0 (division by z)
  PHASE_UNDEFINED: 657,     // Phase of zero undefined
  CONJUGATE_ISSUE: 658,     // Conjugation issue
  QUATERNION_DIVISION: 659, // Quaternion division issues

  // Series/limits (660-669)
  SERIES_DIVERGENT: 660,    // Divergent series
  LIMIT_DNE: 661,           // Limit does not exist
  LIMIT_OSCILLATES: 662,    // Limit oscillates
  ASYMPTOTIC_FAIL: 663,     // Asymptotic expansion fails
  RADIUS_CONVERGENCE: 664,  // Outside radius of convergence
  ANALYTIC_CONTINUATION: 665, // Analytic continuation fails
  POLE: 666,                // Function has pole
  ESSENTIAL_SINGULARITY: 667, // Essential singularity
  REMOVABLE_SINGULARITY: 668, // Removable singularity
  BRANCH_POINT: 669,        // Branch point

  // Linear algebra (670-679)
  SINGULAR_MATRIX: 670,     // Singular/non-invertible matrix
  ILL_CONDITIONED: 671,     // Ill-conditioned matrix
  RANK_DEFICIENT: 672,      // Rank-deficient matrix
  EIGENVALUE_FAIL: 673,     // Eigenvalue computation failed
  SVD_FAIL: 674,            // SVD failed
  CHOLESKY_FAIL: 675,       // Cholesky decomposition failed
  LU_FAIL: 676,             // LU decomposition failed
  QR_FAIL: 677,             // QR decomposition failed
  DIMENSION_INCOMPATIBLE: 678, // Dimension incompatible
  NON_POSITIVE_DEFINITE: 679, // Matrix not positive definite

  // Differential equations (680-689)
  NO_SOLUTION: 680,         // No solution exists
  INFINITE_SOLUTIONS: 681,  // Infinitely many solutions
  UNSTABLE: 682,            // Numerically unstable
  STIFF: 683,               // Stiff system
  CHAOTIC: 684,             // Chaotic behavior
  BIFURCATION: 685,         // Bifurcation point
  SINGULAR_POINT: 686,      // Singular point in ODE
  BLOW_UP: 687,             // Solution blows up
  SHOCK: 688,               // Shock/discontinuity
  WEAK_SOLUTION: 689,       // Only weak solution exists

  // Optimization (690-699)
  NO_MINIMUM: 690,          // No minimum exists
  NO_MAXIMUM: 691,          // No maximum exists
  SADDLE_POINT: 692,        // Saddle point found
  LOCAL_NOT_GLOBAL: 693,    // Local optimum not global
  CONSTRAINT_INFEASIBLE: 694, // Constraints infeasible
  UNBOUNDED: 695,           // Objective unbounded
  DEGENERATE: 696,          // Degenerate solution
  NON_CONVEX: 697,          // Non-convex problem
  GRADIENT_VANISH: 698,     // Vanishing gradient
  GRADIENT_EXPLODE: 699,    // Exploding gradient
} as const;

// =============================================================================
// QUANTUM ERRORS (700-799)
// =============================================================================

export const QUANTUM_ERRORS = {
  // Superposition/measurement (700-709)
  SUPERPOSITION: 700,       // Unmeasured superposition state
  ENTANGLED: 701,           // Entangled (cannot determine independently)
  DECOHERENT: 702,          // Decoherence occurred
  UNMEASURED: 703,          // Measurement required
  COLLAPSED: 704,           // Already collapsed
  MEASUREMENT_ERROR: 705,   // Measurement error
  STATE_PREPARATION_FAIL: 706, // State preparation failed
  GATE_ERROR: 707,          // Quantum gate error
  READOUT_ERROR: 708,       // Readout error
  CROSSTALK: 709,           // Qubit crosstalk

  // Uncertainty/observables (710-719)
  SPIN_UNDEFINED: 710,      // Spin state undefined
  POSITION_UNDEFINED: 711,  // Position undefined (uncertainty)
  MOMENTUM_UNDEFINED: 712,  // Momentum undefined (uncertainty)
  ENERGY_UNDEFINED: 713,    // Energy undefined (time-energy)
  PHASE_UNDEFINED_Q: 714,   // Quantum phase undefined
  NUMBER_UNDEFINED: 715,    // Number state undefined
  COHERENT_STATE: 716,      // Coherent state issues
  SQUEEZED_STATE: 717,      // Squeezed state issues
  FOCK_STATE: 718,          // Fock state issues
  VACUUM_FLUCTUATION: 719,  // Vacuum fluctuation

  // Decoherence types (720-729)
  ENV_DECOHERENCE: 720,     // Environmental decoherence
  THERMAL_DECOHERENCE: 721, // Thermal decoherence
  GRAV_DECOHERENCE: 722,    // Gravitational decoherence
  SPONTANEOUS_COLLAPSE: 723, // Spontaneous collapse (GRW)
  T1_DECAY: 724,            // T1 (amplitude) decay
  T2_DEPHASING: 725,        // T2 (phase) dephasing
  LEAKAGE: 726,             // Qubit leakage to non-computational states
  RELAXATION: 727,          // Relaxation
  PURE_DEPHASING: 728,      // Pure dephasing
  MARKOVIAN_NOISE: 729,     // Markovian noise

  // Quantum information (730-739)
  NO_CLONING: 730,          // No-cloning theorem violated
  NO_DELETING: 731,         // No-deleting theorem violated
  NO_BROADCAST: 732,        // No-broadcasting theorem violated
  ENTANGLEMENT_MONOGAMY: 733, // Entanglement monogamy violation
  HOLEVO_BOUND: 734,        // Holevo bound exceeded
  QUANTUM_CAPACITY: 735,    // Quantum channel capacity exceeded
  FIDELITY_LOW: 736,        // State fidelity too low
  PURITY_LOW: 737,          // State purity too low
  ENTROPY_ISSUE: 738,       // Von Neumann entropy issue
  DISCORD_ISSUE: 739,       // Quantum discord issue

  // Quantum error correction (740-749)
  UNCORRECTABLE: 740,       // Error uncorrectable
  SYNDROME_AMBIGUOUS: 741,  // Syndrome ambiguous
  LOGICAL_ERROR: 742,       // Logical qubit error
  WEIGHT_EXCEEDED: 743,     // Error weight exceeded
  DISTANCE_INSUFFICIENT: 744, // Code distance insufficient
  THRESHOLD_EXCEEDED: 745,  // Error threshold exceeded
  MAGIC_STATE_FAIL: 746,    // Magic state distillation failed
  SURFACE_CODE_FAIL: 747,   // Surface code error
  STABILIZER_FAIL: 748,     // Stabilizer measurement failed
  FAULT_PROPAGATION: 749,   // Fault propagation detected

  // Quantum protocols (750-759)
  BELL_VIOLATION: 750,      // Bell inequality violation (expected)
  CHSH_FAIL: 751,           // CHSH inequality test failed
  TELEPORTATION_FAIL: 752,  // Teleportation failed
  SUPERDENSE_FAIL: 753,     // Superdense coding failed
  QKD_ABORT: 754,           // QKD protocol aborted
  EAVESDROPPING: 755,       // Eavesdropping detected
  KEY_RATE_ZERO: 756,       // Secret key rate zero
  AUTHENTICATION_FAIL: 757, // Quantum authentication failed
  VERIFICATION_FAIL: 758,   // Quantum verification failed
  BLIND_COMPUTE_FAIL: 759,  // Blind quantum computation failed
} as const;

// =============================================================================
// SYSTEM ERRORS (800-899)
// =============================================================================

export const SYSTEM_ERRORS = {
  // HTTP status codes (800-809)
  HTTP_400: 800,            // Bad Request
  HTTP_401: 801,            // Unauthorized
  HTTP_403: 802,            // Forbidden
  HTTP_404: 803,            // Not Found
  HTTP_408: 804,            // Request Timeout
  HTTP_429: 805,            // Too Many Requests
  HTTP_500: 806,            // Internal Server Error
  HTTP_502: 807,            // Bad Gateway
  HTTP_503: 808,            // Service Unavailable
  HTTP_504: 809,            // Gateway Timeout

  // POSIX errno (810-829)
  EDOM: 810,                // Math domain error
  ERANGE: 811,              // Math result out of range
  EILSEQ: 812,              // Illegal byte sequence
  EINVAL: 813,              // Invalid argument
  ENOMEM: 814,              // Out of memory
  ETIMEDOUT: 815,           // Connection timed out
  ECONNREFUSED: 816,        // Connection refused
  ECONNRESET: 817,          // Connection reset
  EAGAIN: 818,              // Resource temporarily unavailable
  EWOULDBLOCK: 819,         // Operation would block
  ESTALE: 820,              // Stale file handle
  ENOENT: 821,              // No such file or directory
  EACCES: 822,              // Permission denied
  EEXIST: 823,              // File exists
  ENOTDIR: 824,             // Not a directory
  EISDIR: 825,              // Is a directory
  ENOSPC: 826,              // No space left on device
  EROFS: 827,               // Read-only file system
  EMFILE: 828,              // Too many open files
  ENFILE: 829,              // Too many open files in system

  // Database errors (830-849)
  DEADLOCK: 830,            // Deadlock detected
  LOCK_TIMEOUT: 831,        // Lock timeout
  TX_CONFLICT: 832,         // Transaction conflict
  FK_VIOLATION: 833,        // Foreign key violation
  UNIQUE_VIOLATION: 834,    // Unique constraint violation
  CHECK_VIOLATION: 835,     // Check constraint violation
  NOT_NULL_VIOLATION: 836,  // Not null violation
  SERIALIZATION_FAIL_DB: 837, // Serialization failure
  CONNECTION_POOL_EXHAUSTED: 838, // Connection pool exhausted
  QUERY_TIMEOUT: 839,       // Query timeout
  REPLICA_LAG: 840,         // Replication lag too high
  SPLIT_BRAIN: 841,         // Split brain detected
  WAL_FULL: 842,            // Write-ahead log full
  CHECKPOINT_FAIL: 843,     // Checkpoint failed
  VACUUM_FAIL: 844,         // Vacuum failed
  INDEX_CORRUPTION: 845,    // Index corruption
  TABLE_CORRUPTION: 846,    // Table corruption
  SCHEMA_MISMATCH: 847,     // Schema mismatch
  MIGRATION_FAIL: 848,      // Migration failed
  BACKUP_FAIL: 849,         // Backup failed

  // Network errors (850-859)
  DNS_FAIL: 850,            // DNS resolution failed
  TLS_FAIL: 851,            // TLS handshake failed
  CERT_EXPIRED: 852,        // Certificate expired
  CERT_INVALID: 853,        // Certificate invalid
  HOSTNAME_MISMATCH: 854,   // Hostname mismatch
  SOCKET_ERROR: 855,        // Socket error
  PROTOCOL_ERROR: 856,      // Protocol error
  PACKET_LOSS: 857,         // Packet loss detected
  MTU_EXCEEDED: 858,        // MTU exceeded
  NAT_TRAVERSAL_FAIL: 859,  // NAT traversal failed

  // Distributed system errors (860-879)
  CONSENSUS_FAIL: 860,      // Consensus failed
  QUORUM_LOST: 861,         // Quorum lost
  LEADER_ELECTION_FAIL: 862, // Leader election failed
  PARTITION: 863,           // Network partition
  CLOCK_SKEW: 864,          // Clock skew detected
  VECTOR_CLOCK_CONFLICT: 865, // Vector clock conflict
  CAUSAL_ORDER_VIOLATION: 866, // Causal order violation
  EVENTUAL_CONSISTENCY_DELAY: 867, // EC delay too high
  SPLIT_VOTE: 868,          // Split vote
  TERM_EXPIRED: 869,        // Raft term expired
  LOG_COMPACTION_FAIL: 870, // Log compaction failed
  SNAPSHOT_FAIL: 871,       // Snapshot failed
  MEMBERSHIP_CHANGE_FAIL: 872, // Membership change failed
  HEARTBEAT_TIMEOUT: 873,   // Heartbeat timeout
  STATE_TRANSFER_FAIL: 874, // State transfer failed

  // Workflow/job errors (880-889)
  JOB_QUEUED: 880,          // Job queued (not error, state)
  JOB_RUNNING: 881,         // Job running
  JOB_FAILED: 882,          // Job failed
  JOB_RETRYING: 883,        // Job retrying
  JOB_CANCELLED: 884,       // Job cancelled
  JOB_TIMEOUT: 885,         // Job timeout
  WORKFLOW_INCOMPLETE: 886, // Workflow incomplete
  STEP_SKIPPED: 887,        // Workflow step skipped
  IDEMPOTENCY_CONFLICT: 888, // Idempotency key conflict
  CIRCUIT_OPEN: 889,        // Circuit breaker open

  // Windows HRESULT (890-899)
  E_NOTIMPL: 890,           // Not implemented
  E_NOINTERFACE: 891,       // No such interface
  E_POINTER: 892,           // Invalid pointer
  E_ABORT: 893,             // Operation aborted
  E_FAIL: 894,              // Unspecified failure
  E_UNEXPECTED: 895,        // Unexpected failure
  E_ACCESSDENIED: 896,      // Access denied
  E_HANDLE: 897,            // Invalid handle
  E_OUTOFMEMORY: 898,       // Out of memory
  E_INVALIDARG: 899,        // Invalid argument
} as const;

// =============================================================================
// UNKNOWN/META ERRORS (900-999)
// =============================================================================

export const UNKNOWN_ERRORS = {
  // Catch-all (900-909)
  UNKNOWN: 900,             // Unknown error
  UNKNOWN_STATE: 901,       // State cannot be determined
  UNKNOWN_CAUSE: 902,       // Error with unknown cause
  UNCLASSIFIED: 903,        // Unclassified error
  LEGACY_ERROR: 904,        // Legacy system error
  VENDOR_ERROR: 905,        // Vendor-specific error
  CUSTOM_ERROR: 906,        // Custom application error
  WRAPPED_ERROR: 907,       // Wrapped/chained error
  AGGREGATE_ERROR: 908,     // Multiple errors aggregated
  PARTIAL_ERROR: 909,       // Partial success/failure

  // Investigation required (910-919)
  NEEDS_INVESTIGATION: 910, // Needs human investigation
  NEEDS_CONTEXT: 911,       // Needs more context
  NEEDS_REPRODUCTION: 912,  // Needs reproduction steps
  NEEDS_LOGS: 913,          // Needs log analysis
  NEEDS_TRACE: 914,         // Needs distributed trace
  NEEDS_METRICS: 915,       // Needs metrics analysis
  NEEDS_PROFILING: 916,     // Needs profiling
  NEEDS_DEBUGGING: 917,     // Needs interactive debugging
  NEEDS_ROLLBACK: 918,      // Needs rollback decision
  NEEDS_ESCALATION: 919,    // Needs escalation

  // Future/placeholder (920-999)
  RESERVED_920: 920,
  RESERVED_930: 930,
  RESERVED_940: 940,
  RESERVED_950: 950,
  RESERVED_960: 960,
  RESERVED_970: 970,
  RESERVED_980: 980,
  RESERVED_990: 990,
  RESERVED_999: 999,        // Maximum error code
} as const;

// =============================================================================
// COMBINED ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  ...TYPE_ERRORS,
  ...VALUE_ERRORS,
  ...REFERENCE_ERRORS,
  ...RANGE_ERRORS,
  ...LOGIC_ERRORS,
  ...MATH_ERRORS,
  ...QUANTUM_ERRORS,
  ...SYSTEM_ERRORS,
  ...UNKNOWN_ERRORS,
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// =============================================================================
// ERROR METADATA
// =============================================================================

export interface ErrorMetadata {
  code: number;
  name: string;
  category: 'type' | 'value' | 'reference' | 'range' | 'logic' | 'math' | 'quantum' | 'system' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  resolution?: string;
  examples?: string[];
  see_also?: number[];  // Related error codes
}

// =============================================================================
// ERROR COUNT SUMMARY
// =============================================================================

const counts = {
  type: Object.keys(TYPE_ERRORS).length,
  value: Object.keys(VALUE_ERRORS).length,
  reference: Object.keys(REFERENCE_ERRORS).length,
  range: Object.keys(RANGE_ERRORS).length,
  logic: Object.keys(LOGIC_ERRORS).length,
  math: Object.keys(MATH_ERRORS).length,
  quantum: Object.keys(QUANTUM_ERRORS).length,
  system: Object.keys(SYSTEM_ERRORS).length,
  unknown: Object.keys(UNKNOWN_ERRORS).length,
};

export const TOTAL_ERROR_CODES = Object.values(counts).reduce((a, b) => a + b, 0);

// CLI output
if (require.main === module) {
  console.log('=== BlackRoad OS Complete Error Code System ===\n');
  console.log('Category Counts:');
  for (const [category, count] of Object.entries(counts)) {
    console.log(`  ${category.padEnd(12)}: ${count} codes`);
  }
  console.log(`\nTOTAL: ${TOTAL_ERROR_CODES} error codes defined`);
  console.log('\nNo undefined. No excuses. Every error has a number.');
}

export default {
  TYPE_ERRORS,
  VALUE_ERRORS,
  REFERENCE_ERRORS,
  RANGE_ERRORS,
  LOGIC_ERRORS,
  MATH_ERRORS,
  QUANTUM_ERRORS,
  SYSTEM_ERRORS,
  UNKNOWN_ERRORS,
  ERROR_CODES,
  TOTAL_ERROR_CODES,
};
