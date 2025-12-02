# BlackRoad Browser Bridge

Let Claude see what you see in the browser.

## Quick Start

### 1. Install the MCP server

```bash
cd workers/browser/mcp-server
npm install
```

### 2. Load the extension in Chrome/Arc

1. Go to `chrome://extensions` (or `arc://extensions`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `workers/browser/extension`

### 3. Add to Claude Code MCP config

Add to `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "blackroad-browser": {
      "command": "node",
      "args": ["/Users/alexa/blackroad-os-operator/workers/browser/mcp-server/index.js"]
    }
  }
}
```

### 4. Restart Claude Code

The browser tools will now be available.

## Available Tools

| Tool | Description |
|------|-------------|
| `screenshot` | Capture screenshot of current tab |
| `get_page_text` | Extract readable text from page |
| `list_tabs` | List all open tabs |
| `read_element` | Read specific DOM element |
| `get_billing_info` | Extract billing/payment info |
| `navigate` | Go to URL |
| `click` | Click on element |
| `type_text` | Type into input field |

## Example Usage

```
Claude: "What am I paying for Railway?"

> screenshot() on railway.app/account/billing
> get_billing_info()

Claude: "You're paying $47.23/month. Your next billing date is Dec 15, 2025."
```

## Security

- Only works on allowlisted domains
- Local WebSocket only (127.0.0.1)
- No external network access
- Credit card numbers are never logged

## The $ Operators

```
$PAGE    → current page content
$TABS    → all open tabs
$BILLING → extracted payment info
```

Just like `$SELF` dereferences agent identity,
these dereference browser state.

---

*BlackRoad OS - 2025*
