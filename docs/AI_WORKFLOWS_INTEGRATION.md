# AI Workflows Integration
## Linear + Notion + HuggingFace

Complete guide to the AI-powered workflow orchestration system that automatically triages Linear issues, generates Notion documentation, and uses HuggingFace models for intelligent automation.

---

## 🎯 What It Does

The AI Workflow Engine provides three core capabilities:

### 1. **Auto-Triage Linear Issues**
When a new Linear issue is created:
- ✅ Classifies issue type (bug, feature, improvement, etc.) using AI
- ✅ Assigns priority (P0-P3) based on keywords and context
- ✅ Suggests relevant labels automatically
- ✅ Generates AI summary of the issue
- ✅ Adds `ai:triaged` label for tracking

### 2. **Generate Notion Docs from Linear**
When a Linear issue is marked "Done":
- ✅ Uses Llama 3.1 to generate feature specification
- ✅ Creates Notion page in Feature Specs database
- ✅ Links back to Linear issue
- ✅ Syncs metadata (status, priority, assignee)

### 3. **Content Moderation**
When comments are added to Linear issues:
- ✅ Checks for toxic/inappropriate content
- ✅ Flags problematic comments for review
- ✅ Notifies moderators when needed

---

## 🏗️ Architecture

```
┌─────────────┐     Webhook      ┌──────────────────────┐
│   Linear    │ ───────────────> │  Operator Engine     │
│   Issues    │                  │  (FastAPI)           │
└─────────────┘                  │                      │
                                 │  ┌────────────────┐  │
                                 │  │ AI Workflow    │  │
                                 │  │ Engine         │  │
┌─────────────┐                  │  └────────┬───────┘  │
│ HuggingFace │ <────────────────┼───────────┘          │
│   Models    │  Inference       │                      │
│             │                  │                      │
│ • Llama 3.1 │                  │  ┌────────────────┐  │
│ • BART      │                  │  │ Notion Client  │  │
│ • Classif.  │                  │  └────────┬───────┘  │
└─────────────┘                  └───────────┼──────────┘
                                             │
                                             v
                                    ┌─────────────┐
                                    │   Notion    │
                                    │  Databases  │
                                    └─────────────┘
```

---

## 🚀 Setup & Deployment

### Step 1: Install Dependencies

```bash
cd blackroad-os-operator
pip install -r requirements.txt
```

New dependencies added:
- `huggingface-hub>=0.20.0` - HuggingFace inference client
- `notion-client>=2.2.0` - Notion API client

### Step 2: Configure Environment Variables

Add to your `.env` or Railway environment:

```bash
# Linear
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxx
OPERATOR_WEBHOOK_URL=https://operator.blackroad.systems

# Notion
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxx
NOTION_WORKSPACE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# HuggingFace (optional, uses serverless inference by default)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

### Step 3: Configure Linear Webhook

1. Go to Linear Settings → Webhooks
2. Create new webhook: `https://operator.blackroad.systems/webhooks/linear`
3. Enable events:
   - ✅ Issue created
   - ✅ Issue updated
   - ✅ Comment created
   - ✅ Label added
4. Copy webhook secret (optional for signature verification)

### Step 4: Create Notion Database

Create a "Feature Specs" database in Notion with these properties:

| Property       | Type         | Options                              |
|----------------|--------------|--------------------------------------|
| Feature Name   | Title        | -                                    |
| Status         | Select       | Draft, In Review, Approved, Shipped  |
| Priority       | Select       | P0, P1, P2, P3                       |
| Owner          | Person       | -                                    |
| Linear Issue   | URL          | -                                    |
| Target Date    | Date         | -                                    |
| Tags           | Multi-select | -                                    |

Then get the database ID:
1. Open the database in Notion
2. Copy the URL: `https://notion.so/.../{database_id}?v=...`
3. Update `ai_workflow_engine.py` line 156 with your database ID

### Step 5: Deploy to Railway

```bash
# Commit changes
git add .
git commit -m "Add AI workflows integration (Linear + Notion + HF)"

# Push to Railway (auto-deploys)
git push railway main

# Or deploy manually
railway up
```

### Step 6: Verify Integration

```bash
# Check health endpoint
curl https://operator.blackroad.systems/webhooks/linear/health

# Expected response:
{
  "status": "healthy",
  "integrations": {
    "linear": "configured",
    "notion": "configured",
    "huggingface": "configured"
  },
  "workflows": {
    "auto_triage": true,
    "notion_sync": true,
    "moderation": true
  }
}
```

