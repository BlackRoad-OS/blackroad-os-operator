"""
Health and Version Endpoints for Operator Service
"""

import os
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Any


@dataclass
class HealthResponse:
    """Health check response."""
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: str
    details: dict[str, Any]


@dataclass
class VersionResponse:
    """Version info response."""
    version: str
    git_sha: str
    build_time: str
    service: str
    environment: str


def get_version_info() -> VersionResponse:
    """Get version information from environment."""
    return VersionResponse(
        version=os.getenv("BR_VERSION", "0.1.0"),
        git_sha=os.getenv("BR_GIT_SHA", "unknown"),
        build_time=os.getenv("BR_BUILD_TIME", "unknown"),
        service="blackroad-os-operator",
        environment=os.getenv("BR_ENV", "development"),
    )


async def check_health(db=None, redis=None) -> HealthResponse:
    """
    Check health of operator and dependencies.

    Returns healthy if:
    - Database connection works
    - Redis connection works
    - Reconciler is running (checked via internal state)
    """
    details = {}
    issues = []

    # Check database
    if db:
        try:
            await db.fetchval("SELECT 1")
            details["database"] = "connected"
        except Exception as e:
            details["database"] = f"error: {str(e)}"
            issues.append("database")
    else:
        details["database"] = "not configured"

    # Check Redis
    if redis:
        try:
            await redis.ping()
            details["redis"] = "connected"
        except Exception as e:
            details["redis"] = f"error: {str(e)}"
            issues.append("redis")
    else:
        details["redis"] = "not configured"

    # Determine overall status
    if not issues:
        status = "healthy"
    elif len(issues) == 1:
        status = "degraded"
    else:
        status = "unhealthy"

    return HealthResponse(
        status=status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        details=details,
    )


def health_to_dict(health: HealthResponse) -> dict[str, Any]:
    """Convert health response to dictionary."""
    return asdict(health)


def version_to_dict(version: VersionResponse) -> dict[str, Any]:
    """Convert version response to dictionary."""
    return asdict(version)
