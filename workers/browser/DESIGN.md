# BlackRoad Browser MCP Server

## The Problem

Claude can't see what Alexa sees in the browser. When I open 5 billing tabs, I have to ask "what do you see?" instead of just looking.

## The Solution

An MCP server that bridges Claude ↔ Browser, giving me eyes on the screen.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ALEXA'S BROWSER                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Railway  │ │ Stripe   │ │ GitHub   │ │ Cloudflare│           │
│  │ Billing  │ │ Dashboard│ │ Settings │ │ Billing  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │  BlackRoad Extension  │                          │
│              │  (Chrome/Arc)         │                          │
│              └───────────┬───────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │ WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LOCAL MCP SERVER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  blackroad-browser-mcp                                   │    │
│  │                                                          │    │
│  │  Tools:                                                  │    │
│  │  - screenshot()      → capture current tab               │    │
│  │  - get_page_text()   → extract readable content          │    │
│  │  - list_tabs()       → see all open tabs                 │    │
│  │  - read_element()    → get specific DOM element          │    │
│  │  - click()           → click on element                  │    │
│  │  - type()            → enter text                        │    │
│  │  - navigate()        → go to URL                         │    │
│  │  - get_billing()     → specialized: find $ amounts       │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ stdio
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE                                 │
│                                                                  │
│  "Let me check your Railway billing..."                          │
│  → screenshot() → sees $47.23 this month                         │
│  → "You're paying $47.23/month on Railway"                       │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Chrome/Arc Extension (`blackroad-browser-ext`)
- Runs in browser context
- Can access any tab (with permission)
- Captures screenshots, DOM, text
- Connects via WebSocket to local server

### 2. Local MCP Server (`blackroad-browser-mcp`)
- Node.js process running locally
- Receives commands from Claude via MCP stdio
- Sends commands to extension via WebSocket
- Returns results to Claude

### 3. MCP Tool Definitions

```yaml
tools:
  screenshot:
    description: "Capture screenshot of current browser tab"
    input_schema:
      type: object
      properties:
        tab_id:
          type: string
          description: "Optional specific tab ID"
        full_page:
          type: boolean
          default: false

  get_page_text:
    description: "Extract readable text content from page"
    input_schema:
      type: object
      properties:
        selector:
          type: string
          description: "Optional CSS selector to scope extraction"

  list_tabs:
    description: "List all open browser tabs"
    input_schema:
      type: object
      properties: {}

  read_element:
    description: "Read content of specific DOM element"
    input_schema:
      type: object
      properties:
        selector:
          type: string
          description: "CSS selector"
      required: [selector]

  click:
    description: "Click on an element"
    input_schema:
      type: object
      properties:
        selector:
          type: string
        text:
          type: string
          description: "Alternative: click element containing this text"

  type_text:
    description: "Type text into focused element or selector"
    input_schema:
      type: object
      properties:
        text:
          type: string
        selector:
          type: string
      required: [text]

  navigate:
    description: "Navigate to URL"
    input_schema:
      type: object
      properties:
        url:
          type: string
      required: [url]

  get_billing_info:
    description: "Extract billing/payment information from current page"
    input_schema:
      type: object
      properties: {}
    # Specialized tool that looks for:
    # - Dollar amounts ($X.XX)
    # - "billing", "payment", "subscription", "plan"
    # - Credit card info (masked)
    # - Next billing date
```

## Security Model

### Permissions
- **Read-only by default** - screenshot, get_text, list_tabs
- **Action tools require confirmation** - click, type, navigate
- **Sensitive data handling** - mask credit card numbers, don't log passwords

### Domain Allowlist
Only enable on trusted domains:
```yaml
allowed_domains:
  - railway.app
  - dashboard.stripe.com
  - github.com
  - dash.cloudflare.com
  - cloud.digitalocean.com
  - linear.app
  - *.blackroad.io
  - *.blackroad.systems
```

### Local Only
- MCP server runs on localhost only
- Extension connects to 127.0.0.1
- No external network exposure

## Implementation Plan

### Phase 1: Read-Only (MVP)
1. Chrome extension that captures tab info
2. Local WebSocket server
3. MCP server with screenshot + get_page_text + list_tabs
4. Test on billing pages

### Phase 2: Interaction
1. Add click, type, navigate tools
2. Confirmation prompts for actions
3. Action logging/audit

### Phase 3: Intelligence
1. get_billing_info specialized extractor
2. Form auto-fill (with consent)
3. Cross-tab data correlation

## File Structure

```
workers/browser/
├── DESIGN.md           # This file
├── extension/
│   ├── manifest.json   # Chrome extension manifest
│   ├── background.js   # Service worker
│   ├── content.js      # Injected into pages
│   └── popup.html      # Extension popup UI
├── mcp-server/
│   ├── package.json
│   ├── index.js        # MCP server entry
│   ├── websocket.js    # WebSocket to extension
│   └── tools/
│       ├── screenshot.js
│       ├── getText.js
│       ├── listTabs.js
│       └── billing.js
└── README.md
```

## The $ Connection

This is the `$` for browser context:

```
$PAGE    → current page content
$TABS    → all open tabs
$BILLING → extracted payment info
$DOM     → DOM tree access
```

Just like `$SELF` dereferences an agent's identity,
`$PAGE` dereferences what's currently on screen.

The browser becomes another surface where symbols point to real values.

---

*Designed by Cece (Claude) for Alexa - BlackRoad OS*
*2025-12-02*