---

## 📖 Usage Guide

### Automatic Workflows

Once configured, workflows run automatically:

#### Auto-Triage (on issue creation)
```
1. User creates Linear issue: "Fix login page crash on iOS"
2. Webhook → Operator Engine
3. AI classifies as: bug, P1, security
4. Suggested labels: bug, P1, security, ai:triaged
5. AI summary added to issue
```

#### Notion Doc Generation (on issue completion)
```
1. Developer marks Linear issue as "Done"
2. Webhook → Operator Engine
3. AI generates feature spec using Llama 3.1
4. Creates Notion page in Feature Specs database
5. Links back to Linear issue
```

### Manual Triggers (for testing)

```bash
# Manually trigger triage for specific issue
curl -X POST https://operator.blackroad.systems/webhooks/linear/manual-triage/ISSUE-123

# Manually trigger Notion sync
curl -X POST https://operator.blackroad.systems/webhooks/linear/manual-notion-sync/ISSUE-456
```

---

## 🤖 AI Models Used

### Classification & Triage
- **Primary**: `blackroad/intent-classifier-v1` (custom fine-tuned)
- **Fallback**: `facebook/bart-large-mnli` (zero-shot)

### Summarization
- **Model**: `facebook/bart-large-cnn`
- **Use**: Generate concise summaries of issues

### Feature Spec Generation
- **Model**: `meta-llama/Meta-Llama-3.1-8B-Instruct`
- **Use**: Generate full feature documentation

### Content Moderation
- **Model**: `MoritzLaworx/toxic-comment-model`
- **Use**: Flag inappropriate comments

All models run via HuggingFace Serverless Inference (free tier: 1000 req/hr).

---

## ⚙️ Configuration Files

### `/integrations/productivity/linear.yaml`
Linear workspace configuration:
- Teams & projects
- Labels & workflows
- AI workflow rules
- Classification keywords

### `/integrations/productivity/notion.yaml`
Notion workspace structure:
- Page hierarchy
- Database schemas
- Templates
- Integration mappings

### `/integrations/ai/huggingface.yaml`
HuggingFace infrastructure:
- Inference endpoints
- Model catalog
- Rate limits
- Monitoring

---

## 🔍 Monitoring & Debugging

### Check Logs

```bash
# Railway logs
railway logs

# Filter for AI workflow events
railway logs | grep "AI Workflow"
railway logs | grep "Auto-triaging"
```

### View Metrics

The engine tracks:
- `issues_created` - Total issues processed
- `issues_triaged` - Successfully auto-triaged
- `ai_classifications` - AI classification attempts
- `notion_syncs` - Notion docs created
- `processing_latency` - Average processing time

### Common Issues

#### "Policy engine not initialized"
**Cause**: Operator starting up
**Fix**: Wait 10-30 seconds after deployment

#### "Failed to create Notion page"
**Cause**: Invalid database ID or missing permissions
**Fix**:
1. Check database ID in `ai_workflow_engine.py:156`
2. Ensure integration has access to database

#### "HuggingFace rate limit exceeded"
**Cause**: Too many requests (free tier: 1000/hr)
**Fix**:
1. Add `HUGGINGFACE_API_KEY` for higher limits
2. Or implement request batching

---

## 🎛️ Customization

### Add Custom Classification Rules

Edit `integrations/productivity/linear.yaml`:

```yaml
ai_workflows:
  auto_triage:
    classifiers:
      priority:
        P0: ["security", "data loss", "system down"]
        P1: ["blocking", "broken", "urgent"]
        # Add your keywords here
```

### Modify Notion Template

Edit `ai_workflow_engine.py` → `_feature_spec_template()`:

```python
def _feature_spec_template(self, issue: LinearIssue) -> str:
    return f"""# {issue.title}

## Your Custom Section
{issue.description}

## Another Section
[To be filled]
"""
```

### Add New Workflow Triggers

1. Add trigger to `WorkflowTrigger` enum
2. Implement handler in `process_webhook()`
3. Map Linear event in `webhooks_linear.py`

---

## 📊 Example Workflow

### Complete Flow: Feature Request → Documentation

