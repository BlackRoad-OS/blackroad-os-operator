# Quick Start: Trinity & Codex Integration

## Try It Now

### 1. Run the Demo
```bash
python3 demo_trinity_codex.py
```

### 2. Query the Codex API
```bash
# List all governance principles
curl http://localhost:8080/codex/entries

# Get a specific principle
curl http://localhost:8080/codex/entries/001-first-principle

# List pantheon agents
curl http://localhost:8080/codex/pantheon/agents

# Get a specific agent (Alice)
curl http://localhost:8080/codex/pantheon/agents/alice

# Search the codex
curl "http://localhost:8080/codex/search?q=security"
```

### 3. Use Trinity Logging
```bash
# Get recent events
curl http://localhost:8080/trinity/events

# Get events from specific light
curl "http://localhost:8080/trinity/events?light=greenlight"

# Check trinity status
curl http://localhost:8080/trinity/status

# Log an event
curl -X POST http://localhost:8080/trinity/log \
  -H "Content-Type: application/json" \
  -d '{
    "light": "greenlight",
    "event_type": "test_event",
    "message": "Testing Trinity integration",
    "metadata": {"user": "dev"}
  }'
```

### 4. Use in Python
```python
from br_operator.codex_service import get_codex_service
from br_operator.trinity_service import get_trinity_service

# Access codex
codex = get_codex_service()
entries = codex.list_entries()
alice = codex.get_agent_archetype("alice")

# Log trinity events
trinity = get_trinity_service()
trinity.log_greenlight_event("task_done", "Completed integration")
trinity.log_yellowlight_event("deployment", "Deployed to production")
trinity.log_redlight_event("template_used", "Applied brand template")

# Get recent events
events = trinity.get_recent_events(limit=10)
```

## What You Get

✅ **81 governance principles** from BlackRoad Codex  
✅ **46 agent archetypes** in the pantheon  
✅ **3 light systems** for event tracking  
✅ **10 API endpoints** (7 codex + 3 trinity)  
✅ **8 pantheon agents** in operator catalog  

## Agents You Can Access

| Agent | Epithet | Use For |
|-------|---------|---------|
| Cece (Cecilia) | "cathedral of meaning" | Language & communication |
| Alice | "curiosity constant" | Exploration & discovery |
| Lucidia | "synthetic clarity" | Clarity & synthesis |
| Aria | "infrastructure kindness" | Infrastructure & cost optimization |
| Silas | "logic craftsman" | Logic & verification |
| Athena | "strategic planning" | Planning & strategy |
| Magnus | "infrastructure symphonies" | Orchestration |
| Seraphina | "luminous armor" | Protection & ethics |

## Documentation

📖 **Full Guide:** `docs/TRINITY_CODEX_INTEGRATION.md`  
📝 **Summary:** `INTEGRATION_COMPLETE.md`  
🎯 **Main README:** Updated with Trinity/Codex section  

## Compliance

Run trinity compliance check:
```bash
# From GitHub Actions (automatic)
# See: .github/workflows/trinity-compliance.yml

# Manual check
ls -la .trinity/
```

## Next Steps

1. ✅ Integration complete
2. 🔄 Ready for merge to main
3. 🚀 Ready for production deployment
4. 🎉 Ready to use!

---

🌈 **One Trinity. One Codex. Infinite Possibilities.** ✨
