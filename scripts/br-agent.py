#!/usr/bin/env python3
"""br-agent - BlackRoad OS Agent for machine orchestration.

This agent runs on each machine (MacBook, Pi, VPS, etc.) and:
1. Connects to the Operator hub
2. Registers its capabilities
3. Listens for commands (deploy, restart, etc.)
4. Executes actions and reports results

Usage:
    python br-agent.py --config ~/blackroad-agent/config.yaml

Or with environment variables:
    OPERATOR_URL=https://operator.blackroad.systems BR_AGENT_ID=mac-main python br-agent.py

@amundson 0.1.0
@operator alexa.operator.v1
"""

import argparse
import asyncio
import logging
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("br-agent")


# ============================================
# CONFIGURATION
# ============================================

@dataclass
class ActionConfig:
    """Configuration for a single action."""
    name: str
    cwd: str = "."
    steps: List[str] = field(default_factory=list)
    timeout: int = 300  # seconds
    env: Dict[str, str] = field(default_factory=dict)


@dataclass
class AgentConfig:
    """Agent configuration loaded from YAML."""
    agent_id: str
    machine_id: str
    operator_url: str
    heartbeat_interval: int = 30  # seconds
    reconnect_delay: int = 5  # seconds
    actions: Dict[str, ActionConfig] = field(default_factory=dict)
    capabilities: List[str] = field(default_factory=list)
    auth_token: Optional[str] = None


def load_config(config_path: Optional[str] = None) -> AgentConfig:
    """Load configuration from YAML file or environment."""

    # Try to load from file
    if config_path and Path(config_path).exists():
        with open(config_path) as f:
            data = yaml.safe_load(f)

        actions = {}
        for name, action_data in data.get("actions", {}).items():
            actions[name] = ActionConfig(
                name=name,
                cwd=action_data.get("cwd", "."),
                steps=action_data.get("steps", []),
                timeout=action_data.get("timeout", 300),
                env=action_data.get("env", {}),
            )

        return AgentConfig(
            agent_id=data.get("agent_id", os.getenv("BR_AGENT_ID", "unknown")),
            machine_id=data.get("machine_id", os.getenv("BR_MACHINE_ID", "unknown")),
            operator_url=data.get("operator_url", os.getenv("OPERATOR_URL", "http://localhost:8080")),
            heartbeat_interval=data.get("heartbeat_interval", 30),
            reconnect_delay=data.get("reconnect_delay", 5),
            actions=actions,
            capabilities=data.get("capabilities", list(actions.keys())),
            auth_token=data.get("auth_token", os.getenv("BR_AUTH_TOKEN")),
        )

    # Fall back to environment variables
    return AgentConfig(
        agent_id=os.getenv("BR_AGENT_ID", "unknown"),
        machine_id=os.getenv("BR_MACHINE_ID", "unknown"),
        operator_url=os.getenv("OPERATOR_URL", "http://localhost:8080"),
        auth_token=os.getenv("BR_AUTH_TOKEN"),
    )


# ============================================
# ACTION EXECUTOR
# ============================================

