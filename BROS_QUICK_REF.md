# bros - BlackRoad OS Operator CLI Quick Reference

## 🚀 What is bros?

Your unified CLI interface for managing all GitHub repositories across the entire BlackRoad ecosystem. No more remembering which org a repo is in or typing long GitHub URLs.

## Installation

Already installed! Just open a new terminal and type `bros` or `br`.

## Commands

### List All Repos
```bash
bros list        # or: bros ls
```
Shows all repositories across all BlackRoad organizations with descriptions, languages, and last update times.

### Search for Repos
```bash
bros search bitcoin      # Find bitcoin-related repos
bros search operator     # Find operator repos
bros find dashboard      # 'find' is alias for 'search'
```

### Clone a Repo
```bash
bros clone roadchain     # Clones blackroad-os-roadchain
bros clone operator      # Clones blackroad-os-operator
```
Auto-detects the right repo even with partial names!

### Show Repo Info
```bash
bros info roadchain      # Detailed info about a repo
bros show operator       # 'show' is alias for 'info'
```

### Open in Browser
```bash
bros open roadchain      # Opens repo in your default browser
bros browse operator     # 'browse' is alias for 'open'
```

### Ecosystem Stats
```bash
bros stats               # Shows total repos, languages, recent activity
```

### Refresh Cache
```bash
bros refresh             # Force refresh repo data (cache is 1 hour)
```

### Help
```bash
bros help                # Show all commands
bros --help
bros -h
```

## Quick Alias

Use `br` instead of `bros`:
```bash
br list
br search bitcoin
br clone roadchain
```

## Examples

**I want to clone the roadchain repo:**
```bash
bros clone roadchain
```

**What repos do we have related to infrastructure?**
```bash
bros search infra
```

**Open the operator repo in my browser:**
```bash
bros open operator
```

**Show me everything:**
```bash
bros stats
```

## Organizations Covered

- BlackRoad-OS
- BlackRoad-AI
- BlackRoad-Cloud
- BlackRoad-Labs
- BlackRoad-Foundation

## Cache System

Repos are cached for 1 hour to minimize GitHub API calls. Cache location: `~/.blackroad-cache/repos.json`

Force refresh: `bros refresh`

## Interactive Mode

For a full-screen TUI experience:
```bash
bros-interactive
```

This launches an interactive menu with:
- Browse by language
- Browse by category
- Recent activity
- Search
- Organization tree
- Statistics
- Clone operations
- Cache refresh

Perfect for exploring when you don't know exactly what you're looking for!

## Made With

Built for Alexa by Claude - because remembering which org a repo is in shouldn't be a job requirement. ✨
