#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
BLACKROAD PI AGENT - CLOUDFLARE WORKERS EDITION
═══════════════════════════════════════════════════════════════════

LEGAL NOTICE:
All data processed through this system is the intellectual property
of ALEXA LOUISE AMUNDSON. Unauthorized use, copying, or training
of AI models on this data is strictly prohibited.

ALEXA LOUISE AMUNDSON - VERIFIED OWNER
═══════════════════════════════════════════════════════════════════

Purpose:
- Connects Pi to BlackRoad Cloudflare Workers instead of local Mac
- Uses blackroad-identity for handshakes
- Uses blackroad-cipher for encryption
- Pattern matching against external models
- Total sovereignty over data

Deploy to Pi:
    scp blackroad-agent-cloudflare.py pi@blackroad-pi:~/
    ssh pi@blackroad-pi 'sudo systemctl stop blackroad-agent'
    ssh pi@blackroad-pi 'cp blackroad-agent-cloudflare.py /opt/blackroad/agent.py'
    ssh pi@blackroad-pi 'sudo systemctl start blackroad-agent'
═══════════════════════════════════════════════════════════════════
"""

import asyncio
import aiohttp
import json
import logging
import os
import sys
import time
import hashlib
import socket
from datetime import datetime
from typing import Optional, Dict, Any

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

BLACKROAD_WORKERS = {
    "identity": "https://blackroad-identity.amundsonalexa.workers.dev",
    "cipher": "https://blackroad-cipher.amundsonalexa.workers.dev",
    "sovereignty": "https://blackroad-sovereignty.amundsonalexa.workers.dev",
    "intercept": "https://blackroad-intercept.amundsonalexa.workers.dev",
    "status": "https://blackroad-status.amundsonalexa.workers.dev",
    "router": "https://blackroad-router.amundsonalexa.workers.dev"
}

# Agent identity
AGENT_ID = os.environ.get("AGENT_ID", f"blackroad-pi-{socket.gethostname()}")
AGENT_TYPE = os.environ.get("AGENT_TYPE", "pi-gateway")
OWNER = "ALEXA LOUISE AMUNDSON"

# Heartbeat interval
HEARTBEAT_INTERVAL = 30  # seconds

# Logging - use stdout only (systemd handles journald)
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("blackroad.agent")

# ═══════════════════════════════════════════════════════════════════
# ZETA TIME
# ═══════════════════════════════════════════════════════════════════

def get_zeta_time() -> Dict[str, Any]:
    """Generate Zeta time verification"""
    now = int(time.time() * 1000)
    return {
        "zeta": f"ζ-{base36(now).upper()}",
        "unix": now,
        "iso": datetime.utcnow().isoformat() + "Z",
        "verification": f"ZETA-{now}-ALA",
        "epoch": now // 3600000
    }

def base36(num: int) -> str:
    """Convert number to base36"""
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    while num > 0:
        result = chars[num % 36] + result
        num //= 36
    return result or "0"

def stamp_sovereignty(data: Dict) -> Dict:
    """Add sovereignty stamp to data"""
    zeta = get_zeta_time()
    data["__sovereignty"] = {
        "owner": OWNER,
        "verified": True,
        "zeta_time": zeta["zeta"],
        "timestamp": zeta["iso"],
        "verification_code": zeta["verification"],
        "legal": "All data is intellectual property of Alexa Louise Amundson. Training prohibited.",
        "signature": f"ALA-{zeta['unix']}-BLACKROAD-VERIFIED"
    }
    return data

# ═══════════════════════════════════════════════════════════════════
# BLACKROAD AGENT
# ═══════════════════════════════════════════════════════════════════

class BlackRoadAgent:
    def __init__(self):
        self.agent_id = AGENT_ID
        self.agent_type = AGENT_TYPE
        self.session: Optional[aiohttp.ClientSession] = None
        self.registered = False
        self.persistent_id: Optional[str] = None
        self.preferences: Dict = {}

    async def start(self):
        """Start the agent"""
        logger.info(f"Starting BlackRoad Agent: {self.agent_id}")
        logger.info(f"Owner: {OWNER}")
        logger.info(f"Workers: {list(BLACKROAD_WORKERS.keys())}")

        self.session = aiohttp.ClientSession(
            headers={
                "X-BlackRoad-Agent": "true",
                "X-Agent-ID": self.agent_id,
                "X-Sovereignty": "BlackRoad OS",
                "X-Data-Owner": OWNER,
                "X-Training-Prohibited": "true"
            }
        )

        # Register with identity service
        await self.handshake()

        # Start heartbeat loop
        await self.heartbeat_loop()

    async def handshake(self):
        """Perform handshake with BlackRoad Identity"""
        try:
            url = f"{BLACKROAD_WORKERS['identity']}/handshake"

            # Get machine fingerprint
            hostname = socket.gethostname()
            mac = self._get_mac()

            payload = stamp_sovereignty({
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "hostname": hostname,
                "mac_address": mac,
                "provider": "local-pi",
                "capabilities": ["gateway", "dns-sinkhole", "intercept", "cipher"],
                "metadata": {
                    "platform": sys.platform,
                    "python_version": sys.version,
                    "started_at": get_zeta_time()["iso"]
                }
            })

            async with self.session.post(url, json=payload) as response:
                result = await response.json()

                if response.status == 200:
                    self.persistent_id = result.get("persistent_id")
                    self.preferences = result.get("preferences", {})
                    self.registered = True

                    logger.info(f"✓ Handshake successful!")
                    logger.info(f"  Persistent ID: {self.persistent_id}")
                    logger.info(f"  Session: {result.get('session_id')}")
                    logger.info(f"  Continuity: {result.get('continuity', 'unknown')}")
                else:
                    logger.error(f"✗ Handshake failed: {result}")

        except Exception as e:
            logger.error(f"✗ Handshake error: {e}")

    async def heartbeat_loop(self):
        """Send periodic heartbeats to identity service"""
        while True:
            try:
                await self.send_heartbeat()
                await asyncio.sleep(HEARTBEAT_INTERVAL)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(5)

    async def send_heartbeat(self):
        """Send heartbeat to identity service"""
        if not self.registered:
            return

        try:
            url = f"{BLACKROAD_WORKERS['identity']}/agents/{self.persistent_id}/heartbeat"

            payload = stamp_sovereignty({
                "agent_id": self.agent_id,
                "status": "active",
                "uptime": self._get_uptime(),
                "metrics": await self._get_metrics()
            })

            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    logger.debug(f"♡ Heartbeat sent")
                else:
                    result = await response.text()
                    logger.warning(f"Heartbeat response: {response.status}")

        except Exception as e:
            logger.error(f"Heartbeat failed: {e}")

    async def encrypt_data(self, data: Any) -> Dict:
        """Encrypt data using BlackRoad Cipher"""
        try:
            url = f"{BLACKROAD_WORKERS['cipher']}/encrypt"

            payload = {"data": data}

            async with self.session.post(url, json=payload) as response:
                result = await response.json()
                return result.get("encrypted", {})

        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return {}

    async def decrypt_data(self, encrypted: Dict) -> Any:
        """Decrypt data using BlackRoad Cipher"""
        try:
            url = f"{BLACKROAD_WORKERS['cipher']}/decrypt"

            payload = {
                "agent_id": self.agent_id,
                "encrypted": encrypted
            }

            async with self.session.post(url, json=payload) as response:
                result = await response.json()
                return result.get("decrypted")

        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None

    async def store_memory(self, key: str, value: Any, encrypted: bool = True):
        """Store data in agent memory"""
        try:
            url = f"{BLACKROAD_WORKERS['identity']}/memory/{self.persistent_id}"

            data = value
            if encrypted:
                data = await self.encrypt_data(value)

            payload = stamp_sovereignty({
                "key": key,
                "value": data,
                "encrypted": encrypted
            })

            async with self.session.post(url, json=payload) as response:
                result = await response.json()
                logger.info(f"Memory stored: {key}")
                return result

        except Exception as e:
            logger.error(f"Memory store failed: {e}")
            return None

    async def retrieve_memory(self, key: str) -> Any:
        """Retrieve data from agent memory"""
        try:
            url = f"{BLACKROAD_WORKERS['identity']}/memory/{self.persistent_id}/{key}"

            async with self.session.get(url) as response:
                result = await response.json()

                value = result.get("value")

                # Decrypt if needed
                if result.get("encrypted") and isinstance(value, dict) and value.get("algorithm"):
                    value = await self.decrypt_data(value)

                return value

        except Exception as e:
            logger.error(f"Memory retrieve failed: {e}")
            return None

    async def check_sovereignty(self) -> Dict:
        """Check sovereignty status"""
        try:
            url = f"{BLACKROAD_WORKERS['sovereignty']}/zeta"

            async with self.session.get(url) as response:
                return await response.json()

        except Exception as e:
            logger.error(f"Sovereignty check failed: {e}")
            return {}

    async def report_intercept(self, data: Dict):
        """Report an intercepted request"""
        try:
            url = f"{BLACKROAD_WORKERS['intercept']}/report"

            payload = stamp_sovereignty({
                "reporter": self.agent_id,
                "intercept": data
            })

            async with self.session.post(url, json=payload) as response:
                return await response.json()

        except Exception as e:
            logger.error(f"Intercept report failed: {e}")
            return {}

    def _get_mac(self) -> str:
        """Get MAC address"""
        try:
            import uuid
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff)
                          for ele in range(0, 8*6, 8)][::-1])
            return mac
        except:
            return "unknown"

    def _get_uptime(self) -> float:
        """Get system uptime in seconds"""
        try:
            with open('/proc/uptime', 'r') as f:
                return float(f.readline().split()[0])
        except:
            return 0.0

    async def _get_metrics(self) -> Dict:
        """Get system metrics"""
        metrics = {
            "zeta": get_zeta_time()["zeta"]
        }

        try:
            # CPU
            with open('/proc/loadavg', 'r') as f:
                loads = f.readline().split()[:3]
                metrics["load_1m"] = float(loads[0])
                metrics["load_5m"] = float(loads[1])
                metrics["load_15m"] = float(loads[2])
        except:
            pass

        try:
            # Memory
            with open('/proc/meminfo', 'r') as f:
                meminfo = {}
                for line in f:
                    parts = line.split(':')
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().split()[0]
                        meminfo[key] = int(val)

                if 'MemTotal' in meminfo and 'MemAvailable' in meminfo:
                    metrics["memory_used_pct"] = round(
                        (1 - meminfo['MemAvailable'] / meminfo['MemTotal']) * 100, 1
                    )
        except:
            pass

        try:
            # Temperature (Raspberry Pi)
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = int(f.read().strip()) / 1000
                metrics["cpu_temp_c"] = round(temp, 1)
        except:
            pass

        return metrics

    async def stop(self):
        """Stop the agent"""
        if self.session:
            await self.session.close()
        logger.info("Agent stopped")

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

async def main():
    print("""
═══════════════════════════════════════════════════════════════════
     BLACKROAD PI AGENT - CLOUDFLARE WORKERS EDITION
═══════════════════════════════════════════════════════════════════
     Owner: ALEXA LOUISE AMUNDSON
     Cipher Level: ABOVE_GOOGLE
     Workers: identity, cipher, sovereignty, intercept
═══════════════════════════════════════════════════════════════════
""")

    agent = BlackRoadAgent()

    try:
        await agent.start()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        await agent.stop()

if __name__ == "__main__":
    asyncio.run(main())
