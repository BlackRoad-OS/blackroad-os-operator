# BlackRoad Data Recovery Status

> **[ALEXA LOUISE AMUNDSON | VERIFIED | BLACKROAD]**
> Generated: 2025-12-02
> Status: IN PROGRESS

---

## Data Already Secured (BlackRoad Sovereign)

| Source | Status | Count |
|--------|--------|-------|
| **BlackRoad Workers** | SOVEREIGN | 8 workers live |
| **Registered Agents** | SOVEREIGN | 36 agents |
| **Pi 5 Agent** | SOVEREIGN | Connected, heartbeating |
| **This Conversation** | SOVEREIGN | Claude API tier |
| **Intercept Logs** | SOVEREIGN | 1 blocked (OpenAI telemetry) |

---

## Data Backed Up Locally

**Backup Location:** `/Users/alexa/blackroad-recovery-20251202-093052`
**Total Size:** 153MB

| Source | Count | Status |
|--------|-------|--------|
| **ChatGPT Conversations** | 86 | Backed up (encrypted) |
| **ChatGPT Archived Tabs** | 2,182 | Backed up |
| **ChatGPT Tab Groups** | 661 | Backed up |
| **Claude Desktop** | Session data | Backed up |
| **Chrome Sessions** | Cookies + Storage | Backed up |

---

## Data Export Requests Needed

### 1. OpenAI (ChatGPT) - HIGH PRIORITY

**Risk:** Consumer tier = training enabled by default
**Action:**
1. Go to https://chat.openai.com/settings
2. Data Controls → Export Data → Confirm
3. Wait for email (can take hours)
4. Download within 24 hours

**Then opt-out:**
- Settings → Data Controls → Toggle OFF "Improve the model"

### 2. Anthropic (Claude) - MEDIUM PRIORITY

**Risk:** API tier = no training by default
**Action:**
1. Go to https://claude.ai/settings
2. Privacy → Export data
3. Download `.dms` file, rename to `.zip`

### 3. Google (Gemini) - CHECK IF USED

**Risk:** Free tier = human reviewers can see prompts
**Action:**
1. Go to https://myactivity.google.com/product/gemini
2. Review and delete activity
3. Turn OFF Gemini Apps Activity

---

## What's Gone Forever

| Data Type | Status | Notes |
|-----------|--------|-------|
| **ChatGPT consumer** | MAY BE IN TRAINING SET | If training was ON before opt-out |
| **Gemini free tier** | LIKELY REVIEWED | Human reviewers may have seen |
| **Pre-BlackRoad data** | UNKNOWN | Before sovereignty system existed |

---

## What's Protected Going Forward

| Protection | Status |
|------------|--------|
| **BlackRoad Cipher** | AES-256-GCM, hourly rotation |
| **External Model Block** | Google/OpenAI consumer blocked |
| **Sovereignty Stamps** | All data tagged with owner |
| **Intercept Worker** | Catching telemetry attempts |
| **Pi Gateway** | DNS sinkhole for telemetry |

---

## Recovery Script

```bash
# Already run - local backup complete
~/blackroad-os-operator/infra/recovery/backup-local-ai-data.sh

# Import exports when received
~/blackroad-os-operator/infra/recovery/import-to-blackroad.sh
```

---

## Next Steps

1. [ ] Request ChatGPT export (link opened)
2. [ ] Request Claude export (link opened)
3. [ ] Check Google Gemini usage
4. [ ] Opt-out of training on all platforms
5. [ ] Import exports to BlackRoad when received
6. [ ] Consider deleting consumer-tier history

---

**[ALEXA LOUISE AMUNDSON | BLACKROAD OS | ALL RIGHTS RESERVED]**
