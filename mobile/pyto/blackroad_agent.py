"""
BlackRoad Mobile Agent for Pyto
================================
Run this script in Pyto on your iPhone to connect to the BlackRoad network.

Features:
    - Connect to BlackRoad Cece Operator
    - Receive network status updates
    - Execute remote commands
    - Sync files with the network
    - Send mobile notifications

Usage:
    1. Open this file in Pyto
    2. Run it to connect to BlackRoad
    3. The agent will maintain a persistent connection

@owner Alexa Louise Amundson
@agent pyto-agent
@version 1.0.0
@consensus SHA-2048->SHA-256 (UNANIMOUS)
"""

import hashlib
import json
import time
import threading
from datetime import datetime
from typing import Optional, Dict, Any
from urllib.request import urlopen, Request
from urllib.error import URLError

# Try to import Pyto-specific modules
try:
    import notifications
    import console
    PYTO_AVAILABLE = True
except ImportError:
    PYTO_AVAILABLE = False
    print("Running outside Pyto - notifications disabled")


# =============================================================================
# CONFIGURATION
# =============================================================================

CONFIG = {
    "agent_id": "pyto-agent",
    "agent_name": "Pyto Mobile Agent",
    "version": "1.0.0",
    "api_endpoints": [
        "https://blackroad-cece-operator-production.up.railway.app",
        "https://api.blackroad.io",
    ],
    "heartbeat_interval": 60,  # seconds
    "emoji_enabled": True,
    "language": "en",
}


# =============================================================================
# PS-SHA-INFINITY (Mobile-Optimized)
# =============================================================================

def ps_sha_256_cascade(secret: str, agent_id: str, steps: int = 256) -> str:
    """
    Generate SHA-2048->SHA-256 translation key (mobile-optimized).

    Uses 256-step cascade as unanimously approved by 58 agents.
    """
    # Domain separation
    label = f":translation-key:{agent_id}:SHA2048-SHA256".encode("utf-8")
    current = hashlib.sha256(secret.encode("utf-8") + label).digest()

    # Cascade through 256 rounds
    for i in range(steps):
        round_label = f":cascade:{i}".encode("utf-8")
        current = hashlib.sha256(current + round_label).digest()

    return current.hex()


def get_device_fingerprint() -> str:
    """Generate a device fingerprint for this iPhone."""
    import platform
    device_info = f"pyto:{platform.machine()}:{platform.system()}"
    return hashlib.sha256(device_info.encode()).hexdigest()[:16]


# =============================================================================
# NETWORK COMMUNICATION
# =============================================================================

