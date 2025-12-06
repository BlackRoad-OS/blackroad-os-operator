#!/usr/bin/env python3
"""
BlackRoad Browser Automation
Automates Cloudflare DNS and DigitalOcean tasks using Playwright
Uses persistent browser context for login sessions
"""

import asyncio
from playwright.async_api import async_playwright
import sys
import os

# Persistent browser data directory
USER_DATA_DIR = os.path.expanduser("~/.blackroad/browser-data")

async def main():
    print("Starting BlackRoad Browser Automation...")

    # Ensure user data directory exists
    os.makedirs(USER_DATA_DIR, exist_ok=True)

    async with async_playwright() as p:
        # Launch browser with persistent context (saves cookies/sessions)
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,  # Show the browser window
            slow_mo=300,  # Slow down actions for visibility
            viewport={"width": 1400, "height": 900},
            args=['--disable-blink-features=AutomationControlled']
        )

        page = context.pages[0] if context.pages else await context.new_page()

        task = sys.argv[1] if len(sys.argv) > 1 else "interactive"

        if task == "cloudflare":
            print("Opening Cloudflare DNS...")
            await page.goto("https://dash.cloudflare.com/848cf0b18d51e0170e0d1537aec3505a/blackroad.io/dns/records")
            print("Cloudflare DNS page opened. Add the DNS records manually.")
            print("\nRecords to add:")
            print("  1. CNAME: billing -> blackroad-stripe-billing.amundsonalexa.workers.dev")
            print("  2. CNAME: webhooks -> blackroad-stripe-webhooks.amundsonalexa.workers.dev")

        elif task == "digitalocean":
            print("Opening DigitalOcean...")
            await page.goto("https://cloud.digitalocean.com/account/api/tokens")
            print("DigitalOcean tokens page opened.")

        elif task == "do-droplets":
            print("Opening DigitalOcean Droplets...")
            await page.goto("https://cloud.digitalocean.com/droplets")
            print("DigitalOcean droplets page opened.")

        elif task == "both":
            print("Opening Cloudflare DNS...")
            await page.goto("https://dash.cloudflare.com/848cf0b18d51e0170e0d1537aec3505a/blackroad.io/dns/records")
            await asyncio.sleep(3)

            # Open DO in new tab
            do_page = await context.new_page()
            print("Opening DigitalOcean...")
            await do_page.goto("https://cloud.digitalocean.com/droplets")
            print("Both pages opened!")

        else:
            print("Interactive mode - opening Cloudflare DNS")
            await page.goto("https://dash.cloudflare.com/848cf0b18d51e0170e0d1537aec3505a/blackroad.io/dns/records")

        # Keep browser open
        print("\n✅ Browser is open. Press Enter when done to close...")
        input()

        await context.close()

if __name__ == "__main__":
    print("Usage: python browser_automation.py [cloudflare|digitalocean|do-droplets|both]")
    asyncio.run(main())
