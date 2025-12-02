# LLM Provider Architecture

> **Philosophy:** You don't want to be a Professional API Goblin™ — you want to build The Thing and let other stuff handle the wiring.

It is completely fine if BlackRoad runs on Claude + OpenAI for a long time.
There is no moral victory in suffering through self-hosted models before you're ready.

---

## 1. Truth: You + Claude/OpenAI Is Already a Working Stack

Right now you have:
- **ChatGPT + Claude** as:
  - coders
  - architect buddies
  - "click a button and see it run" environments
- Those give you:
  - No key juggling
  - No infra babysitting
  - Immediate feedback loops

That's not a crutch. That's literally your R&D environment.

**Step one:** Stop feeling bad about not doing everything via APIs.

> **Piece of paper:** "BlackRoad v0 = runs on top of OpenAI + Anthropic. That's allowed."

---

## 2. Design Goal: You Don't Deal With APIs — BlackRoad Does

Instead of you touching:
- `https://api.openai.com/v1/chat/completions`
- `https://api.anthropic.com/v1/messages`
- `https://gpt-oss-model-.../api/generate`

We do this:

**You only ever talk to one thing:**
```
POST https://blackroad-os-operator.../chat
```

Inside that operator, it talks to OpenAI / Claude / Ollama / whatever.

**Mental model:**
- You → `/chat` (one URL, one JSON shape)
- Operator → actual vendors (OpenAI, Anthropic, etc.)

You don't "use APIs"; BlackRoad uses APIs. You just use BlackRoad.

---

## 3. Comfort Mode Config

**Comfort Mode** means:
- No self-hosted models
- No Ollama in the critical path
- Just OpenAI + Anthropic behind the operator

### Implementation

```python
import os
import httpx

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # or "anthropic"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

async def call_llm(message: str, model: str = "gpt-4.1-mini") -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        if LLM_PROVIDER == "openai":
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "user", "content": message}
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

        elif LLM_PROVIDER == "anthropic":
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,              # e.g. "claude-3-5-sonnet-latest"
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "user", "content": message}
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            # anthropic returns content as list of blocks
            return "".join(
                block.get("text", "")
                for block in data.get("content", [])
                if block.get("type") == "text"
            )

        else:
            raise ValueError(f"Unknown LLM provider: {LLM_PROVIDER}")
```

Then your `/chat` handler just calls `call_llm(...)` and returns a reply field.

### Setup (One-Time)

1. In Railway (or wherever operator runs), set env vars:
   - `LLM_PROVIDER=openai` or `anthropic`
   - `OPENAI_API_KEY=sk-...` (in the Railway dashboard, not in code)
   - `ANTHROPIC_API_KEY=sk-ant-...` (same deal)

2. Keep using your terminal the way you already are:

```bash
OPERATOR_URL="https://blackroad-os-operator-production-8d28.up.railway.app/chat"

curl -sS -X POST "$OPERATOR_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Cece, talk to me.\",
    \"userId\": \"alexa-terminal-test\"
  }"
```

That's it.
All the gross vendor-specific stuff lives inside `call_llm`. You never see it.

---

## 4. Phased Rollout

Open source can be "Phase 2", not "Day 1".

### Phase 1 (Now) – "Comfort Mode"
- Only OpenAI + Anthropic behind operator
- No self-hosted GPUs, no Ollama, no "why is /api/generate 404"

### Phase 2 – "Hybrid Mode"
- Add `LLM_PROVIDER=ollama` path inside the same `call_llm`, for when you're ready
- But your external contract stays `/chat → { reply }`
- You can switch providers by flipping one env var, not rewriting everything

### Phase 3 – "Full BlackRoad Cloud"
- OSS models (Llama 3.x, Qwen, etc.) run on your infra
- But clients still just see the same BlackRoad API

**You don't lose anything by leaning on OpenAI + Claude now.**
You gain speed, sanity, and time to finish the governance layer you actually care about.

---

## 5. Action Items

Very concrete:

1. **Stop caring about the Railway Ollama 404 for the moment.**
   That was useful debugging, but it doesn't have to block you.

2. **Decide:** For BlackRoad v0, do you want `LLM_PROVIDER = "openai"` or `"anthropic"` as the default?

3. **Wire it:**
   - Hook your operator's `call_llm` to that provider only
   - Keep `/chat` as your one true interface
   - Let you keep living mostly in ChatGPT/Claude UI to develop and iterate

---

## Summary

| Layer | What You See | What Actually Happens |
|-------|--------------|----------------------|
| You | `POST /chat` | One endpoint, one JSON shape |
| Operator | `call_llm()` | Routes to OpenAI/Anthropic/Ollama |
| Vendors | Hidden | API keys in env vars, never in code |

**You just use BlackRoad. BlackRoad uses APIs.**