class ActionExecutor:
    """Executes configured actions on the machine."""

    def __init__(self, config: AgentConfig):
        self.config = config

    async def execute(self, action_name: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute an action by name."""
        if action_name not in self.config.actions:
            return {
                "success": False,
                "error": f"Unknown action: {action_name}",
                "action": action_name,
            }

        action = self.config.actions[action_name]
        logger.info(f"Executing action: {action_name}")

        results = []
        start_time = time.time()

        try:
            for i, step in enumerate(action.steps, 1):
                logger.info(f"  Step {i}/{len(action.steps)}: {step}")

                # Expand environment variables in step
                expanded_step = os.path.expandvars(step)

                # Run the command
                process = await asyncio.create_subprocess_shell(
                    expanded_step,
                    cwd=os.path.expanduser(action.cwd),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={**os.environ, **action.env},
                )

                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=action.timeout,
                    )
                except asyncio.TimeoutError:
                    process.kill()
                    return {
                        "success": False,
                        "error": f"Step {i} timed out after {action.timeout}s",
                        "action": action_name,
                        "step": i,
                        "command": step,
                    }

                step_result = {
                    "step": i,
                    "command": step,
                    "exit_code": process.returncode,
                    "stdout": stdout.decode()[-500:] if stdout else "",  # Last 500 chars
                    "stderr": stderr.decode()[-500:] if stderr else "",
                }
                results.append(step_result)

                if process.returncode != 0:
                    logger.error(f"  Step {i} failed with exit code {process.returncode}")
                    return {
                        "success": False,
                        "error": f"Step {i} failed: {stderr.decode()[:200]}",
                        "action": action_name,
                        "results": results,
                        "duration_ms": int((time.time() - start_time) * 1000),
                    }

                logger.info(f"  Step {i} completed successfully")

            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Action {action_name} completed in {duration_ms}ms")

            return {
                "success": True,
                "action": action_name,
                "results": results,
                "duration_ms": duration_ms,
            }

        except Exception as e:
            logger.exception(f"Action {action_name} failed with exception")
            return {
                "success": False,
                "error": str(e),
                "action": action_name,
                "duration_ms": int((time.time() - start_time) * 1000),
            }


# ============================================
# AGENT
# ============================================

class BRAgent:
    """Main agent that connects to Operator and executes commands."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.executor = ActionExecutor(config)
        self.running = False
        self.session: Optional[aiohttp.ClientSession] = None

    def _headers(self) -> Dict[str, str]:
        """Build request headers with auth if configured."""
        headers = {"Content-Type": "application/json"}
        if self.config.auth_token:
            headers["Authorization"] = f"Bearer {self.config.auth_token}"
        return headers

    async def register(self) -> bool:
        """Register with the Operator."""
        try:
            url = f"{self.config.operator_url}/v1/agents/register"
            payload = {
                "agent_id": self.config.agent_id,
                "machine_id": self.config.machine_id,
                "capabilities": self.config.capabilities,
                "actions": {
                    name: {"steps": len(action.steps), "cwd": action.cwd}
                    for name, action in self.config.actions.items()
                },
            }

            async with self.session.post(url, json=payload, headers=self._headers()) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"Registered with Operator: {self.config.agent_id}")
                    return True
                else:
                    logger.error(f"Failed to register: {resp.status} - {await resp.text()}")
                    return False

        except Exception as e:
            logger.error(f"Registration failed: {e}")
            return False

    async def heartbeat(self) -> bool:
        """Send heartbeat to Operator."""
        try:
            url = f"{self.config.operator_url}/v1/agents/{self.config.agent_id}/heartbeat"
            async with self.session.post(url, headers=self._headers()) as resp:
                return resp.status == 200
        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")
            return False

    async def heartbeat_loop(self):
        """Continuously send heartbeats."""
        while self.running:
            await self.heartbeat()
            await asyncio.sleep(self.config.heartbeat_interval)

    async def poll_commands(self):
        """Poll for commands from Operator.

        In production, this would be a WebSocket connection.
        For now, we poll a command queue endpoint.
        """
        while self.running:
            try:
                url = f"{self.config.operator_url}/v1/agents/{self.config.agent_id}/commands"
                async with self.session.get(url, headers=self._headers()) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        commands = data.get("commands", [])

                        for cmd in commands:
                            action = cmd.get("action")
                            params = cmd.get("params", {})
                            command_id = cmd.get("id")

                            logger.info(f"Received command: {action}")
                            result = await self.executor.execute(action, params)

                            # Report result back
                            await self.report_result(command_id, result)

            except Exception as e:
                logger.debug(f"Poll error (expected if endpoint doesn't exist yet): {e}")

            await asyncio.sleep(5)  # Poll every 5 seconds

    async def report_result(self, command_id: str, result: Dict[str, Any]):
        """Report command execution result to Operator."""
        try:
            url = f"{self.config.operator_url}/v1/agents/{self.config.agent_id}/results"
            payload = {
                "command_id": command_id,
                "result": result,
            }
            async with self.session.post(url, json=payload, headers=self._headers()) as resp:
                if resp.status != 200:
                    logger.warning(f"Failed to report result: {resp.status}")
        except Exception as e:
            logger.warning(f"Failed to report result: {e}")

    async def run(self):
        """Main agent loop."""
        self.running = True

        # Create session
        self.session = aiohttp.ClientSession()

        try:
            # Register with Operator
            while self.running:
                if await self.register():
                    break
                logger.info(f"Retrying registration in {self.config.reconnect_delay}s...")
                await asyncio.sleep(self.config.reconnect_delay)

            if not self.running:
                return

            # Start background tasks
            heartbeat_task = asyncio.create_task(self.heartbeat_loop())
            poll_task = asyncio.create_task(self.poll_commands())

            logger.info(f"Agent {self.config.agent_id} running. Press Ctrl+C to stop.")

            # Wait for shutdown
            while self.running:
                await asyncio.sleep(1)

            # Cancel tasks
            heartbeat_task.cancel()
            poll_task.cancel()

        finally:
            await self.session.close()
            logger.info("Agent stopped.")

    def stop(self):
        """Stop the agent."""
        logger.info("Stopping agent...")
        self.running = False


# ============================================
# CLI
# ============================================

def main():
    parser = argparse.ArgumentParser(description="BlackRoad OS Agent")
    parser.add_argument(
        "--config", "-c",
        help="Path to config file (default: ~/blackroad-agent/config.yaml)",
        default=os.path.expanduser("~/blackroad-agent/config.yaml"),
    )
    parser.add_argument(
        "--agent-id",
        help="Override agent ID",
        default=None,
    )
    parser.add_argument(
        "--operator-url",
        help="Override operator URL",
        default=None,
    )
    parser.add_argument(
        "--test-action",
        help="Test an action locally without connecting to Operator",
        default=None,
    )
    args = parser.parse_args()

    # Load config
    config = load_config(args.config)

    # Apply overrides
    if args.agent_id:
        config.agent_id = args.agent_id
    if args.operator_url:
        config.operator_url = args.operator_url

    logger.info(f"Agent ID: {config.agent_id}")
    logger.info(f"Machine ID: {config.machine_id}")
    logger.info(f"Operator URL: {config.operator_url}")
    logger.info(f"Actions: {list(config.actions.keys())}")

    # Test mode: run single action
    if args.test_action:
        executor = ActionExecutor(config)
        result = asyncio.run(executor.execute(args.test_action))
        print(f"\nResult: {result}")
        sys.exit(0 if result.get("success") else 1)

    # Create agent
    agent = BRAgent(config)

    # Handle signals
    def handle_signal(sig, frame):
        agent.stop()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    # Run agent
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
