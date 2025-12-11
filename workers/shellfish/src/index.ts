/**
 * BlackRoad Shellfish Worker
 * Secure terminal access and command execution proxy
 * @owner Cece
 * @system BlackRoad OS
 */

interface Env {
  SHELLFISH_API_KEY: string;
  SHELLFISH_SIGNING_SECRET: string;
  SESSIONS: KVNamespace;
  ENVIRONMENT: string;
  MAX_COMMAND_LENGTH: string;
  SESSION_TIMEOUT_MINUTES: string;
}

interface Session {
  id: string;
  user: string;
  environment: string;
  host: string;
  created_at: string;
  last_activity: string;
  commands: CommandLog[];
}

interface CommandLog {
  command: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  output?: string;
}

interface CommandRequest {
  command: string;
  environment: string;
  host?: string;
  session_id?: string;
}

interface CommandTemplate {
  name: string;
  command: string;
  description: string;
  environments: string[];
  approval_required: boolean;
}

// Predefined command templates
const COMMAND_TEMPLATES: Record<string, CommandTemplate> = {
  'health-check': {
    name: 'Health Check',
    command: 'curl -s http://localhost:8080/health | jq . && docker ps --format "table {{.Names}}\\t{{.Status}}"',
    description: 'Check service health and container status',
    environments: ['production', 'staging', 'development'],
    approval_required: false
  },
  'view-logs': {
    name: 'View Logs',
    command: 'docker logs --tail 100 {service}',
    description: 'View last 100 lines of service logs',
    environments: ['production', 'staging', 'development'],
    approval_required: false
  },
  'disk-usage': {
    name: 'Disk Usage',
    command: 'df -h && du -sh /var/log/* | sort -hr | head -20',
    description: 'Check disk usage and largest log files',
    environments: ['production', 'staging', 'development'],
    approval_required: false
  },
  'memory-usage': {
    name: 'Memory Usage',
    command: 'free -h && ps aux --sort=-%mem | head -10',
    description: 'Check memory usage and top memory consumers',
    environments: ['production', 'staging', 'development'],
    approval_required: false
  },
  'restart-service': {
    name: 'Restart Service',
    command: 'docker-compose restart {service}',
    description: 'Restart a specific service',
    environments: ['staging', 'development'],
    approval_required: true
  },
  'deploy': {
    name: 'Deploy Service',
    command: 'docker pull blackroad/{service}:{version} && docker-compose up -d --no-deps {service}',
    description: 'Deploy a new version of a service',
    environments: ['staging'],
    approval_required: true
  }
};

