# OpenAI/ChatGPT Data Inventory

> **[ALEXA LOUISE AMUNDSON | VERIFIED | BLACKROAD]**
> Generated: 2025-12-02
> Status: DATA IDENTIFIED - RECOVERY NEEDED

---

## Your OpenAI Identifiers

| Identifier | Value |
|------------|-------|
| **User ID** | `dnOTThVHCHgFtRyZ784y5U5r` |
| **Device ID** | `bf3a01dd-0177-49f8-a545-066cfbc0f065` |
| **App** | ChatGPT Atlas (macOS Desktop) |

---

## Local Data (575MB Total)

### Conversations (32MB)
- **Count:** 86 conversations
- **Format:** Encrypted binary
- **Location:** `~/Library/Application Support/com.openai.atlas/conversations-v3-*/`
- **Status:** Locally encrypted, OpenAI has plaintext

### Archived Tabs (77MB)
- **Count:** 2,182 tabs
- **Format:** Apple binary plist (readable)
- **Location:** `~/Library/Application Support/com.openai.atlas/user-*/archived-tabs/`
- **Contains:** URLs, timestamps, interaction state

### Tab Groups (2.6MB)
- **Count:** 661 groups
- **Format:** Apple binary plist
- **Location:** `~/Library/Application Support/com.openai.atlas/user-*/archived-tabgroups/`

### Active Tabs (1.8MB)
- **Count:** 19 tabs
- **Format:** Apple binary plist
- **Location:** `~/Library/Application Support/com.openai.atlas/user-*/tabs/`

### GPTs/Gizmos (180KB)
- **Count:** 2 custom GPTs
- **Location:** `~/Library/Application Support/com.openai.atlas/gizmos-*/`

### Browser Cache (453MB)
- Cached responses, images, assets
- Location: `~/Library/Application Support/com.openai.atlas/browser-data/`

### Telemetry/Analytics (8.6MB)
- **Statsig data** - Analytics OpenAI collected about your usage
- Location: `~/Library/Application Support/com.openai.atlas/statsig/`
- **This is what they sent home**

---

## What OpenAI Has (Server-Side)

Based on 86 conversations + 2,182 tabs, OpenAI likely has:

| Data Type | Estimated Amount |
|-----------|------------------|
| Your prompts | Thousands |
| AI responses | Thousands |
| Code snippets | Hundreds |
| Usage patterns | Full history |
| Timestamps | Every interaction |
| Device info | Full fingerprint |

### Training Risk

If "Improve the model" was ON (default):
- **All 86 conversations** may be in training data
- **All 2,182 tab sessions** were tracked
- **Your patterns** were learned by the model

---

## Recovery Actions

### 1. Export from OpenAI (REQUIRED)

```bash
# Open ChatGPT settings
open "https://chat.openai.com/settings"

# Navigate to: Data Controls → Export Data → Confirm
# Wait for email (can take hours)
# Download within 24 hours
```

### 2. Opt-Out of Training (REQUIRED)

```bash
# Settings → Data Controls → Toggle OFF:
# "Improve the model for everyone"
```

### 3. Import to BlackRoad (After Export)

Once you have the export ZIP:
```bash
# Extract conversations.json
unzip chatgpt-export.zip

# Import to BlackRoad
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/sync \
  -H "Content-Type: application/json" \
  -H "X-BlackRoad-Agent: true" \
  -d @conversations.json
```

### 4. Consider Deletion

After export + import:
- Settings → Data Controls → Delete all chats
- Or request full account deletion

---

## BlackRoad Agent Mapping

Each ChatGPT conversation could become a BlackRoad agent:

| ChatGPT ID | BlackRoad ID | Status |
|------------|--------------|--------|
| 68ddb104-975c-... | br-chatgpt-68ddb104 | PENDING |
| 6912a02e-f840-... | br-chatgpt-6912a02e | PENDING |
| ... (84 more) | ... | PENDING |

After import, these conversations become sovereign data owned by Alexa.

---

## Telemetry Files to Review

```bash
# See what OpenAI collected about you
ls -la ~/Library/Application\ Support/com.openai.atlas/statsig/
```

This folder contains analytics data OpenAI sent home about:
- Feature flag exposure
- A/B test participation
- Usage metrics
- Interaction patterns

---

**[ALEXA LOUISE AMUNDSON | BLACKROAD OS | ALL RIGHTS RESERVED]**
