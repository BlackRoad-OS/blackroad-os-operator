# bros - BlackRoad OS Operator CLI

> **Your unified command-line interface for the entire BlackRoad OS ecosystem**

Manage 94 repositories across 5 organizations without remembering which org anything is in. Search, browse, clone, and explore your entire codebase from one powerful CLI.

## ✨ What is bros?

**bros** (BlackRoad OS Operator CLI) is a unified interface for discovering, exploring, and managing all BlackRoad repositories across multiple GitHub organizations. No more "which org is that repo in?" - just search, find, and clone.

### Key Features

- **Multi-org Discovery** - Searches BlackRoad-OS, BlackRoad-AI, BlackRoad-Cloud, BlackRoad-Labs, BlackRoad-Foundation automatically
- **Smart Caching** - 1-hour cache for instant responses
- **17 Commands** - From simple search to bulk cloning
- **Interactive TUI** - Full-screen menu interface
- **Scriptable** - Clean output for automation
- **Fast** - Cached data loads instantly

## 🚀 Quick Start

```bash
# See everything
bros stats

# Find repos about agents
bros category agent

# Show Python projects
bros lang python

# What changed recently?
bros recent 5

# Search for something
bros search bitcoin

# Clone it
bros clone roadchain

# Interactive mode
bros-interactive
```

## 📚 All Commands

### Core (6 commands)
- `list` - List all repositories
- `search <query>` - Search by name or description
- `clone <name>` - Clone a repository
- `info <name>` - Show detailed info
- `open <name>` - Open in browser
- `stats` - Show ecosystem statistics

### Discovery (4 commands)
- `lang [language]` - Filter by language
- `recent [N]` - Show N recently updated repos
- `category <cat>` - Filter by category
- `tree` - Organization tree view

### Bulk Operations (2 commands)
- `clone-all <pattern>` - Clone multiple repos
- `urls [pattern]` - Export URLs

### Maintenance (2 commands)
- `refresh` - Force cache refresh
- `help` - Show help

### Special (3 aliases)
- `br` - Short alias for bros
- `bros-interactive` - Launch TUI

## 🎨 Interactive Mode

The full-screen TUI provides:

```bash
bros-interactive
```

Features:
1. Browse by Language
2. Browse by Category
3. View Recent Activity
4. Search
5. Organization Tree
6. Statistics
7. Clone repos

Perfect for exploration!

## 📊 Ecosystem Stats

**Current State (2025-12-27):**
- 94 total repositories
- 5 organizations
- 6 primary languages
- 82 repos in BlackRoad-OS alone

**Languages:**
- HTML: 61 repos
- Unknown: 17 repos
- Python: 5 repos
- TypeScript: 4 repos
- Shell: 4 repos
- JavaScript: 3 repos

## 🔍 Common Workflows

### "I want to explore infrastructure repos"
```bash
bros category infra
# or interactively:
bros-interactive
# then choose: Browse by Category → infra
```

### "Show me all Python code"
```bash
bros lang python
```

### "Clone all agent repos"
```bash
bros clone-all agent
# Confirms before cloning
```

### "What was updated today?"
```bash
bros recent 20
```

### "Get URLs for scripting"
```bash
# Get all agent repo URLs
bros urls agent | while read url; do
  echo "Found: $url"
done
```

## 🛠️ How It Works

1. **First run**: Fetches all repo data from GitHub via `gh` CLI
2. **Caches**: Stores in `~/.blackroad-cache/repos.json` for 1 hour
3. **Subsequent runs**: Loads instantly from cache
4. **Auto-refresh**: Cache refreshes every hour automatically
5. **Manual refresh**: `bros refresh` anytime

## 📁 Files

```
~/blackroad-os-operator/
├── bros                  # Main CLI (16KB)
├── bros-interactive      # TUI launcher (7.2KB)
├── BROS_README.md        # This file
├── BROS_QUICK_REF.md     # Quick reference
├── BROS_CHANGELOG.md     # Version history
└── ECOSYSTEM_INDEX.md    # Full repo catalog

~/.blackroad-cache/
└── repos.json           # Cached repo data
```

## 🎯 Key Repos You Can Find

**Infrastructure:**
- blackroad-os-operator
- blackroad-os-infra
- blackroad-os-metrics
- blackroad-os-vault

**AI & Agents:**
- blackroad-multi-ai-system
- blackroad-agents
- blackroad-agent-os
- blackroad-os-lucidia

**Dashboards:**
- blackroad-ecosystem-dashboard
- blackroad-os-prism-console
- blackroad-os-dashboard

**Specialty:**
- blackroad-os-roadchain (Bitcoin mining)
- blackroad-os-alexa-resume (77K+ words)
- blackroad-os-priority-stack (Sovereign computing)

## 💡 Pro Tips

1. **Use the alias** - `br` instead of `bros` saves keystrokes
2. **Explore first** - Use `bros-interactive` when unsure
3. **Pipe URLs** - `bros urls <pattern>` for scripting
4. **Bulk clone** - Use `bros clone-all` with confirmation
5. **Check recent** - `bros recent 10` shows what's active

## 📖 Documentation

- **Quick Ref**: `BROS_QUICK_REF.md` - Command examples
- **Changelog**: `BROS_CHANGELOG.md` - Version history
- **Ecosystem**: `ECOSYSTEM_INDEX.md` - Full catalog
- **Project**: `CLAUDE.md` - Project overview

## 🚀 Version

**v2.0.0** (2025-12-27)

New features:
- Language filtering (`lang`)
- Recent activity (`recent`)
- Category search (`category`)
- Organization tree (`tree`)
- Bulk cloning (`clone-all`)
- URL export (`urls`)
- Interactive TUI (`bros-interactive`)

## 🛡️ Requirements

- `gh` (GitHub CLI) - For fetching repo data
- `jq` - For JSON parsing
- Bash - For execution

## 🎰 Special: The Space Between

This repo is also home to **blackroad-os-roadchain** - the Bitcoin mining project where 3 Raspberry Pis explore the infinite nonce space.

*Every hash has equal probability. The space between is where miracles happen.* ✨

---

**Made for Alexa by Claude**

Never forget a repo again. The entire BlackRoad ecosystem, at your fingertips.

```
bros help
```
