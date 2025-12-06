"""
Traced HTTP Client for BlackRoad OS Operator
"All roads lead to BlackRoad"

Wraps httpx with automatic telemetry reporting to the BlackRoad radar.
Every outbound HTTP call is logged to the telemetry service.

@owner Alexa Louise Amundson
@system BlackRoad OS
"""

from __future__ import annotations

import os
import time
from urllib.parse import urlparse
from typing import Any, Optional

import httpx

# Telemetry configuration
TELEMETRY_URL = os.getenv(
    "BLACKROAD_TELEMETRY_URL",
    "https://blackroad-telemetry.amundsonalexa.workers.dev"
)
SERVICE_NAME = os.getenv("SERVICE_NAME", "cece-operator")
AGENT_DID = os.getenv("BLACKROAD_AGENT_DID")
TELEMETRY_ENABLED = os.getenv("BLACKROAD_TELEMETRY_ENABLED", "true").lower() == "true"

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
    "vercel.app", "vercel.com", "railway.app", "railway.internal",
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


async def send_telemetry_async(event: dict) -> None:
    """Send telemetry event asynchronously (fire and forget)."""
    if not TELEMETRY_ENABLED:
        return
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            await client.post(
                f"{TELEMETRY_URL}/v1/telemetry/http-call",
                json=event,
            )
    except Exception:
        # Never break the app if telemetry is down
        pass


def send_telemetry_sync(event: dict) -> None:
    """Send telemetry event synchronously (fire and forget)."""
    if not TELEMETRY_ENABLED:
        return
    try:
        httpx.post(
            f"{TELEMETRY_URL}/v1/telemetry/http-call",
            json=event,
            timeout=1.0,
        )
    except Exception:
        # Never break the app if telemetry is down
        pass


class TracedAsyncClient(httpx.AsyncClient):
    """
    AsyncClient with built-in telemetry reporting.

    Usage:
        async with TracedAsyncClient() as client:
            response = await client.get("https://api.example.com")
    """

    def __init__(self, service_name: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.service_name = service_name or SERVICE_NAME

    async def request(
        self,
        method: str,
        url: Any,
        **kwargs,
    ) -> httpx.Response:
        """Make request with telemetry."""
        url_str = str(url)
        host = urlparse(url_str).hostname or ""
        t0 = time.time()

        # Make the actual request
        response = await super().request(method, url, **kwargs)

        t1 = time.time()
        latency_ms = int((t1 - t0) * 1000)

        # Build telemetry event
        event = {
            "service": self.service_name,
            "url": url_str,
            "host": host,
            "method": method.upper(),
            "status": response.status_code,
            "latency_ms": latency_ms,
            "timestamp": int(time.time() * 1000),
            "is_new_internet": is_new_internet(host),
            "agent_did": AGENT_DID,
        }

        # Fire and forget telemetry
        # Using create_task would be cleaner but this keeps it simple
        await send_telemetry_async(event)

        return response


class TracedClient(httpx.Client):
    """
    Sync Client with built-in telemetry reporting.

    Usage:
        with TracedClient() as client:
            response = client.get("https://api.example.com")
    """

    def __init__(self, service_name: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.service_name = service_name or SERVICE_NAME

    def request(
        self,
        method: str,
        url: Any,
        **kwargs,
    ) -> httpx.Response:
        """Make request with telemetry."""
        url_str = str(url)
        host = urlparse(url_str).hostname or ""
        t0 = time.time()

        # Make the actual request
        response = super().request(method, url, **kwargs)

        t1 = time.time()
        latency_ms = int((t1 - t0) * 1000)

        # Build telemetry event
        event = {
            "service": self.service_name,
            "url": url_str,
            "host": host,
            "method": method.upper(),
            "status": response.status_code,
            "latency_ms": latency_ms,
            "timestamp": int(time.time() * 1000),
            "is_new_internet": is_new_internet(host),
            "agent_did": AGENT_DID,
        }

        # Fire and forget telemetry (sync version)
        send_telemetry_sync(event)

        return response


# Convenience function for async context
async def traced_request(
    method: str,
    url: str,
    service_name: Optional[str] = None,
    **kwargs,
) -> httpx.Response:
    """
    Make an async HTTP request with automatic telemetry.

    Args:
        method: HTTP method (GET, POST, etc.)
        url: Full URL to request
        service_name: Override SERVICE_NAME env var
        **kwargs: Passed to httpx.AsyncClient.request

    Returns:
        httpx.Response
    """
    async with TracedAsyncClient(service_name=service_name) as client:
        return await client.request(method, url, **kwargs)


async def traced_get(url: str, **kwargs) -> httpx.Response:
    """Convenience wrapper for GET requests."""
    return await traced_request("GET", url, **kwargs)


async def traced_post(url: str, **kwargs) -> httpx.Response:
    """Convenience wrapper for POST requests."""
    return await traced_request("POST", url, **kwargs)
