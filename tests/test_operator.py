from __future__ import annotations

from pathlib import Path
import sys


from fastapi.testclient import TestClient

from br_operator.main import create_app


def make_catalog(tmp_path: Path) -> Path:
    catalog_path = tmp_path / "agents.yaml"
    catalog_path.write_text(
        """
- id: alpha
  name: Alpha Agent
  description: Handles alpha tasks
- id: beta
  name: Beta Agent
  description: Handles beta tasks
        """.strip()
    )
    return catalog_path


def test_catalog_loads_on_startup(tmp_path: Path) -> None:
    catalog_path = make_catalog(tmp_path)
    app = create_app(catalog_path, enable_watch=False)

    with TestClient(app) as client:
        response = client.get("/agents")

    assert response.status_code == 200
    payload = response.json()
    assert payload["agents"][0]["id"] == "alpha"
    assert payload["agents"][1]["name"] == "Beta Agent"


def test_unknown_agent_returns_404(tmp_path: Path) -> None:
    catalog_path = make_catalog(tmp_path)
    app = create_app(catalog_path, enable_watch=False)

    with TestClient(app) as client:
        response = client.get("/agents/missing")

    assert response.status_code == 404
    assert response.json()["detail"] == "agent not found"


def test_headers_are_injected(tmp_path: Path) -> None:
    catalog_path = make_catalog(tmp_path)
    app = create_app(catalog_path, enable_watch=False)

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.headers["X-Agent-Operator-Version"]
    assert response.headers["X-Catalog-Version"]
    assert response.json()["catalog"] == "ok"