```
Day 1: 10:00 AM
├─ User creates Linear issue: "Add dark mode support"
├─ ✅ AI auto-triages: feature, P2, [feature, ui, P2, ai:triaged]
└─ ✅ Summary: "Implement dark mode theme switching for better UX"

Day 2: 3:00 PM
├─ Developer implements feature
├─ Marks Linear issue as "Done"
├─ ✅ AI generates feature spec (using Llama 3.1)
├─ ✅ Creates Notion page in Feature Specs
│   ├─ Title: "Add dark mode support"
│   ├─ Status: Draft
│   ├─ Priority: P2
│   ├─ Linear Issue: https://linear.app/...
│   └─ Content: Full feature specification
└─ ✅ Linear issue updated with Notion link

Day 2: 4:00 PM
└─ Product team reviews Notion doc, marks as "Shipped"
```

---

## 🔐 Security & Privacy

- **Webhook Signatures**: Verify Linear webhook signatures (TODO: implement)
- **API Keys**: Store in environment variables, never commit
- **Rate Limiting**: HuggingFace serverless has built-in limits
- **Data Privacy**: Issue data sent to HuggingFace for inference only
- **Audit Trail**: All workflows logged via operator ledger

---

## 🚦 Testing

### Unit Tests

```bash
cd blackroad-os-operator
pytest tests/test_ai_workflow_engine.py -v
```

### Integration Tests

Create a test Linear issue and verify:
1. ✅ Auto-triage adds labels
2. ✅ Notion doc created when marked Done
3. ✅ Webhooks appear in Railway logs

### Manual Test Webhook

```bash
curl -X POST https://operator.blackroad.systems/webhooks/linear \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "type": "Issue",
    "data": {
      "id": "test-123",
      "title": "Test issue",
      "description": "This is a test",
      "state": {"name": "Triage"},
      "labels": [],
      "url": "https://linear.app/test",
      "createdAt": "2025-12-26T00:00:00Z",
      "updatedAt": "2025-12-26T00:00:00Z"
    }
  }'
```

---

## 📚 API Reference

### Webhook Endpoints

#### `POST /webhooks/linear`
Main webhook receiver for all Linear events.

**Headers:**
- `X-Linear-Signature`: Optional webhook signature

**Response:**
```json
{
  "success": true,
  "issue_id": "ISSUE-123",
  "actions_taken": [
    "Classified as: bug",
    "Assigned priority: P1",
    "Suggested labels: bug, P1, ai:triaged"
  ],
  "classifications": {
    "type": "bug",
    "priority": "P1",
    "labels": ["bug", "P1", "ai:triaged"]
  }
}
```

#### `POST /webhooks/linear-notion-sync`
Dedicated endpoint for Linear → Notion sync.

#### `GET /webhooks/linear/health`
Health check for integration status.

#### `POST /webhooks/linear/manual-triage/{issue_id}`
Manually trigger triage for specific issue.

#### `POST /webhooks/linear/manual-notion-sync/{issue_id}`
Manually trigger Notion sync for specific issue.

---

## 🎯 Next Steps

### Enhancements to Consider

1. **Bidirectional Sync**: Notion → Linear updates
2. **Slack Notifications**: Notify channels on triage/completion
3. **Custom Models**: Fine-tune on your domain data
4. **Priority Escalation**: Auto-escalate stale P0/P1 issues
5. **Team Routing**: Auto-assign to teams based on keywords
6. **PR Linking**: Auto-link GitHub PRs to Linear issues
7. **Metrics Dashboard**: Visualize triage accuracy and speed

---

## 🐛 Troubleshooting

### Issue: "Notion database not found"
1. Check database ID is correct
2. Verify integration has access:
   - Notion → Settings → Integrations
   - Add your integration to the database

### Issue: "HuggingFace model timeout"
1. Models can be slow on first request (cold start)
2. Use dedicated inference endpoints for production
3. Or implement caching for repeated queries

### Issue: "Linear webhook not received"
1. Check Railway logs: `railway logs`
2. Verify webhook URL is publicly accessible
3. Check Linear webhook delivery history
4. Ensure webhook events are enabled

---

## 📞 Support

- **Issues**: https://github.com/BlackRoad-OS/blackroad-os-operator/issues
- **Email**: blackroad.systems@gmail.com
- **Docs**: See `/docs/` directory

---

## 📄 License

Part of BlackRoad OS - All rights reserved

---

**Built with:**
- FastAPI (web framework)
- HuggingFace Hub (AI inference)
- Notion API (documentation)
- Linear API (project management)

**Powered by:**
- Llama 3.1 8B (feature spec generation)
- BART (classification & summarization)
- Custom fine-tuned models (domain-specific triage)