// Blocked commands (dangerous patterns)
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,
  /dd\s+if=\/dev\/(zero|random)/,
  /mkfs/,
  />\s*\/dev\/(sda|hda|nvme)/,
  /shutdown/,
  /reboot/,
  /init\s+0/,
  /:()\s*{\s*:\s*\|\s*:&\s*};\s*:/,  // Fork bomb
  /chmod\s+-R\s+777\s+\//,
  /chown\s+-R.*\s+\//
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Session-ID',
      'X-Served-By': 'blackroad-shellfish',
      'X-BR-Operator': 'cece.operator.v1'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Verify API key for non-health endpoints
    const apiKey = request.headers.get('X-API-Key');
    const path = url.pathname;

    if (path !== '/health' && path !== '/' && apiKey !== env.SHELLFISH_API_KEY) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    try {
      // GET /health
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'healthy',
          service: 'blackroad-shellfish',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
          endpoints: [
            'POST /sessions - Create a new session',
            'GET /sessions/:id - Get session details',
            'DELETE /sessions/:id - End a session',
            'POST /execute - Execute a command',
            'GET /templates - List command templates',
            'POST /templates/:name - Execute a template',
            'GET /environments - List available environments',
            'GET /audit - View command audit log'
          ]
        }, 200, corsHeaders);
      }

      // GET /environments - List available environments
      if (path === '/environments' && request.method === 'GET') {
        return jsonResponse({
          success: true,
          environments: [
            {
              name: 'production',
              access_level: 'restricted',
              approval_required: true,
              description: 'Production servers - requires approval for most commands'
            },
            {
              name: 'staging',
              access_level: 'team',
              approval_required: false,
              description: 'Staging environment - team members can execute commands'
            },
            {
              name: 'development',
              access_level: 'all',
              approval_required: false,
              description: 'Development environment - open access'
            }
          ]
        }, 200, corsHeaders);
      }

      // GET /templates - List command templates
      if (path === '/templates' && request.method === 'GET') {
        return jsonResponse({
          success: true,
          templates: Object.entries(COMMAND_TEMPLATES).map(([id, template]) => ({
            id,
            ...template
          }))
        }, 200, corsHeaders);
      }

      // POST /sessions - Create a new session
      if (path === '/sessions' && request.method === 'POST') {
        const body = await request.json() as { user: string; environment: string; host?: string };
        const session = await createSession(env, body);
        return jsonResponse(session, 201, corsHeaders);
      }

      // GET /sessions/:id - Get session details
      if (path.match(/^\/sessions\/[^/]+$/) && request.method === 'GET') {
        const sessionId = path.split('/')[2];
        const session = await getSession(env, sessionId);
        return jsonResponse(session, session.success ? 200 : 404, corsHeaders);
      }

      // DELETE /sessions/:id - End a session
      if (path.match(/^\/sessions\/[^/]+$/) && request.method === 'DELETE') {
        const sessionId = path.split('/')[2];
        const result = await endSession(env, sessionId);
        return jsonResponse(result, 200, corsHeaders);
      }

      // POST /execute - Execute a command
      if (path === '/execute' && request.method === 'POST') {
        const body = await request.json() as CommandRequest;
        const result = await executeCommand(env, body);
        return jsonResponse(result, result.success ? 200 : 400, corsHeaders);
      }

      // POST /templates/:name - Execute a template
      if (path.match(/^\/templates\/[^/]+$/) && request.method === 'POST') {
        const templateName = path.split('/')[2];
        const body = await request.json() as { environment: string; params?: Record<string, string> };
        const result = await executeTemplate(env, templateName, body);
        return jsonResponse(result, result.success ? 200 : 400, corsHeaders);
      }

      // POST /validate - Validate a command without executing
      if (path === '/validate' && request.method === 'POST') {
        const body = await request.json() as { command: string; environment: string };
        const result = validateCommand(body.command, body.environment);
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /audit - Get audit log
      if (path === '/audit' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const audit = await getAuditLog(env, limit);
        return jsonResponse(audit, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      return jsonResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500, corsHeaders);
    }
  }
};

// Helper functions
function jsonResponse(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function validateCommand(command: string, environment: string): { valid: boolean; reason?: string; approval_required?: boolean } {
  // Check length
  if (command.length > 10000) {
    return { valid: false, reason: 'Command exceeds maximum length' };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { valid: false, reason: 'Command contains blocked pattern' };
    }
  }

  // Production requires approval for most commands
  const safeCommands = ['docker ps', 'docker logs', 'df ', 'free ', 'uptime', 'curl.*health', 'tail.*log'];
  const isSafe = safeCommands.some(safe => new RegExp(safe).test(command));

  if (environment === 'production' && !isSafe) {
    return { valid: true, approval_required: true };
  }

  return { valid: true, approval_required: false };
}

async function createSession(env: Env, data: { user: string; environment: string; host?: string }) {
  const sessionId = generateSessionId();
  const session: Session = {
    id: sessionId,
    user: data.user,
    environment: data.environment,
    host: data.host || 'default',
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    commands: []
  };

  const ttl = parseInt(env.SESSION_TIMEOUT_MINUTES) * 60;
  await env.SESSIONS.put(sessionId, JSON.stringify(session), { expirationTtl: ttl });

  return {
    success: true,
    session: {
      id: sessionId,
      environment: data.environment,
      host: session.host,
      expires_in_minutes: parseInt(env.SESSION_TIMEOUT_MINUTES)
    }
  };
}

async function getSession(env: Env, sessionId: string) {
  const sessionData = await env.SESSIONS.get(sessionId);

  if (!sessionData) {
    return { success: false, error: 'Session not found or expired' };
  }

  const session = JSON.parse(sessionData) as Session;
  return {
    success: true,
    session: {
      id: session.id,
      user: session.user,
      environment: session.environment,
      host: session.host,
      created_at: session.created_at,
      last_activity: session.last_activity,
      command_count: session.commands.length
    }
  };
}

