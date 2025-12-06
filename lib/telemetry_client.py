"""
BlackRoad Telemetry Client
"All roads lead to BlackRoad"

Drop-in HTTP wrapper that reports all outbound calls to telemetry service.

Usage:
    from lib.telemetry_client import traced_request

    resp = traced_request("GET", "https://api.example.com/data")
    # Your normal logic here

Environment Variables:
    BLACKROAD_TELEMETRY_URL - Telemetry service URL (default: https://telemetry.blackroad.io)
    SERVICE_NAME - Name of this service for identification
    BLACKROAD_AGENT_DID - Optional DID for agent identification

@owner Alexa Louise Amundson
@system BlackRoad OS
"""

import os
import time
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import Optional, Dict, Any

try:
    import httpx
    HTTP_CLIENT = "httpx"
except ImportError:
    import requests
    HTTP_CLIENT = "requests"

TELEMETRY_URL = os.getenv(
    "BLACKROAD_TELEMETRY_URL",
    "https://blackroad-telemetry.amundsonalexa.workers.dev"
)

# Known "big tech" hosts - calls to these are expected
KNOWN_GIANTS = {
    # Google
    "google.com", "googleapis.com", "googleusercontent.com", "gstatic.com",
    "youtube.com", "ytimg.com", "googlevideo.com", "google-analytics.com",
    # OpenAI
    "openai.com", "api.openai.com",
    # Anthropic
    "anthropic.com", "api.anthropic.com",
    # Microsoft / Azure
    "microsoft.com", "azure.com", "windows.net", "msn.com", "bing.com",
    "live.com", "office.com", "github.com", "githubusercontent.com",
    # Amazon
    "amazonaws.com", "amazon.com", "cloudfront.net", "awsstatic.com",
    # Cloudflare
    "cloudflare.com", "cloudflare-dns.com", "workers.dev",
    # Meta
    "facebook.com", "instagram.com", "fbcdn.net", "meta.com",
    # Apple
    "apple.com", "icloud.com", "mzstatic.com",
    # Stripe
    "stripe.com", "stripe.network",
    # Vercel / Railway
    "vercel.app", "vercel.com", "railway.app",
    # HuggingFace
    "huggingface.co", "hf.co",
    # BlackRoad (internal)
    "blackroad.io", "blackroad.systems", "blackroadai.com",
    "lucidia.earth", "lucidia.studio", "amundsonalexa.workers.dev",
}


def extract_root_domain(hostname: str) -> str:
    """Extract root domain from hostname."""
    parts = hostname.split(".")
    if len(parts) <= 2:
        return hostname
    return ".".join(parts[-2:])


def is_new_internet(host: str) -> bool:
    """Check if host is outside known big tech ecosystem."""
    root = extract_root_domain(host.lower())
    return root not in KNOWN_GIANTS and host.lower() not in KNOWN_GIANTS


def send_telemetry(event: Dict[str, Any]) -> None:
    """Send telemetry event (fire and forget)."""
    try:
        if HTTP_CLIENT == "httpx":
            httpx.post(
                f"{TELEMETRY_URL}/v1/telemetry/http-call",
                json=event,
                timeout=1.0,
            )
        else:
            requests.post(
                f"{TELEMETRY_URL}/v1/telemetry/http-call",
                json=event,
                timeout=1.0,
            )
    except Exception:
        # Never break the app if telemetry is down
        pass


def traced_request(
    method: str,
    url: str,
    service_name: Optional[str] = None,
    **kwargs
):
    """
    Make an HTTP request with automatic telemetry reporting.

    Args:
        method: HTTP method (GET, POST, etc.)
        url: Full URL to request
        service_name: Override SERVICE_NAME env var
        **kwargs: Passed to httpx.request or requests.request

    Returns:
        Response object (httpx.Response or requests.Response)
    """
    host = urlparse(url).hostname or ""
    t0 = time.time()

    # Make the actual request
    if HTTP_CLIENT == "httpx":
        resp = httpx.request(method, url, **kwargs)
    else:
        resp = requests.request(method, url, **kwargs)

    t1 = time.time()

    # Build telemetry event
    event = {
        "service": service_name or os.getenv("SERVICE_NAME", "unknown-service"),
        "url": url,
        "host": host,
        "method": method.upper(),
        "status": resp.status_code,
        "latency_ms": int((t1 - t0) * 1000),
        "timestamp": int(time.time() * 1000),
        "is_new_internet": is_new_internet(host),
        "agent_did": os.getenv("BLACKROAD_AGENT_DID"),
    }

    # Send telemetry (async/fire-and-forget)
    send_telemetry(event)

    return resp


def traced_get(url: str, **kwargs):
    """Convenience wrapper for GET requests."""
    return traced_request("GET", url, **kwargs)


def traced_post(url: str, **kwargs):
    """Convenience wrapper for POST requests."""
    return traced_request("POST", url, **kwargs)


class TracedClient:
    """
    HTTP client with built-in telemetry.

    Usage:
        client = TracedClient(service_name="my-agent")
        resp = client.get("https://api.example.com")
    """

    def __init__(self, service_name: Optional[str] = None):
        self.service_name = service_name or os.getenv("SERVICE_NAME", "unknown-service")

    def request(self, method: str, url: str, **kwargs):
        return traced_request(method, url, service_name=self.service_name, **kwargs)

    def get(self, url: str, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.request("POST", url, **kwargs)

    def put(self, url: str, **kwargs):
        return self.request("PUT", url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.request("DELETE", url, **kwargs)

    def patch(self, url: str, **kwargs):
        return self.request("PATCH", url, **kwargs)


# Example usage when run directly
if __name__ == "__main__":
    print("BlackRoad Telemetry Client")
    print(f"Telemetry URL: {TELEMETRY_URL}")
    print(f"HTTP Client: {HTTP_CLIENT}")
    print()

    # Test with a known host
    print("Testing known host (google.com)...")
    resp = traced_get("https://google.com")
    print(f"  Status: {resp.status_code}")

    # Test with a "new internet" host
    print("Testing new internet host (example-unknown.xyz)...")
    try:
        resp = traced_get("https://example-unknown.xyz", timeout=2)
    except Exception as e:
        print(f"  Expected error: {type(e).__name__}")

    print()
    print("Done! Check telemetry dashboard at:")
    print(f"  {TELEMETRY_URL}/v1/telemetry/recent")
