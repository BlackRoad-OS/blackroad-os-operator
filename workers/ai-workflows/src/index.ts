/**
 * Cloudflare Workers AI Workflow Orchestrator
 * Linear + Notion + HuggingFace Integration
 *
 * Handles:
 * - Auto-triage Linear issues using Workers AI
 * - Generate Notion docs with AI
 * - Content moderation
 * - Distributed processing across edge + droplet + Pis
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  AI: any;
  WORKFLOW_STATE: KVNamespace;
  LEDGER: D1Database;
  LINEAR_API_KEY: string;
  NOTION_API_KEY: string;
  HUGGINGFACE_API_KEY?: string;
  OPERATOR_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/*', cors());

// ============================================
// HEALTH & STATUS
// ============================================

app.get('/health', async (c) => {
  return c.json({
    status: 'healthy',
    service: 'ai-workflows',
    runtime: 'cloudflare-workers',
    integrations: {
      linear: !!c.env.LINEAR_API_KEY,
      notion: !!c.env.NOTION_API_KEY,
      huggingface: !!c.env.HUGGINGFACE_API_KEY,
      workers_ai: !!c.env.AI,
    },
    infrastructure: {
      edge: 'cloudflare',
      backup: 'digitalocean-159.65.43.12',
      compute: 'raspberry-pis',
      models: 'huggingface + workers-ai',
    },
  });
});

app.get('/', async (c) => {
  return c.json({
    name: 'BlackRoad AI Workflows',
    version: '1.0.0',
    description: 'Distributed AI workflow orchestration',
    architecture: {
      edge: 'Cloudflare Workers (this)',
      backup: 'DigitalOcean Droplet',
      compute: 'Raspberry Pi cluster',
      storage: 'KV + D1',
      ai: 'Workers AI + HuggingFace',
    },
    endpoints: [
      'POST /webhooks/linear - Linear webhook receiver',
      'POST /webhooks/notion - Notion webhook receiver',
      'POST /triage/{issue_id} - Manual triage',
      'POST /generate-doc/{issue_id} - Manual doc generation',
      'GET /health - Health check',
    ],
  });
});

// ============================================
// LINEAR WEBHOOKS
// ============================================

app.post('/webhooks/linear', async (c) => {
  try {
    const payload = await c.req.json();
    const action = payload.action;
    const eventType = payload.type;

    console.log(`Linear webhook: ${eventType} - ${action}`);

    // Route to appropriate workflow
    if (eventType === 'Issue' && action === 'create') {
      return await handleAutoTriage(c, payload);
    } else if (eventType === 'Issue' && action === 'update') {
      const state = payload.data?.state?.name;
      if (state === 'Done') {
        return await handleNotionDocGeneration(c, payload);
      }
    } else if (eventType === 'Comment' && action === 'create') {
      return await handleContentModeration(c, payload);
    }

    return c.json({ message: 'Event acknowledged', action, eventType });
  } catch (error: any) {
    console.error('Linear webhook error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AUTO-TRIAGE WORKFLOW
// ============================================

async function handleAutoTriage(c: any, payload: any) {
  const issue = payload.data;
  const issueId = issue.id;
  const title = issue.title || '';
  const description = issue.description || '';

  console.log(`Auto-triaging issue: ${issueId}`);

  try {
    // Step 1: Classify using Workers AI
    const classification = await classifyIssue(c.env.AI, title, description);

    // Step 2: Generate summary
    const summary = await generateSummary(c.env.AI, title, description);

    // Step 3: Determine priority
    const priority = determinePriority(title, description, classification);

    // Step 4: Suggest labels
    const labels = suggestLabels(classification, priority);

    // Step 5: Store in KV
    await c.env.WORKFLOW_STATE.put(
      `triage:${issueId}`,
      JSON.stringify({
        issueId,
        classification,
        summary,
        priority,
        labels,
        processedAt: new Date().toISOString(),
      }),
      { expirationTtl: 86400 * 30 } // 30 days
    );

    // Step 6: Record in ledger
    await recordLedgerEvent(c.env.LEDGER, {
      event: 'auto_triage',
      issueId,
      classification,
      priority,
      labels,
    });

    const result = {
      success: true,
      issueId,
      actions: [
        `Classified as: ${classification.type}`,
        `Assigned priority: ${priority}`,
        `Suggested labels: ${labels.join(', ')}`,
        'Generated AI summary',
      ],
      classification,
      summary,
      priority,
      labels,
    };

    // Step 7: Offload to backup infrastructure if needed
    if (shouldOffloadToBackup(classification)) {
      await offloadToDroplet(c.env.OPERATOR_URL, issueId, result);
    }

    return c.json(result);
  } catch (error: any) {
    console.error(`Auto-triage failed for ${issueId}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// ============================================
// NOTION DOC GENERATION
// ============================================

async function handleNotionDocGeneration(c: any, payload: any) {
  const issue = payload.data;
  const issueId = issue.id;

  console.log(`Generating Notion doc for: ${issueId}`);

  try {
    // Step 1: Generate feature spec using Workers AI
    const featureSpec = await generateFeatureSpec(
      c.env.AI,
      issue.title,
      issue.description
    );

    // Step 2: Create Notion page (via API)
    const notionPage = await createNotionPage(
      c.env.NOTION_API_KEY,
      issue.title,
      featureSpec,
      issue.url
    );

    // Step 3: Store in KV
    await c.env.WORKFLOW_STATE.put(
      `notion:${issueId}`,
      JSON.stringify({
        issueId,
        notionPageId: notionPage.id,
        processedAt: new Date().toISOString(),
      }),
      { expirationTtl: 86400 * 30 }
    );

    // Step 4: Record in ledger
    await recordLedgerEvent(c.env.LEDGER, {
      event: 'notion_doc_generated',
      issueId,
      notionPageId: notionPage.id,
    });

    return c.json({
      success: true,
      issueId,
      notionPageId: notionPage.id,
      notionUrl: notionPage.url,
      actions: ['Generated feature spec', 'Created Notion page'],
    });
  } catch (error: any) {
    console.error(`Notion doc generation failed for ${issueId}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// ============================================
// CONTENT MODERATION
// ============================================

async function handleContentModeration(c: any, payload: any) {
  const comment = payload.data;
  const commentId = comment.id;
  const text = comment.body || '';

  console.log(`Moderating comment: ${commentId}`);

  try {
    // Use Workers AI for content moderation
    const moderation = await moderateContent(c.env.AI, text);

    await recordLedgerEvent(c.env.LEDGER, {
      event: 'content_moderated',
      commentId,
      isToxic: moderation.isToxic,
      score: moderation.score,
    });

    return c.json({
      success: true,
      commentId,
      moderation,
      action: moderation.isToxic ? 'flagged' : 'approved',
    });
  } catch (error: any) {
    console.error(`Content moderation failed for ${commentId}:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// ============================================
// AI FUNCTIONS (Workers AI)
// ============================================

async function classifyIssue(ai: any, title: string, description: string) {
  const text = `${title}\n${description}`.toLowerCase();

  // Simple keyword-based classification first
  const keywords = {
    bug: ['error', 'crash', 'broken', 'bug', 'issue', 'problem'],
    feature: ['feature', 'add', 'new', 'implement', 'support'],
    improvement: ['improve', 'optimize', 'enhance', 'better'],
    security: ['security', 'vulnerability', 'cve', 'exploit'],
    performance: ['slow', 'performance', 'latency', 'speed'],
  };

  for (const [type, words] of Object.entries(keywords)) {
    if (words.some((word) => text.includes(word))) {
      return { type, confidence: 0.8 };
    }
  }

  // Fallback to AI classification
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content:
            'Classify this GitHub/Linear issue as: bug, feature, improvement, security, or performance. Return only one word.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
      max_tokens: 10,
    });

    const type = response.response?.toLowerCase() || 'feature';
    return { type, confidence: 0.9 };
  } catch (error) {
    console.error('AI classification failed, defaulting to feature:', error);
    return { type: 'feature', confidence: 0.5 };
  }
}

async function generateSummary(ai: any, title: string, description: string) {
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'Summarize this issue in one concise sentence.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
      max_tokens: 100,
    });

    return response.response || `${title} - ${description.substring(0, 100)}...`;
  } catch (error) {
    console.error('Summary generation failed:', error);
    return `${title} - ${description.substring(0, 100)}...`;
  }
}

async function generateFeatureSpec(ai: any, title: string, description: string) {
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `Generate a feature specification document with these sections:
1. Overview
2. Problem Statement
3. Goals and Non-Goals
4. Proposed Solution
5. Technical Design
6. Success Metrics

Keep it concise and technical.`,
        },
        {
          role: 'user',
          content: `Feature: ${title}\n\nDescription: ${description}`,
        },
      ],
      max_tokens: 2048,
    });

    return response.response || fallbackFeatureSpec(title, description);
  } catch (error) {
    console.error('Feature spec generation failed:', error);
    return fallbackFeatureSpec(title, description);
  }
}

async function moderateContent(ai: any, text: string) {
  // Simple keyword-based moderation first
  const toxicKeywords = ['spam', 'abuse', 'offensive']; // Simplified
  const isToxic = toxicKeywords.some((kw) => text.toLowerCase().includes(kw));

  if (isToxic) {
    return { isToxic: true, score: 0.9 };
  }

  // Workers AI doesn't have built-in moderation, so use HF or simple logic
  return { isToxic: false, score: 0.1 };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function determinePriority(title: string, description: string, classification: any): string {
  const text = `${title}\n${description}`.toLowerCase();

  if (
    text.includes('critical') ||
    text.includes('security') ||
    text.includes('data loss') ||
    classification.type === 'security'
  ) {
    return 'P0';
  }

  if (text.includes('blocking') || text.includes('urgent') || text.includes('broken')) {
    return 'P1';
  }

  if (text.includes('important') || classification.type === 'feature') {
    return 'P2';
  }

  return 'P3';
}

function suggestLabels(classification: any, priority: string): string[] {
  const labels = [classification.type, priority, 'ai:triaged'];

  return labels;
}

function shouldOffloadToBackup(classification: any): boolean {
  // Offload P0/P1 issues to droplet for redundancy
  return classification.type === 'security' || classification.type === 'bug';
}

async function offloadToDroplet(operatorUrl: string, issueId: string, result: any) {
  try {
    // Send to DigitalOcean droplet backup
    await fetch(`${operatorUrl}/backup/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId, result }),
    });
    console.log(`Offloaded ${issueId} to droplet backup`);
  } catch (error) {
    console.error('Failed to offload to droplet:', error);
  }
}

function fallbackFeatureSpec(title: string, description: string): string {
  return `# ${title}

## Overview
${description}

## Problem Statement
[To be filled]

## Goals
- Goal 1
- Goal 2

## Non-Goals
- Non-goal 1

## Proposed Solution
[To be filled]

## Technical Design
[To be filled]

## Success Metrics
[To be filled]
`;
}

// ============================================
// NOTION API
// ============================================

async function createNotionPage(
  apiKey: string,
  title: string,
  content: string,
  linearUrl: string
) {
  // Simplified - in production, use full Notion API
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: 'YOUR_DATABASE_ID' }, // TODO: Set this
      properties: {
        'Name': {
          title: [{ text: { content: title } }],
        },
        'Linear Issue': {
          url: linearUrl,
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.statusText}`);
  }

  return await response.json();
}

// ============================================
// LEDGER (D1 Database)
// ============================================

async function recordLedgerEvent(db: D1Database, event: any) {
  try {
    await db
      .prepare(
        `INSERT INTO ledger (event, data, timestamp) VALUES (?, ?, ?)`
      )
      .bind(event.event, JSON.stringify(event), new Date().toISOString())
      .run();
  } catch (error) {
    console.error('Failed to record ledger event:', error);
  }
}

// ============================================
// MANUAL TRIGGERS
// ============================================

app.post('/triage/:issueId', async (c) => {
  const issueId = c.req.param('issueId');

  return c.json({
    message: 'Manual triage triggered',
    issueId,
    note: 'Would fetch from Linear API and process',
  });
});

app.post('/generate-doc/:issueId', async (c) => {
  const issueId = c.req.param('issueId');

  return c.json({
    message: 'Manual doc generation triggered',
    issueId,
    note: 'Would fetch from Linear API and generate Notion doc',
  });
});

// ============================================
// CRON JOBS
// ============================================

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    // Cleanup old KV state every 6 hours
    console.log('Running scheduled cleanup...');
    // TODO: Implement KV cleanup logic
  },
};
