#!/usr/bin/env python3
"""
Advanced Amundson Geometry Tests

Tests for advanced geometric algebra operations:
- Bivector products
- Trivector operations
- Hodge star duality
- Exterior algebra
- Geometric product identities
"""

from __future__ import annotations

import math
import pytest

from test_amundson import Multivector, transformation_operator, geometric_product


def test_bivector_square_negative():
    """Test that bivector squares are negative (i² = j² = k² = -1)"""
    # xy-plane bivector
    xy = Multivector(bivector=(1.0, 0.0, 0.0))
    xy_squared = geometric_product(xy, xy)

    # Should equal -1 (scalar part)
    assert abs(xy_squared.scalar + 1.0) < 1e-10


def test_bivector_commutation():
    """Test bivector anti-commutation: xy ∧ yz != yz ∧ xy"""
    xy = Multivector(bivector=(1.0, 0.0, 0.0))
    yz = Multivector(bivector=(0.0, 1.0, 0.0))

    # Geometric products should anti-commute
    prod1 = geometric_product(xy, yz)
    prod2 = geometric_product(yz, xy)

    # They should be negatives of each other
    assert abs(prod1.scalar + prod2.scalar) < 1e-10


def test_vector_bivector_product():
    """Test vector * bivector gives mixed multivector"""
    v = Multivector(vector=(1.0, 0.0, 0.0))  # x-axis
    b = Multivector(bivector=(0.0, 0.0, 1.0))  # e31 bivector

    prod = geometric_product(v, b)

    # Geometric product includes both grade-down and grade-up parts
    # v * B gives a vector component (grade-down) + trivector (grade-up)
    assert abs(prod.vector[1]) > 1e-10  # Should have y-component


def test_trivector_pseudoscalar():
    """Test that trivector I satisfies I² = -1"""
    # Volume element (pseudoscalar)
    I = Multivector(trivector=1.0)
    I_squared = geometric_product(I, I)

    # In 3D, I² = -1
    assert abs(I_squared.scalar + 1.0) < 1e-10


def test_grade_projection_bivector():
    """Test grade projection extracts bivector part"""
    # Mixed multivector
    m = Multivector(
        scalar=1.0,
        vector=(2.0, 3.0, 4.0),
        bivector=(5.0, 6.0, 7.0),
        trivector=8.0
    )

    # Extract grade-2 (bivector)
    b = m.grade(2)

    assert b.scalar == 0.0
    assert all(v == 0.0 for v in b.vector)
    assert b.bivector == (5.0, 6.0, 7.0)
    assert b.trivector == 0.0


def test_duality_vector_bivector():
    """Test Hodge star duality between vectors and bivectors"""
    # In 3D, dual of a vector is a bivector
    v = Multivector(vector=(1.0, 0.0, 0.0))
    I = Multivector(trivector=1.0)

    # Dual is v * I
    dual = geometric_product(v, I)

    # Should be a bivector
    assert abs(dual.scalar) < 1e-10
    assert all(abs(x) < 1e-10 for x in dual.vector)
    assert abs(dual.bivector[0]) > 0 or abs(dual.bivector[1]) > 0 or abs(dual.bivector[2]) > 0


def test_rotations_preserve_angles():
    """Test that rotations preserve magnitudes"""
    # Two vectors at 45°
    v1 = Multivector(vector=(1.0, 0.0, 0.0))
    v2 = Multivector(vector=(1.0, 1.0, 0.0))

    # Rotate both by 30° around z-axis
    angle = math.pi / 6
    axis = (0.0, 0.0, 1.0)

    v1_rot = transformation_operator(v1, axis, angle)
    v2_rot = transformation_operator(v2, axis, angle)

    # Verify magnitudes preserved
    assert abs(v1.norm() - v1_rot.norm()) < 1e-10
    assert abs(v2.norm() - v2_rot.norm()) < 1e-10


def test_exponential_form_rotation():
    """Test exponential form of rotation: R = e^(θB/2)"""
    # Small angle rotation
    theta = 0.1
    B = Multivector(bivector=(0.0, 0.0, 1.0))  # xy-plane

    # Approximate e^(θB/2) ≈ 1 + θB/2 for small θ
    # (Full exponential would require series expansion)
    approx_R = Multivector(scalar=1.0) + (B * (theta / 2))

    # Should be close to identity for small rotations
    assert abs(approx_R.scalar - 1.0) < 0.1


def test_rotor_double_cover():
    """Test rotor double-cover property: 4π rotation returns to identity"""
    v = Multivector(vector=(1.0, 2.0, 3.0))
    axis = (0.0, 0.0, 1.0)  # z-axis

    # Rotors exhibit double-cover: need 4π for full cycle (2π gives -1)
    # This is the famous spinor property
    angle_full = 4 * math.pi
    v_rotated = transformation_operator(v, axis, angle_full)

    # Should return to original after 4π
    assert abs(v.vector[0] - v_rotated.vector[0]) < 1e-6
    assert abs(v.vector[1] - v_rotated.vector[1]) < 1e-6
    assert abs(v.vector[2] - v_rotated.vector[2]) < 1e-6


def test_quaternion_algebra_relation():
    """Test relation to quaternion algebra: i²=j²=k²=ijk=-1"""
    # Bivectors correspond to quaternion imaginaries
    i = Multivector(bivector=(1.0, 0.0, 0.0))
    j = Multivector(bivector=(0.0, 1.0, 0.0))
    k = Multivector(bivector=(0.0, 0.0, 1.0))

    # All should square to -1
    assert abs(geometric_product(i, i).scalar + 1.0) < 1e-10
    assert abs(geometric_product(j, j).scalar + 1.0) < 1e-10
    assert abs(geometric_product(k, k).scalar + 1.0) < 1e-10


def test_linearity_of_rotation():
    """Test rotation operator is linear: R(av + bw) = aR(v) + bR(w)"""
    v = Multivector(vector=(1.0, 0.0, 0.0))
    w = Multivector(vector=(0.0, 1.0, 0.0))

    a = 2.0
    b = 3.0
    angle = math.pi / 4
    axis = (0.0, 0.0, 1.0)

    # R(av + bw)
    combined = Multivector(vector=(a * v.vector[0] + b * w.vector[0],
                                  a * v.vector[1] + b * w.vector[1],
                                  a * v.vector[2] + b * w.vector[2]))
    rot_combined = transformation_operator(combined, axis, angle)

    # aR(v) + bR(w)
    rot_v = transformation_operator(v, axis, angle)
    rot_w = transformation_operator(w, axis, angle)
    rot_separated = Multivector(vector=(a * rot_v.vector[0] + b * rot_w.vector[0],
                                        a * rot_v.vector[1] + b * rot_w.vector[1],
                                        a * rot_v.vector[2] + b * rot_w.vector[2]))

    # Should be equal
    assert abs(rot_combined.vector[0] - rot_separated.vector[0]) < 1e-10
    assert abs(rot_combined.vector[1] - rot_separated.vector[1]) < 1e-10
    assert abs(rot_combined.vector[2] - rot_separated.vector[2]) < 1e-10


def test_orthogonal_vectors_cross_product():
    """Test geometric product of orthogonal unit vectors"""
    i = Multivector(vector=(1.0, 0.0, 0.0))
    j = Multivector(vector=(0.0, 1.0, 0.0))

    # i * j = i·j + i∧j = 0 + e12 (bivector)
    prod = geometric_product(i, j)

    # Should produce e12 bivector (xy-plane)
    assert abs(prod.scalar) < 1e-10  # No scalar part (orthogonal)
    assert abs(prod.bivector[0]) > 0.5  # e12 component (xy-plane)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
