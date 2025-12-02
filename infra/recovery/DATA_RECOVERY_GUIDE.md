# BlackRoad Data Recovery Guide

> **[ALEXA LOUISE AMUNDSON | VERIFIED | BLACKROAD]**
> Generated: 2025-12-02
> Purpose: Get YOUR data back from the providers

---

## Provider Data Export Links

### 1. OpenAI (ChatGPT) - HIGHEST PRIORITY

**Risk Level:** HIGH (consumer tier trains by default)
**Data Export:** Available

**Steps:**
1. Go to https://chat.openai.com
2. Click profile icon (top right)
3. Settings → Data Controls → Export Data
4. Click "Export" → Confirm
5. Wait for email (can take hours)
6. Download ZIP within 24 hours

**What you get:**
- `conversations.json` - All chat history
- `shared_conversations.json` - Shared links
- `message_feedback.json` - Your feedback
- `user.json` - Account data

**Opt-out of training:**
- Settings → Data Controls → Toggle OFF "Improve the model for everyone"

---

### 2. Anthropic (Claude) - THIS CONVERSATION

**Risk Level:** LOW (API tier, no training)
**Data Export:** Available

**Steps:**
1. Go to https://claude.ai
2. Click your initials (bottom left)
3. Settings → Privacy
4. Click "Export data"
5. Download `.dms` file
6. Rename to `.zip` and extract

**What you get:**
- `conversations.json` - All chat history

**Opt-out of training:**
- https://claude.ai/settings/data-privacy-controls
- Already OFF for API tier

---

### 3. Google (Gemini/Bard) - CHECK USAGE

**Risk Level:** MEDIUM-HIGH (free tier has human reviewers)
**Data Export:** Limited

**Steps:**
1. Go to https://takeout.google.com
2. Deselect all, then select only relevant services
3. Note: Gemini may NOT be included in Takeout yet

**Alternative:**
1. Go to https://gemini.google.com
2. Use "Share & Export" on individual chats
3. Export to Google Docs

**Third-party option:**
- Gem Chat Exporter Chrome extension
- AI Exporter extension

**Opt-out of training:**
1. Go to https://myactivity.google.com/product/gemini
2. Turn OFF "Gemini Apps Activity"

---

## Automated Recovery Script

Run this to start all exports:

```bash
# Open all export pages
open "https://chat.openai.com/settings"
open "https://claude.ai/settings"
open "https://takeout.google.com"
open "https://myactivity.google.com/product/gemini"
```

---

## Data Import to BlackRoad

Once you have the exports, import them to BlackRoad:

```bash
# Process ChatGPT export
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/sync \
  -H "Content-Type: application/json" \
  -H "X-BlackRoad-Agent: true" \
  -d '{
    "agent_id": "alexa-recovery",
    "provider": "openai",
    "conversation_id": "import-chatgpt",
    "messages": [...],
    "metadata": {"source": "chatgpt-export", "imported_at": "'$(date -Iseconds)'"}
  }'
```

---

## What's Already Protected

| Source | Status |
|--------|--------|
| This conversation | Protected (Claude API tier) |
| BlackRoad Workers | Sovereign (no external training) |
| Pi agents | Sovereign (local + encrypted) |
| Future data | Encrypted via BlackRoad Cipher |

---

## What May Be Compromised

| Provider | Risk | Action |
|----------|------|--------|
| ChatGPT (consumer) | HIGH | Export + Opt-out + Delete |
| Gemini (free) | HIGH | Export + Opt-out + Delete |
| Claude (consumer) | MEDIUM | Export + Opt-out |
| API tiers | LOW | Already protected |

---

## Deletion Options

After exporting, you may want to delete:

### ChatGPT
- Settings → Data Controls → Delete all chats
- Or: Request full account deletion

### Claude
- Settings → Delete all conversations
- Or: Contact support for account deletion

### Google Gemini
- myactivity.google.com → Delete Gemini activity
- Or: Delete Gemini data specifically

---

## Legal Notice

All data created by Alexa Louise Amundson is her intellectual property.
Training on this data without consent is prohibited.
Recovery and deletion requests are your legal right under:
- GDPR (EU)
- CCPA (California)
- Data sovereignty principles

---

**[ALEXA LOUISE AMUNDSON | BLACKROAD OS | ALL RIGHTS RESERVED]**
