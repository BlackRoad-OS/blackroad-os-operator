/**
 * BlackRoad DigitalOcean Manager Worker
 * Manages droplets, domains, and DO infrastructure
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

interface Env {
  DO_API_TOKEN: string;
}

const DO_API = 'https://api.digitalocean.com/v2';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'X-Served-By': 'blackroad-do-manager'
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
          service: 'blackroad-do-manager',
          timestamp: new Date().toISOString(),
          endpoints: [
            'GET /droplets - List all droplets',
            'GET /droplets/:id - Get droplet details',
            'POST /droplets/:id/power-on - Power on droplet',
            'POST /droplets/:id/power-off - Power off droplet',
            'POST /droplets/:id/reboot - Reboot droplet',
            'GET /account - Account info',
            'GET /ssh-keys - List SSH keys'
          ]
        }, 200, corsHeaders);
      }

      // GET /account
      if (path === '/account' && request.method === 'GET') {
        const account = await getAccount(env);
        return jsonResponse(account, 200, corsHeaders);
      }

      // GET /droplets - List all droplets
      if (path === '/droplets' && request.method === 'GET') {
        const droplets = await listDroplets(env);
        return jsonResponse(droplets, 200, corsHeaders);
      }

      // GET /droplets/:id - Get specific droplet
      if (path.match(/^\/droplets\/\d+$/) && request.method === 'GET') {
        const dropletId = path.split('/').pop()!;
        const droplet = await getDroplet(env, dropletId);
        return jsonResponse(droplet, 200, corsHeaders);
      }

      // POST /droplets/:id/power-on
      if (path.match(/^\/droplets\/\d+\/power-on$/) && request.method === 'POST') {
        const dropletId = path.split('/')[2];
        const result = await dropletAction(env, dropletId, 'power_on');
        return jsonResponse(result, 200, corsHeaders);
      }

      // POST /droplets/:id/power-off
      if (path.match(/^\/droplets\/\d+\/power-off$/) && request.method === 'POST') {
        const dropletId = path.split('/')[2];
        const result = await dropletAction(env, dropletId, 'power_off');
        return jsonResponse(result, 200, corsHeaders);
      }

      // POST /droplets/:id/reboot
      if (path.match(/^\/droplets\/\d+\/reboot$/) && request.method === 'POST') {
        const dropletId = path.split('/')[2];
        const result = await dropletAction(env, dropletId, 'reboot');
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /ssh-keys
      if (path === '/ssh-keys' && request.method === 'GET') {
        const keys = await listSSHKeys(env);
        return jsonResponse(keys, 200, corsHeaders);
      }

      // POST /droplets/:id/snapshot
      if (path.match(/^\/droplets\/\d+\/snapshot$/) && request.method === 'POST') {
        const dropletId = path.split('/')[2];
        const body = await request.json() as { name?: string };
        const result = await createSnapshot(env, dropletId, body.name);
        return jsonResponse(result, 200, corsHeaders);
      }

      // GET /snapshots
      if (path === '/snapshots' && request.method === 'GET') {
        const snapshots = await listSnapshots(env);
        return jsonResponse(snapshots, 200, corsHeaders);
      }

      // POST /power-on-codex - Quick power on codex-infinity
      if (path === '/power-on-codex' && request.method === 'POST') {
        const result = await powerOnCodexInfinity(env);
        return jsonResponse(result, 200, corsHeaders);
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

function jsonResponse(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function doFetch(env: Env, endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${DO_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.DO_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

async function getAccount(env: Env) {
  const data = await doFetch(env, '/account') as any;
  return {
    success: true,
    account: {
      email: data.account?.email,
      droplet_limit: data.account?.droplet_limit,
      floating_ip_limit: data.account?.floating_ip_limit,
      status: data.account?.status,
      uuid: data.account?.uuid
    }
  };
}

async function listDroplets(env: Env) {
  const data = await doFetch(env, '/droplets') as any;

  if (!data.droplets) {
    return { success: false, error: 'Failed to fetch droplets' };
  }

  return {
    success: true,
    count: data.droplets.length,
    droplets: data.droplets.map((d: any) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      ip: d.networks?.v4?.find((n: any) => n.type === 'public')?.ip_address,
      private_ip: d.networks?.v4?.find((n: any) => n.type === 'private')?.ip_address,
      region: d.region?.slug,
      size: d.size_slug,
      memory: d.memory,
      vcpus: d.vcpus,
      disk: d.disk,
      created_at: d.created_at
    }))
  };
}

async function getDroplet(env: Env, dropletId: string) {
  const data = await doFetch(env, `/droplets/${dropletId}`) as any;

  if (!data.droplet) {
    return { success: false, error: 'Droplet not found' };
  }

  const d = data.droplet;
  return {
    success: true,
    droplet: {
      id: d.id,
      name: d.name,
      status: d.status,
      ip: d.networks?.v4?.find((n: any) => n.type === 'public')?.ip_address,
      private_ip: d.networks?.v4?.find((n: any) => n.type === 'private')?.ip_address,
      region: d.region?.slug,
      size: d.size_slug,
      image: d.image?.name,
      memory: d.memory,
      vcpus: d.vcpus,
      disk: d.disk,
      created_at: d.created_at,
      features: d.features,
      tags: d.tags
    }
  };
}

async function dropletAction(env: Env, dropletId: string, action: string) {
  const data = await doFetch(env, `/droplets/${dropletId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ type: action })
  }) as any;

  if (!data.action) {
    return { success: false, error: 'Action failed', details: data };
  }

  return {
    success: true,
    action: {
      id: data.action.id,
      type: data.action.type,
      status: data.action.status,
      started_at: data.action.started_at
    },
    message: `Droplet ${action.replace('_', ' ')} initiated`
  };
}

async function listSSHKeys(env: Env) {
  const data = await doFetch(env, '/account/keys') as any;

  return {
    success: true,
    keys: data.ssh_keys?.map((k: any) => ({
      id: k.id,
      name: k.name,
      fingerprint: k.fingerprint
    })) || []
  };
}

async function createSnapshot(env: Env, dropletId: string, name?: string) {
  const snapshotName = name || `blackroad-snapshot-${new Date().toISOString().split('T')[0]}`;

  const data = await doFetch(env, `/droplets/${dropletId}/actions`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'snapshot',
      name: snapshotName
    })
  }) as any;

  return {
    success: !!data.action,
    action: data.action,
    snapshot_name: snapshotName
  };
}

async function listSnapshots(env: Env) {
  const data = await doFetch(env, '/snapshots?resource_type=droplet') as any;

  return {
    success: true,
    snapshots: data.snapshots?.map((s: any) => ({
      id: s.id,
      name: s.name,
      created_at: s.created_at,
      size_gigabytes: s.size_gigabytes,
      regions: s.regions
    })) || []
  };
}

async function powerOnCodexInfinity(env: Env) {
  // First find the codex-infinity droplet
  const droplets = await listDroplets(env);

  if (!droplets.success) {
    return { success: false, error: 'Failed to list droplets' };
  }

  const codex = droplets.droplets.find((d: any) =>
    d.name === 'codex-infinity' || d.ip === '159.65.43.12'
  );

  if (!codex) {
    return { success: false, error: 'codex-infinity droplet not found' };
  }

  if (codex.status === 'active') {
    return {
      success: true,
      message: 'codex-infinity is already running',
      droplet: codex
    };
  }

  // Power it on
  const result = await dropletAction(env, codex.id.toString(), 'power_on');

  return {
    ...result,
    droplet: codex
  };
}
