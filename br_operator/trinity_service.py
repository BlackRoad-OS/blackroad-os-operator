"""
Light Trinity Integration Service

Provides logging and event tracking integration with the GreenLight, YellowLight, 
and RedLight systems of the BlackRoad Light Trinity.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class TrinityLight(str, Enum):
    """The three lights of the Trinity system."""
    GREEN = "greenlight"   # Project management, tasks, workflows
    YELLOW = "yellowlight"  # Infrastructure, deployments, CI/CD
    RED = "redlight"        # Templates, brand, visual experiences


class TrinityEvent:
    """Represents an event in the Trinity system."""
    
    def __init__(
        self,
        light: TrinityLight,
        event_type: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.light = light
        self.event_type = event_type
        self.message = message
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "light": self.light.value,
            "event_type": self.event_type,
            "message": self.message,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
        }

    def to_nats_subject(self) -> str:
        """Convert event to NATS subject pattern."""
        # Pattern: {light}.{state}.{scale}.{domain}.{id}
        state = self.metadata.get("state", "info")
        scale = self.metadata.get("scale", "micro")
        domain = self.metadata.get("domain", "platform")
        event_id = self.metadata.get("id", "event")
        
        return f"{self.light.value}.{state}.{scale}.{domain}.{event_id}"


class TrinityService:
    """Service for Trinity event logging and integration."""

    def __init__(self, trinity_path: Path):
        self.trinity_path = trinity_path
        self.greenlight_path = trinity_path / "greenlight"
        self.yellowlight_path = trinity_path / "yellowlight"
        self.redlight_path = trinity_path / "redlight"
        self.events: list[TrinityEvent] = []

    def log_greenlight_event(
        self,
        event_type: str,
        message: str,
        **metadata: Any,
    ) -> TrinityEvent:
        """
        Log a GreenLight project management event.
        
        Examples: task_created, task_completed, phase_started, deployment_done
        """
        event = TrinityEvent(
            light=TrinityLight.GREEN,
            event_type=event_type,
            message=message,
            metadata=metadata,
        )
        self.events.append(event)
        logger.info(f"💚 GreenLight: {event_type} - {message}")
        return event

    def log_yellowlight_event(
        self,
        event_type: str,
        message: str,
        **metadata: Any,
    ) -> TrinityEvent:
        """
        Log a YellowLight infrastructure event.
        
        Examples: deployment_started, integration_configured, health_check
        """
        event = TrinityEvent(
            light=TrinityLight.YELLOW,
            event_type=event_type,
            message=message,
            metadata=metadata,
        )
        self.events.append(event)
        logger.info(f"💛 YellowLight: {event_type} - {message}")
        return event

    def log_redlight_event(
        self,
        event_type: str,
        message: str,
        **metadata: Any,
    ) -> TrinityEvent:
        """
        Log a RedLight template/brand event.
        
        Examples: template_created, template_deployed, performance_metrics
        """
        event = TrinityEvent(
            light=TrinityLight.RED,
            event_type=event_type,
            message=message,
            metadata=metadata,
        )
        self.events.append(event)
        logger.info(f"🔴 RedLight: {event_type} - {message}")
        return event

    def get_recent_events(
        self,
        light: Optional[TrinityLight] = None,
        limit: int = 100,
    ) -> list[Dict[str, Any]]:
        """Get recent Trinity events, optionally filtered by light."""
        events = self.events
        
        if light:
            events = [e for e in events if e.light == light]
        
        events = events[-limit:]
        return [e.to_dict() for e in events]

    def export_events(self, output_path: Path) -> None:
        """Export all events to a JSON file."""
        with open(output_path, "w") as f:
            json.dump([e.to_dict() for e in self.events], f, indent=2)

    # Convenience methods for common operations
    
    def log_operator_started(self, version: str) -> TrinityEvent:
        """Log operator service startup."""
        return self.log_yellowlight_event(
            "operator_started",
            f"BlackRoad OS Operator started (version: {version})",
            service="operator",
            version=version,
        )

    def log_agent_invoked(self, agent_id: str, operation: str) -> TrinityEvent:
        """Log agent invocation."""
        return self.log_greenlight_event(
            "agent_invoked",
            f"Agent {agent_id} invoked for {operation}",
            agent_id=agent_id,
            operation=operation,
        )

    def log_deployment(
        self,
        service: str,
        platform: str,
        url: str,
        status: str,
    ) -> TrinityEvent:
        """Log a deployment event."""
        return self.log_yellowlight_event(
            "deployment",
            f"Deployed {service} to {platform}: {status}",
            service=service,
            platform=platform,
            url=url,
            status=status,
        )

    def log_policy_evaluation(
        self,
        policy_id: str,
        effect: str,
        resource: str,
    ) -> TrinityEvent:
        """Log policy evaluation."""
        return self.log_greenlight_event(
            "policy_evaluated",
            f"Policy {policy_id} evaluated: {effect} for {resource}",
            policy_id=policy_id,
            effect=effect,
            resource=resource,
        )

    def log_codex_access(self, entry_id: str, accessor: str) -> TrinityEvent:
        """Log codex entry access."""
        return self.log_greenlight_event(
            "codex_accessed",
            f"Codex entry {entry_id} accessed by {accessor}",
            entry_id=entry_id,
            accessor=accessor,
        )


# Global trinity service instance
_trinity_service: Optional[TrinityService] = None


def get_trinity_service(trinity_path: Optional[Path] = None) -> TrinityService:
    """Get or create the global trinity service instance."""
    global _trinity_service
    
    if _trinity_service is None:
        if trinity_path is None:
            from pathlib import Path
            import os
            repo_root = Path(__file__).resolve().parent.parent
            trinity_path = Path(os.getenv("TRINITY_PATH", repo_root / ".trinity"))
        
        _trinity_service = TrinityService(trinity_path)
    
    return _trinity_service