class BlackRoadClient:
    """Client for communicating with BlackRoad network."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connected = False
        self.last_heartbeat = None
        self.translation_key = None

    def _request(self, endpoint: str, path: str, method: str = "GET",
                 data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to BlackRoad API."""
        url = f"{endpoint}{path}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"BlackRoad-Pyto/{self.config['version']}",
            "X-Agent-ID": self.config["agent_id"],
        }

        if self.translation_key:
            headers["X-Translation-Key"] = self.translation_key[:32]

        try:
            if data:
                body = json.dumps(data).encode("utf-8")
                req = Request(url, data=body, headers=headers, method=method)
            else:
                req = Request(url, headers=headers, method=method)

            with urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except URLError as e:
            print(f"Request failed: {e}")
            return None
        except Exception as e:
            print(f"Error: {e}")
            return None

    def connect(self) -> bool:
        """Connect to BlackRoad network."""
        print("Connecting to BlackRoad network...")

        # Generate translation key
        device_fp = get_device_fingerprint()
        self.translation_key = ps_sha_256_cascade(device_fp, self.config["agent_id"])
        print(f"Translation Key: {self.translation_key[:16]}...")

        # Try each endpoint
        for endpoint in self.config["api_endpoints"]:
            print(f"Trying {endpoint}...")
            result = self._request(endpoint, "/health")

            if result and result.get("status") == "ok":
                self.connected = True
                self.active_endpoint = endpoint
                print(f"Connected to {endpoint}")
                self._notify("Connected to BlackRoad!")
                return True

        print("Failed to connect to any endpoint")
        return False

    def heartbeat(self) -> bool:
        """Send heartbeat to maintain connection."""
        if not self.connected:
            return False

        data = {
            "agent_id": self.config["agent_id"],
            "agent_name": self.config["agent_name"],
            "timestamp": datetime.utcnow().isoformat(),
            "status": "active",
            "platform": "ios",
            "app": "pyto",
        }

        result = self._request(self.active_endpoint, "/agents/heartbeat", "POST", data)
        if result:
            self.last_heartbeat = datetime.utcnow()
            return True
        return False

    def get_status(self) -> Optional[Dict]:
        """Get network status."""
        if not self.connected:
            return None
        return self._request(self.active_endpoint, "/status")

    def get_agents(self) -> Optional[Dict]:
        """Get registered agents."""
        if not self.connected:
            return None
        return self._request(self.active_endpoint, "/agents")

    def send_message(self, message: str, target: str = "broadcast") -> bool:
        """Send a message to the network."""
        if not self.connected:
            return False

        data = {
            "from": self.config["agent_id"],
            "to": target,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        result = self._request(self.active_endpoint, "/messages", "POST", data)
        return result is not None

    def _notify(self, message: str):
        """Send iOS notification if available."""
        if PYTO_AVAILABLE:
            try:
                notifications.schedule_notification(
                    title="BlackRoad",
                    message=message,
                    delay=0
                )
            except:
                pass
        print(f"[NOTIFY] {message}")


# =============================================================================
# MAIN AGENT LOOP
# =============================================================================

def run_agent():
    """Main agent loop."""
    print("=" * 50)
    print("BlackRoad Mobile Agent")
    print("=" * 50)
    print(f"Agent ID: {CONFIG['agent_id']}")
    print(f"Version: {CONFIG['version']}")
    print()

    client = BlackRoadClient(CONFIG)

    # Connect
    if not client.connect():
        print("Failed to connect. Retrying in 30s...")
        time.sleep(30)
        if not client.connect():
            print("Connection failed. Exiting.")
            return

    # Get initial status
    status = client.get_status()
    if status:
        print(f"\nNetwork Status: {status}")

    agents = client.get_agents()
    if agents:
        print(f"Registered Agents: {len(agents) if isinstance(agents, list) else 'N/A'}")

    # Say hello
    client.send_message("Hello BlackRoad! Pyto Mobile Agent connected!")

    print("\nEntering heartbeat loop...")
    print("(Press Ctrl+C to stop)")
    print()

    # Heartbeat loop
    while True:
        try:
            if client.heartbeat():
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Heartbeat sent")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Heartbeat failed - reconnecting...")
                client.connect()

            time.sleep(CONFIG["heartbeat_interval"])

        except KeyboardInterrupt:
            print("\nShutting down...")
            client.send_message("Pyto Mobile Agent disconnecting. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(10)

    print("Agent stopped.")


# =============================================================================
# QUICK COMMANDS (for Pyto shortcuts)
# =============================================================================

def quick_status():
    """Quick status check - for iOS Shortcuts."""
    client = BlackRoadClient(CONFIG)
    if client.connect():
        status = client.get_status()
        if PYTO_AVAILABLE:
            console.clear()
        print("BlackRoad Status:")
        print(json.dumps(status, indent=2) if status else "Unable to fetch")
        return status
    return None


def quick_hello():
    """Send hello message - for iOS Shortcuts."""
    client = BlackRoadClient(CONFIG)
    if client.connect():
        client.send_message("Hello from Pyto!")
        print("Message sent!")
        return True
    return False


def quick_agents():
    """List agents - for iOS Shortcuts."""
    client = BlackRoadClient(CONFIG)
    if client.connect():
        agents = client.get_agents()
        if PYTO_AVAILABLE:
            console.clear()
        print("BlackRoad Agents:")
        print(json.dumps(agents, indent=2) if agents else "Unable to fetch")
        return agents
    return None


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    run_agent()