async function endSession(env: Env, sessionId: string) {
  const sessionData = await env.SESSIONS.get(sessionId);

  if (!sessionData) {
    return { success: false, error: 'Session not found' };
  }

  // Log session end to audit
  const session = JSON.parse(sessionData) as Session;
  await logToAudit(env, {
    event: 'session_ended',
    session_id: sessionId,
    user: session.user,
    environment: session.environment,
    command_count: session.commands.length,
    timestamp: new Date().toISOString()
  });

  await env.SESSIONS.delete(sessionId);

  return {
    success: true,
    message: 'Session ended',
    commands_executed: session.commands.length
  };
}

async function executeCommand(env: Env, data: CommandRequest) {
  // Validate command
  const validation = validateCommand(data.command, data.environment);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
      command: data.command
    };
  }

  if (validation.approval_required) {
    return {
      success: false,
      error: 'This command requires approval in production',
      approval_required: true,
      command: data.command
    };
  }

  // Log command to session if session_id provided
  if (data.session_id) {
    await logCommandToSession(env, data.session_id, data.command);
  }

  // Log to audit
  await logToAudit(env, {
    event: 'command_executed',
    command: data.command,
    environment: data.environment,
    host: data.host,
    session_id: data.session_id,
    timestamp: new Date().toISOString()
  });

  // In a real implementation, this would connect to the actual shell service
  // For now, return a simulated response
  return {
    success: true,
    message: 'Command queued for execution',
    command: data.command,
    environment: data.environment,
    execution_id: `exec_${Date.now()}`,
    note: 'Connect to actual Shellfish backend to execute commands'
  };
}

async function executeTemplate(env: Env, templateName: string, data: { environment: string; params?: Record<string, string> }) {
  const template = COMMAND_TEMPLATES[templateName];

  if (!template) {
    return { success: false, error: `Template '${templateName}' not found` };
  }

  if (!template.environments.includes(data.environment)) {
    return {
      success: false,
      error: `Template '${templateName}' is not available in ${data.environment}`,
      available_environments: template.environments
    };
  }

  // Substitute parameters
  let command = template.command;
  if (data.params) {
    for (const [key, value] of Object.entries(data.params)) {
      command = command.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }

  // Check for unsubstituted parameters
  const unsubstituted = command.match(/\{[^}]+\}/g);
  if (unsubstituted) {
    return {
      success: false,
      error: 'Missing required parameters',
      missing: unsubstituted.map(p => p.slice(1, -1))
    };
  }

  if (template.approval_required) {
    return {
      success: false,
      error: 'This template requires approval',
      approval_required: true,
      template: templateName,
      command: command
    };
  }

  return executeCommand(env, {
    command: command,
    environment: data.environment
  });
}

async function logCommandToSession(env: Env, sessionId: string, command: string) {
  const sessionData = await env.SESSIONS.get(sessionId);
  if (!sessionData) return;

  const session = JSON.parse(sessionData) as Session;
  session.commands.push({
    command,
    timestamp: new Date().toISOString(),
    status: 'pending'
  });
  session.last_activity = new Date().toISOString();

  const ttl = parseInt(env.SESSION_TIMEOUT_MINUTES) * 60;
  await env.SESSIONS.put(sessionId, JSON.stringify(session), { expirationTtl: ttl });
}

async function logToAudit(env: Env, entry: Record<string, any>) {
  // Get existing audit log
  const auditData = await env.SESSIONS.get('audit_log');
  const auditLog: any[] = auditData ? JSON.parse(auditData) : [];

  // Add new entry
  auditLog.unshift(entry);

  // Keep last 1000 entries
  if (auditLog.length > 1000) {
    auditLog.length = 1000;
  }

  await env.SESSIONS.put('audit_log', JSON.stringify(auditLog));
}

async function getAuditLog(env: Env, limit: number) {
  const auditData = await env.SESSIONS.get('audit_log');
  const auditLog: any[] = auditData ? JSON.parse(auditData) : [];

  return {
    success: true,
    count: Math.min(limit, auditLog.length),
    total: auditLog.length,
    entries: auditLog.slice(0, limit)
  };
}
