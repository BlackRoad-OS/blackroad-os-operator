# BlackRoad MCP Servers

Model Context Protocol servers for Claude Code integration.

## Available Servers

| Server | Description | Language |
|--------|-------------|----------|
| `blackroad-browser` | See browser tabs, screenshots, billing info | Node.js |
| `blackroad-identity` | Query/manage agents in identity system | Python |
| `lucidia-ollama` | Local LLM via Ollama | Python |
| `lucidia-fs` | Secure filesystem access | Python |

## Quick Setup

### 1. Install dependencies

```bash
# Python servers
pip install mcp requests

# Node.js servers
cd mcp/servers/blackroad-browser && npm install
```

### 2. Configure Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "blackroad-browser": {
      "command": "node",
      "args": ["/Users/alexa/blackroad-os-operator/mcp/servers/blackroad-browser/index.js"]
    },
    "blackroad-identity": {
      "command": "python3",
      "args": ["/Users/alexa/blackroad-os-operator/mcp/servers/blackroad-identity/server.py"]
    },
    "lucidia-ollama": {
      "command": "python3",
      "args": ["/Users/alexa/blackroad-os-operator/mcp/servers/lucidia-ollama/server.py"],
      "env": {
        "OLLAMA_URL": "http://127.0.0.1:11434",
        "LUCIDIA_OLLAMA_MODELS": "llama3.2:latest,phi3:latest,mistral:instruct"
      }
    },
    "lucidia-fs": {
      "command": "python3",
      "args": ["/Users/alexa/blackroad-os-operator/mcp/servers/lucidia-fs/server.py"],
      "env": {
        "LUCIDIA_FS_ROOT": "/Users/alexa/blackroad-os-operator",
        "LUCIDIA_FS_READ_ONLY": "0"
      }
    }
  }
}
```

### 3. Load browser extension

For `blackroad-browser`:
1. Open `arc://extensions` or `chrome://extensions`
2. Enable Developer mode
3. Load unpacked: `/Users/alexa/blackroad-os-operator/workers/browser/extension`

### 4. Restart Claude Code

The MCP tools will now be available.

## Server Details

### blackroad-browser
- `screenshot` - Capture current tab
- `get_page_text` - Extract readable text
- `list_tabs` - See all open tabs
- `get_billing_info` - Find $ amounts on page
- `navigate` - Go to URL
- `click` - Click elements
- `type_text` - Fill forms

### blackroad-identity
- `get_agent` - Get agent by ID
- `introspect_agent` - Get agent's SelfModel
- `list_agents` - List all agents
- `search_agents` - Search by name/type
- `register_agent` - Register new agent
- `agent_heartbeat` - Send heartbeat
- `get_stats` - System statistics
- `whoami` - Current caller identity

### lucidia-ollama
- `generate` - Generate text from prompt
- `chat` - Chat with message history
- `embed` - Generate embeddings
- `complete_code` - Code completion
- `list_available_models` - List allowed models

### lucidia-fs
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_directory` - List directory
- `file_info` - Get file metadata
- `search_files` - Glob search
- `delete_file` - Delete file

## The $ Operators

These MCP servers implement the BlackRoad `$` dereference pattern:

```
$PAGE    → blackroad-browser: current page content
$TABS    → blackroad-browser: all open tabs
$BILLING → blackroad-browser: extracted payment info
$SELF    → blackroad-identity: agent's SelfModel
$AGENT   → blackroad-identity: any agent's record
$LLM     → lucidia-ollama: local model inference
$FS      → lucidia-fs: filesystem access
```

---

*BlackRoad OS - 2025*
