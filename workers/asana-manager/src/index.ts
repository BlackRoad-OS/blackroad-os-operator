/**
 * BlackRoad Asana Manager Worker
 * Manages projects, tasks, and deployment tracking in Asana
 * @owner Cece
 * @system BlackRoad OS
 */

interface Env {
  ASANA_ACCESS_TOKEN: string;
  ASANA_WORKSPACE_ID: string;
}

const ASANA_API = 'https://app.asana.com/api/1.0';

// Project GIDs - these should be configured per workspace
const PROJECTS = {
  DEPLOYMENTS: 'operator-deployments',
  INCIDENTS: 'incidents',
  SPRINT: 'sprint-tracking'
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-Served-By': 'blackroad-asana-manager',
      'X-BR-Operator': 'cece.operator.v1'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // GET /health
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'healthy',
          service: 'blackroad-asana-manager',
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /me - Current user info',
            'GET /workspaces - List workspaces',
            'GET /projects - List projects',
            'GET /projects/:gid/tasks - List tasks in project',
            'POST /tasks - Create a task',
            'PUT /tasks/:gid - Update a task',
            'POST /deployments - Track a deployment',
            'POST /incidents - Create an incident',
            'POST /webhooks/deployment - Deployment webhook'
          ]
        }, 200, corsHeaders);
      }

      // GET /me - Current user info
      if (path === '/me' && request.method === 'GET') {
        const user = await getCurrentUser(env);
        return jsonResponse(user, 200, corsHeaders);
      }

      // GET /workspaces
      if (path === '/workspaces' && request.method === 'GET') {
        const workspaces = await listWorkspaces(env);
        return jsonResponse(workspaces, 200, corsHeaders);
      }

      // GET /projects
      if (path === '/projects' && request.method === 'GET') {
        const projects = await listProjects(env);
        return jsonResponse(projects, 200, corsHeaders);
      }

      // GET /projects/:gid/tasks
      if (path.match(/^\/projects\/[^/]+\/tasks$/) && request.method === 'GET') {
        const projectGid = path.split('/')[2];
        const tasks = await listProjectTasks(env, projectGid);
        return jsonResponse(tasks, 200, corsHeaders);
      }

      // POST /tasks - Create a task
      if (path === '/tasks' && request.method === 'POST') {
        const body = await request.json() as CreateTaskRequest;
        const task = await createTask(env, body);
        return jsonResponse(task, 201, corsHeaders);
      }

      // PUT /tasks/:gid - Update a task
      if (path.match(/^\/tasks\/[^/]+$/) && request.method === 'PUT') {
        const taskGid = path.split('/')[2];
        const body = await request.json() as UpdateTaskRequest;
        const task = await updateTask(env, taskGid, body);
        return jsonResponse(task, 200, corsHeaders);
      }

      // POST /tasks/:gid/complete - Complete a task
      if (path.match(/^\/tasks\/[^/]+\/complete$/) && request.method === 'POST') {
        const taskGid = path.split('/')[2];
        const task = await completeTask(env, taskGid);
        return jsonResponse(task, 200, corsHeaders);
      }

      // POST /deployments - Track a deployment
      if (path === '/deployments' && request.method === 'POST') {
        const body = await request.json() as DeploymentRequest;
        const result = await trackDeployment(env, body);
        return jsonResponse(result, 201, corsHeaders);
      }

      // POST /deployments/:gid/status - Update deployment status
      if (path.match(/^\/deployments\/[^/]+\/status$/) && request.method === 'POST') {
        const taskGid = path.split('/')[2];
        const body = await request.json() as DeploymentStatusUpdate;
        const result = await updateDeploymentStatus(env, taskGid, body);
        return jsonResponse(result, 200, corsHeaders);
      }

      // POST /incidents - Create an incident
      if (path === '/incidents' && request.method === 'POST') {
        const body = await request.json() as IncidentRequest;
        const result = await createIncident(env, body);
        return jsonResponse(result, 201, corsHeaders);
      }

      // POST /webhooks/deployment - Deployment webhook from GitHub Actions
      if (path === '/webhooks/deployment' && request.method === 'POST') {
        const body = await request.json() as WebhookPayload;
        const result = await handleDeploymentWebhook(env, body);
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /sections/:project - Get sections for a project
      if (path.match(/^\/sections\/[^/]+$/) && request.method === 'GET') {
        const projectGid = path.split('/')[2];
        const sections = await listSections(env, projectGid);
        return jsonResponse(sections, 200, corsHeaders);
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

// Types
interface CreateTaskRequest {
  name: string;
  project?: string;
  section?: string;
  notes?: string;
  due_on?: string;
  assignee?: string;
  custom_fields?: Record<string, string>;
}

interface UpdateTaskRequest {
  name?: string;
  notes?: string;
  due_on?: string;
  completed?: boolean;
  custom_fields?: Record<string, string>;
}

interface DeploymentRequest {
  service: string;
  environment: string;
  platform: string;
  commit_sha: string;
  triggered_by?: string;
  deploy_url?: string;
}

interface DeploymentStatusUpdate {
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled_back';
  message?: string;
}

interface IncidentRequest {
  title: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  description?: string;
  affected_services?: string[];
}

interface WebhookPayload {
  event: string;
  service?: string;
  environment?: string;
  platform?: string;
  commit_sha?: string;
  status?: string;
  triggered_by?: string;
  deploy_url?: string;
}

// Helper functions
function jsonResponse(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function asanaFetch(env: Env, endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${ASANA_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.ASANA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

async function getCurrentUser(env: Env) {
  const data = await asanaFetch(env, '/users/me') as any;
  return {
    success: true,
    user: {
      gid: data.data?.gid,
      name: data.data?.name,
      email: data.data?.email
    }
  };
}

async function listWorkspaces(env: Env) {
  const data = await asanaFetch(env, '/workspaces') as any;
  return {
    success: true,
    workspaces: data.data?.map((w: any) => ({
      gid: w.gid,
      name: w.name
    })) || []
  };
}

async function listProjects(env: Env) {
  const data = await asanaFetch(env, `/workspaces/${env.ASANA_WORKSPACE_ID}/projects`) as any;
  return {
    success: true,
    projects: data.data?.map((p: any) => ({
      gid: p.gid,
      name: p.name
    })) || []
  };
}

async function listProjectTasks(env: Env, projectGid: string) {
  const data = await asanaFetch(env, `/projects/${projectGid}/tasks?opt_fields=name,completed,due_on,assignee,notes`) as any;
  return {
    success: true,
    tasks: data.data?.map((t: any) => ({
      gid: t.gid,
      name: t.name,
      completed: t.completed,
      due_on: t.due_on,
      assignee: t.assignee?.name,
      notes: t.notes
    })) || []
  };
}

async function listSections(env: Env, projectGid: string) {
  const data = await asanaFetch(env, `/projects/${projectGid}/sections`) as any;
  return {
    success: true,
    sections: data.data?.map((s: any) => ({
      gid: s.gid,
      name: s.name
    })) || []
  };
}

async function createTask(env: Env, taskData: CreateTaskRequest) {
  const payload: any = {
    data: {
      name: taskData.name,
      workspace: env.ASANA_WORKSPACE_ID,
      notes: taskData.notes
    }
  };

  if (taskData.project) {
    payload.data.projects = [taskData.project];
  }

  if (taskData.due_on) {
    payload.data.due_on = taskData.due_on;
  }

  if (taskData.assignee) {
    payload.data.assignee = taskData.assignee;
  }

  const data = await asanaFetch(env, '/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  }) as any;

  // Move to section if specified
  if (taskData.section && data.data?.gid) {
    await asanaFetch(env, `/sections/${taskData.section}/addTask`, {
      method: 'POST',
      body: JSON.stringify({ data: { task: data.data.gid } })
    });
  }

  return {
    success: !!data.data,
    task: data.data ? {
      gid: data.data.gid,
      name: data.data.name,
      permalink_url: data.data.permalink_url
    } : null,
    error: data.errors?.[0]?.message
  };
}

async function updateTask(env: Env, taskGid: string, updates: UpdateTaskRequest) {
  const data = await asanaFetch(env, `/tasks/${taskGid}`, {
    method: 'PUT',
    body: JSON.stringify({ data: updates })
  }) as any;

  return {
    success: !!data.data,
    task: data.data ? {
      gid: data.data.gid,
      name: data.data.name,
      completed: data.data.completed
    } : null,
    error: data.errors?.[0]?.message
  };
}

async function completeTask(env: Env, taskGid: string) {
  return updateTask(env, taskGid, { completed: true });
}

async function trackDeployment(env: Env, deployment: DeploymentRequest) {
  const taskName = `Deploy: ${deployment.service} to ${deployment.environment}`;
  const notes = `## Deployment Details
- **Service:** ${deployment.service}
- **Environment:** ${deployment.environment}
- **Platform:** ${deployment.platform}
- **Commit:** ${deployment.commit_sha}
- **Triggered by:** ${deployment.triggered_by || 'automated'}
- **Time:** ${new Date().toISOString()}
${deployment.deploy_url ? `- **URL:** ${deployment.deploy_url}` : ''}`;

  // First get projects to find the deployments project
  const projects = await listProjects(env);
  const deployProject = projects.projects?.find((p: any) =>
    p.name.toLowerCase().includes('deployment') ||
    p.name.toLowerCase().includes('operator')
  );

  if (!deployProject) {
    return {
      success: false,
      error: 'Deployments project not found. Create a project with "deployment" in the name.'
    };
  }

  const task = await createTask(env, {
    name: taskName,
    project: deployProject.gid,
    notes: notes
  });

  return {
    success: task.success,
    deployment: {
      task_gid: task.task?.gid,
      service: deployment.service,
      environment: deployment.environment,
      status: 'pending'
    },
    error: task.error
  };
}

async function updateDeploymentStatus(env: Env, taskGid: string, update: DeploymentStatusUpdate) {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    deploying: 'Deploying',
    deployed: 'Deployed',
    failed: 'Failed',
    rolled_back: 'Rolled Back'
  };

  // Update task name to reflect status
  const currentTask = await asanaFetch(env, `/tasks/${taskGid}`) as any;
  let newName = currentTask.data?.name || '';

  // Add status prefix
  newName = newName.replace(/^\[(.*?)\]\s*/, '');
  newName = `[${statusMap[update.status]}] ${newName}`;

  // Add status update to notes
  const newNotes = `${currentTask.data?.notes || ''}\n\n---\n**Status Update:** ${statusMap[update.status]} at ${new Date().toISOString()}${update.message ? `\n${update.message}` : ''}`;

  const result = await updateTask(env, taskGid, {
    name: newName,
    notes: newNotes,
    completed: update.status === 'deployed'
  });

  return {
    success: result.success,
    status: update.status,
    task_gid: taskGid
  };
}

async function createIncident(env: Env, incident: IncidentRequest) {
  const taskName = `${incident.severity}: ${incident.title}`;
  const notes = `## Incident Details
- **Severity:** ${incident.severity}
- **Reported:** ${new Date().toISOString()}
${incident.affected_services?.length ? `- **Affected Services:** ${incident.affected_services.join(', ')}` : ''}

## Description
${incident.description || 'No description provided'}

## Timeline
- ${new Date().toISOString()} - Incident reported`;

  // Find incidents project
  const projects = await listProjects(env);
  const incidentProject = projects.projects?.find((p: any) =>
    p.name.toLowerCase().includes('incident') ||
    p.name.toLowerCase().includes('on-call')
  );

  if (!incidentProject) {
    return {
      success: false,
      error: 'Incidents project not found. Create a project with "incident" in the name.'
    };
  }

  const task = await createTask(env, {
    name: taskName,
    project: incidentProject.gid,
    notes: notes
  });

  return {
    success: task.success,
    incident: {
      task_gid: task.task?.gid,
      severity: incident.severity,
      title: incident.title,
      status: 'active'
    },
    error: task.error
  };
}

async function handleDeploymentWebhook(env: Env, payload: WebhookPayload) {
  if (payload.event === 'deployment_started') {
    return trackDeployment(env, {
      service: payload.service || 'unknown',
      environment: payload.environment || 'production',
      platform: payload.platform || 'unknown',
      commit_sha: payload.commit_sha || 'unknown',
      triggered_by: payload.triggered_by,
      deploy_url: payload.deploy_url
    });
  }

  if (payload.event === 'deployment_completed' || payload.event === 'deployment_failed') {
    // Would need task GID from initial deployment
    return {
      success: true,
      message: `Received ${payload.event} event`,
      note: 'To update task, include task_gid in payload'
    };
  }

  return {
    success: false,
    error: `Unknown event: ${payload.event}`
  };
}
