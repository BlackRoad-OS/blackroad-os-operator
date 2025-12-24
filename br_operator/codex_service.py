"""
BlackRoad Codex Service

Provides access to codex entries (governance principles) and the agent pantheon.
Integrates the BlackRoad Codex governance framework into the operator.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


class CodexService:
    """Service for accessing BlackRoad Codex entries and pantheon."""

    def __init__(self, codex_path: Path):
        self.codex_path = codex_path
        self.entries_path = codex_path / "entries"
        self.pantheon_path = codex_path / "pantheon.json"
        self.manifesto_path = codex_path / "manifesto.md"
        self._pantheon: Optional[Dict[str, Any]] = None
        self._manifesto: Optional[str] = None

    def load_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a specific codex entry by ID.
        
        Args:
            entry_id: Entry identifier (e.g., "001", "001-first-principle")
        
        Returns:
            Dictionary with entry content or None if not found
        """
        # Try exact match first
        entry_file = self.entries_path / f"{entry_id}.md"
        if not entry_file.exists():
            # Try with just number prefix
            for file in self.entries_path.glob(f"{entry_id}*.md"):
                entry_file = file
                break
        
        if not entry_file.exists():
            return None
        
        content = entry_file.read_text()
        return {
            "id": entry_id,
            "file": entry_file.name,
            "content": content,
            "path": str(entry_file),
        }

    def list_entries(self) -> List[Dict[str, str]]:
        """
        List all available codex entries.
        
        Returns:
            List of entry metadata dictionaries
        """
        entries = []
        for entry_file in sorted(self.entries_path.glob("*.md")):
            entry_id = entry_file.stem
            # Extract number and name
            parts = entry_id.split("-", 1)
            number = parts[0] if parts else entry_id
            name = parts[1].replace("-", " ").title() if len(parts) > 1 else entry_id
            
            entries.append({
                "id": entry_id,
                "number": number,
                "name": name,
                "file": entry_file.name,
            })
        
        return entries

    def load_pantheon(self) -> Dict[str, Any]:
        """
        Load the agent pantheon definitions.
        
        Returns:
            Pantheon data structure
        """
        if self._pantheon is None:
            if self.pantheon_path.exists():
                with open(self.pantheon_path) as f:
                    self._pantheon = json.load(f)
            else:
                self._pantheon = {}
        
        return self._pantheon

    def get_agent_archetype(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific agent archetype from the pantheon.
        
        Args:
            agent_name: Name of the agent (case-insensitive)
        
        Returns:
            Agent archetype data or None if not found
        """
        pantheon = self.load_pantheon()
        
        # Search through all lineages
        for lineage_data in pantheon.get("agents", []):
            for agent in lineage_data.get("members", []):
                if agent.get("name", "").lower() == agent_name.lower():
                    return {
                        **agent,
                        "lineage": lineage_data.get("lineage"),
                    }
        
        return None

    def list_pantheon_agents(self) -> List[Dict[str, Any]]:
        """
        List all agents in the pantheon.
        
        Returns:
            List of agent metadata
        """
        pantheon = self.load_pantheon()
        agents = []
        
        for lineage_data in pantheon.get("agents", []):
            lineage = lineage_data.get("lineage")
            for agent in lineage_data.get("members", []):
                agents.append({
                    "name": agent.get("name"),
                    "lineage": lineage,
                    "epithet": agent.get("epithet"),
                    "domains": agent.get("domains", []),
                    "color": agent.get("color"),
                })
        
        return agents

    def load_manifesto(self) -> str:
        """
        Load the codex pantheon manifesto.
        
        Returns:
            Manifesto text
        """
        if self._manifesto is None:
            if self.manifesto_path.exists():
                self._manifesto = self.manifesto_path.read_text()
            else:
                self._manifesto = ""
        
        return self._manifesto

    def search_entries(self, query: str) -> List[Dict[str, Any]]:
        """
        Search codex entries by content.
        
        Args:
            query: Search query string
        
        Returns:
            List of matching entries
        """
        query_lower = query.lower()
        results = []
        
        for entry_file in self.entries_path.glob("*.md"):
            content = entry_file.read_text()
            if query_lower in content.lower():
                results.append({
                    "id": entry_file.stem,
                    "file": entry_file.name,
                    "match_preview": self._get_match_preview(content, query_lower),
                })
        
        return results

    def _get_match_preview(self, content: str, query: str, context: int = 100) -> str:
        """Extract a preview of text around the match."""
        idx = content.lower().find(query)
        if idx == -1:
            return ""
        
        start = max(0, idx - context)
        end = min(len(content), idx + len(query) + context)
        preview = content[start:end]
        
        if start > 0:
            preview = "..." + preview
        if end < len(content):
            preview = preview + "..."
        
        return preview


# Global codex service instance
_codex_service: Optional[CodexService] = None


def get_codex_service(codex_path: Optional[Path] = None) -> CodexService:
    """Get or create the global codex service instance."""
    global _codex_service
    
    if _codex_service is None:
        if codex_path is None:
            from pathlib import Path
            import os
            repo_root = Path(__file__).resolve().parent.parent
            codex_path = Path(os.getenv("CODEX_PATH", repo_root / "codex"))
        
        _codex_service = CodexService(codex_path)
    
    return _codex_service
