# bros - BlackRoad OS Operator CLI Changelog

## v2.0.0 - 2025-12-27

### Major New Features

**Discovery Commands:**
- `lang [language]` - Filter repos by programming language
  - Without args: lists all languages with counts
  - With language: shows all repos in that language
- `recent [N]` - Show N most recently updated repos (default 10)
- `category <cat>` - Filter by category patterns (agent, bot, infra, deploy, etc)
- `tree` - Organization tree view showing all orgs and their repos

**Bulk Operations:**
- `clone-all <pattern>` - Clone multiple repos matching a pattern (with confirmation)
- `urls [pattern]` - Output repo URLs for scripting (clean, parseable output)

**What This Enables:**
1. **Language-based exploration** - "Show me all Python repos"
2. **Time-based discovery** - "What changed recently?"
3. **Pattern-based cloning** - "Clone all agent repos at once"
4. **Scriptable output** - Pipe URLs to other tools
5. **Visual organization** - See the entire org structure at a glance

### Examples

```bash
# Show all Python projects
bros lang python

# Last 5 updated repos
bros recent 5

# All agent-related repos
bros category agent

# Clone all dashboard repos
bros clone-all dashboard

# Get URLs for all infrastructure repos (for scripts)
bros urls infra

# See full org tree
bros tree
```

## v1.0.0 - 2025-12-27

### Initial Release

**Core Features:**
- Multi-org repo fetching (BlackRoad-OS, BlackRoad-AI, BlackRoad-Cloud, BlackRoad-Labs, BlackRoad-Foundation)
- Smart caching (1 hour TTL)
- Search by name or description
- Clone repos by partial name match
- Show detailed repo info
- Open repos in browser
- Ecosystem statistics
- Manual cache refresh

**Commands:**
- `list` - List all repos
- `search` - Search repos
- `clone` - Clone a repo
- `info` - Show repo details
- `open` - Open in browser
- `stats` - Show statistics
- `refresh` - Refresh cache
- `help` - Show help

### Technical Details

- Built in bash for maximum compatibility
- Uses GitHub CLI (`gh`) for repo data
- Caches data in `~/.blackroad-cache/repos.json`
- Color-coded output for better readability
- Aliased as `br` for quick access
