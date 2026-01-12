/**
 * BlackRoad GitHub Deploy Worker
 *
 * Receives GitHub webhooks and triggers deployments to Pi cluster:
 * - Push events → K3s (alice) deployment
 * - Release events → Production rollout
 * - PR events → Preview deployments
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface Env {
  DEPLOYMENTS: KVNamespace;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  K3S_MASTER: string;
  GITHUB_WEBHOOK_SECRET?: string;
}

interface GitHubPushEvent {
  ref: string;
  repository: {
    name: string;
    full_name: string;
    clone_url: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: { name: string; email: string };
  };
  pusher: { name: string };
}

interface Deployment {
  id: string;
  repo: string;
  branch: string;
  commit: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  target: string;
  createdAt: string;
  updatedAt: string;
  logs?: string[];
}

const PI_ENDPOINTS = {
  alice: 'http://192.168.4.49:6443',    // K3s API
  lucidia: 'http://192.168.4.38:8889',
  octavia: 'http://192.168.4.74:8080',
  aria: 'http://192.168.4.64:8080',
};

// Repo → Target mapping
const DEPLOY_TARGETS: Record<string, { target: string; namespace: string; type: string }> = {
  'blackroad-salesforce-agent': { target: 'lucidia', namespace: 'salesforce', type: 'systemd' },
  'blackroad-os-operator': { target: 'alice', namespace: 'operator', type: 'k3s' },
  'blackroad-os-api': { target: 'alice', namespace: 'api', type: 'k3s' },
  'blackroad-os-web': { target: 'cloudflare', namespace: 'pages', type: 'pages' },
  'blackroad-ai-models': { target: 'octavia', namespace: 'ai', type: 'docker' },
  'blackroad-agents': { target: 'aria', namespace: 'agents', type: 'docker' },
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256, X-GitHub-Event',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case '/':
        case '/health':
          return Response.json({
            status: 'ok',
            service: 'blackroad-github-deploy',
            k3s_master: env.K3S_MASTER,
            timestamp: new Date().toISOString(),
            endpoints: {
              webhook: '/webhook',
              deployments: '/deployments',
              trigger: '/trigger',
              status: '/status/:id',
            },
          }, { headers: corsHeaders });

        case '/webhook':
          return await handleGitHubWebhook(request, env, ctx);

        case '/deployments':
          return await listDeployments(env);

        case '/trigger':
          return await manualTrigger(request, env);

        default:
          if (url.pathname.startsWith('/status/')) {
            const id = url.pathname.split('/')[2];
            return await getDeploymentStatus(id, env);
          }
          return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Deploy error:', error);
      return Response.json(
        { error: 'Internal error', message: String(error) },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

async function handleGitHubWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const event = request.headers.get('X-GitHub-Event');
  const signature = request.headers.get('X-Hub-Signature-256');
  const body = await request.text();

  // Verify signature if secret is set
  if (env.GITHUB_WEBHOOK_SECRET && signature) {
    const isValid = await verifySignature(body, signature, env.GITHUB_WEBHOOK_SECRET);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);

  console.log(`GitHub event: ${event}`, payload.repository?.name);

  switch (event) {
    case 'push':
      return await handlePush(payload as GitHubPushEvent, env, ctx);

    case 'release':
      return await handleRelease(payload, env, ctx);

    case 'pull_request':
      return await handlePullRequest(payload, env, ctx);

    case 'ping':
      return Response.json({
        success: true,
        message: 'Pong! Webhook configured successfully.',
        zen: payload.zen,
      });

    default:
      return Response.json({
        success: true,
        message: `Event ${event} received but not processed`,
      });
  }
}

async function handlePush(event: GitHubPushEvent, env: Env, ctx: ExecutionContext): Promise<Response> {
  const repo = event.repository.name;
  const branch = event.ref.replace('refs/heads/', '');
  const commit = event.head_commit.id.substring(0, 7);

  // Only deploy main/master branches
  if (!['main', 'master'].includes(branch)) {
    return Response.json({
      success: true,
      message: `Branch ${branch} is not a deploy target`,
      skipped: true,
    });
  }

  const config = DEPLOY_TARGETS[repo];
  if (!config) {
    return Response.json({
      success: true,
      message: `Repository ${repo} not configured for auto-deploy`,
      skipped: true,
    });
  }

  // Create deployment record
  const deployment: Deployment = {
    id: `deploy_${Date.now()}_${commit}`,
    repo,
    branch,
    commit: event.head_commit.id,
    status: 'pending',
    target: config.target,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [`Deployment triggered by push from ${event.pusher.name}`],
  };

  await env.DEPLOYMENTS.put(deployment.id, JSON.stringify(deployment), {
    expirationTtl: 86400 * 30, // 30 days
  });

  // Trigger deployment asynchronously
  ctx.waitUntil(executeDeployment(deployment, config, env));

  return Response.json({
    success: true,
    deployment: deployment.id,
    repo,
    branch,
    commit,
    target: config.target,
    type: config.type,
  });
}

async function executeDeployment(
  deployment: Deployment,
  config: { target: string; namespace: string; type: string },
  env: Env
): Promise<void> {
  deployment.status = 'deploying';
  deployment.updatedAt = new Date().toISOString();
  deployment.logs?.push(`Starting ${config.type} deployment to ${config.target}`);
  await env.DEPLOYMENTS.put(deployment.id, JSON.stringify(deployment));

  try {
    let result: any;

    switch (config.type) {
      case 'k3s':
        result = await deployToK3s(deployment, config, env);
        break;

      case 'docker':
        result = await deployDocker(deployment, config, env);
        break;

      case 'systemd':
        result = await deploySystemd(deployment, config, env);
        break;

      case 'pages':
        // Cloudflare Pages auto-deploys from GitHub
        result = { message: 'Cloudflare Pages handles this automatically' };
        break;

      default:
        throw new Error(`Unknown deployment type: ${config.type}`);
    }

    deployment.status = 'success';
    deployment.logs?.push(`Deployment completed: ${JSON.stringify(result)}`);
  } catch (error) {
    deployment.status = 'failed';
    deployment.logs?.push(`Deployment failed: ${String(error)}`);
  }

  deployment.updatedAt = new Date().toISOString();
  await env.DEPLOYMENTS.put(deployment.id, JSON.stringify(deployment));
}

async function deployToK3s(
  deployment: Deployment,
  config: { target: string; namespace: string },
  env: Env
): Promise<any> {
  // Trigger kubectl rollout on alice
  const endpoint = PI_ENDPOINTS.alice;

  deployment.logs?.push(`Triggering K3s rollout on ${endpoint}`);

  // This would call alice's deploy API
  const response = await fetch(`http://192.168.4.49:8888/api/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'rollout',
      namespace: config.namespace,
      deployment: deployment.repo,
      image: `blackroad/${deployment.repo}:${deployment.commit.substring(0, 7)}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`K3s deploy failed: ${response.status}`);
  }

  return await response.json();
}

async function deployDocker(
  deployment: Deployment,
  config: { target: string; namespace: string },
  env: Env
): Promise<any> {
  const endpoint = PI_ENDPOINTS[config.target as keyof typeof PI_ENDPOINTS];

  deployment.logs?.push(`Triggering Docker deploy on ${config.target}`);

  const response = await fetch(`${endpoint}/api/docker/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: deployment.repo,
      commit: deployment.commit,
      namespace: config.namespace,
    }),
  });

  if (!response.ok) {
    throw new Error(`Docker deploy failed: ${response.status}`);
  }

  return await response.json();
}

async function deploySystemd(
  deployment: Deployment,
  config: { target: string; namespace: string },
  env: Env
): Promise<any> {
  const endpoint = PI_ENDPOINTS[config.target as keyof typeof PI_ENDPOINTS];

  deployment.logs?.push(`Triggering systemd update on ${config.target}`);

  const response = await fetch(`${endpoint}/api/systemd/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: deployment.repo,
      repo: `https://github.com/BlackRoad-OS/${deployment.repo}`,
      commit: deployment.commit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Systemd deploy failed: ${response.status}`);
  }

  return await response.json();
}

async function handleRelease(payload: any, env: Env, ctx: ExecutionContext): Promise<Response> {
  const repo = payload.repository.name;
  const release = payload.release;

  return Response.json({
    success: true,
    message: `Release ${release.tag_name} received for ${repo}`,
    action: payload.action,
  });
}

async function handlePullRequest(payload: any, env: Env, ctx: ExecutionContext): Promise<Response> {
  const repo = payload.repository.name;
  const pr = payload.pull_request;

  return Response.json({
    success: true,
    message: `PR #${pr.number} ${payload.action} for ${repo}`,
  });
}

async function listDeployments(env: Env): Promise<Response> {
  const list = await env.DEPLOYMENTS.list({ limit: 50 });
  const deployments: Deployment[] = [];

  for (const key of list.keys) {
    const data = await env.DEPLOYMENTS.get(key.name);
    if (data) {
      deployments.push(JSON.parse(data));
    }
  }

  return Response.json({
    count: deployments.length,
    deployments: deployments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
}

async function getDeploymentStatus(id: string, env: Env): Promise<Response> {
  const data = await env.DEPLOYMENTS.get(id);

  if (!data) {
    return Response.json({ error: 'Deployment not found' }, { status: 404 });
  }

  return Response.json(JSON.parse(data));
}

async function manualTrigger(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { repo, branch, commit } = await request.json() as any;

  if (!repo) {
    return Response.json({ error: 'repo required' }, { status: 400 });
  }

  // Create synthetic push event
  const event: GitHubPushEvent = {
    ref: `refs/heads/${branch || 'main'}`,
    repository: {
      name: repo,
      full_name: `BlackRoad-OS/${repo}`,
      clone_url: `https://github.com/BlackRoad-OS/${repo}.git`,
    },
    head_commit: {
      id: commit || 'manual',
      message: 'Manual trigger',
      author: { name: 'Manual', email: 'manual@blackroad.io' },
    },
    pusher: { name: 'manual-trigger' },
  };

  return await handlePush(event, env, { waitUntil: () => {} } as any);
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = 'sha256=' + Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}
