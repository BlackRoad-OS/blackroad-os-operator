#!/usr/bin/env python3
"""
Railway Bulk Delete Script

Uses Railway GraphQL API to delete multiple projects.
Requires RAILWAY_TOKEN environment variable.

Owner: Alexa Louise Amundson
"""

import json
import os
import sys
import time

import httpx

RAILWAY_API = "https://backboard.railway.app/graphql/v2"

# Projects to DELETE (random names)
PROJECTS_TO_DELETE = [
    "secure-grace",
    "wonderful-celebration",
    "fabulous-connection",
    "noble-gentleness",
    "sincere-recreation",
    "gregarious-wonder",
    "merry-warmth",
    "fulfilling-spirit",
    "discerning-expression",
    "steadfast-delight",
    "intuitive-endurance",
    "impartial-vision",
    "loyal-tranquility",
    "innovative-cooperation",
    "gentle-reprieve",
    "alert-enjoyment",
    "thriving-blessing",
    "terrific-truth",
    "NA-6",
    "NA-4",
    "NA-3",
    # Review projects to also delete
    "Operator Engine",
    "Orchestrator",
    "blackroad-os-core",
    "railway-blackroad-os",
    "blackroad-os-api",
    "blackroad-login",
    "BlackRoad API",
    "BlackRoad Portal",
    "blackroad-operating-system",
    "blackroad-os-prism-console",
]

# Projects to KEEP
PROJECTS_TO_KEEP = [
    "blackroad-cece-operator",
    "blackroad-os-operator",  # might consolidate later
    "Prism Console",
    "Lucidia Core",
    "lucidia-platform",
    "Docusaurus Documentation Hub",
    "blackroad-os-docs",
]


def get_token():
    """Get Railway token from environment or config."""
    token = os.getenv("RAILWAY_TOKEN")
    if token:
        return token

    # Try to get from railway CLI config
    config_path = os.path.expanduser("~/.railway/config.json")
    if os.path.exists(config_path):
        with open(config_path) as f:
            config = json.load(f)
            # Token is in user.token
            if "user" in config and "token" in config["user"]:
                return config["user"]["token"]
            # Fallback to root level
            return config.get("token")

    return None


def graphql_request(query: str, variables: dict = None, token: str = None):
    """Make a GraphQL request to Railway API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    response = httpx.post(RAILWAY_API, json=payload, headers=headers, timeout=30)
    return response.json()


def get_all_projects(token: str):
    """Get all projects for the user."""
    query = """
    query {
        me {
            projects {
                edges {
                    node {
                        id
                        name
                        createdAt
                        updatedAt
                        services {
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """

    result = graphql_request(query, token=token)

    if "errors" in result:
        print(f"Error fetching projects: {result['errors']}")
        return []

    projects = []
    edges = result.get("data", {}).get("me", {}).get("projects", {}).get("edges", [])

    for edge in edges:
        node = edge["node"]
        services = [s["node"]["name"] for s in node.get("services", {}).get("edges", [])]
        projects.append({
            "id": node["id"],
            "name": node["name"],
            "services": services,
            "created": node.get("createdAt"),
            "updated": node.get("updatedAt"),
        })

    return projects


def delete_project(project_id: str, project_name: str, token: str):
    """Delete a Railway project."""
    mutation = """
    mutation deleteProject($id: String!) {
        projectDelete(id: $id)
    }
    """

    result = graphql_request(mutation, {"id": project_id}, token=token)

    if "errors" in result:
        return False, result["errors"]

    return True, None


def main():
    print("Railway Bulk Delete Tool")
    print("=" * 60)

    token = get_token()
    if not token:
        print("ERROR: No Railway token found.")
        print("Set RAILWAY_TOKEN environment variable or run 'railway login'")
        sys.exit(1)

    print("Fetching projects...")
    projects = get_all_projects(token)

    if not projects:
        print("No projects found or API error.")
        sys.exit(1)

    print(f"Found {len(projects)} projects\n")

    # Categorize projects
    to_delete = []
    to_keep = []

    for p in projects:
        name = p["name"]
        if name in PROJECTS_TO_KEEP:
            to_keep.append(p)
        elif name in PROJECTS_TO_DELETE or name.startswith("NA-"):
            to_delete.append(p)
        else:
            # Check if it matches random patterns
            patterns = ["wonderful-", "fabulous-", "noble-", "sincere-", "gregarious-",
                       "merry-", "fulfilling-", "discerning-", "steadfast-", "intuitive-",
                       "impartial-", "loyal-", "innovative-", "gentle-", "alert-",
                       "thriving-", "terrific-", "secure-"]
            if any(name.lower().startswith(p) for p in patterns):
                to_delete.append(p)
            else:
                to_keep.append(p)

    print("Projects to KEEP:")
    for p in to_keep:
        print(f"  ✓ {p['name']}")

    print(f"\nProjects to DELETE ({len(to_delete)}):")
    for p in to_delete:
        print(f"  ✗ {p['name']} (id: {p['id'][:8]}...)")

    if not to_delete:
        print("\nNothing to delete!")
        return

    print("\n" + "=" * 60)
    confirm = input(f"Delete {len(to_delete)} projects? Type 'DELETE' to confirm: ")

    if confirm != "DELETE":
        print("Aborted.")
        return

    print("\nDeleting projects...")
    deleted = 0
    failed = []

    for p in to_delete:
        print(f"  Deleting {p['name']}...", end=" ")
        success, error = delete_project(p["id"], p["name"], token)

        if success:
            print("✓")
            deleted += 1
        else:
            print(f"✗ {error}")
            failed.append(p["name"])

        time.sleep(0.5)  # Rate limiting

    print("\n" + "=" * 60)
    print(f"Deleted: {deleted}")
    print(f"Failed: {len(failed)}")

    if failed:
        print("\nFailed projects:")
        for name in failed:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
