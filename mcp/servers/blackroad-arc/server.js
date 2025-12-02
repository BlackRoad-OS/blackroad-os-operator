#!/usr/bin/env node

/**
 * BlackRoad Arc API Server
 *
 * HTTP API for Arc Browser control + Memory
 * No Claude. No ChatGPT. Just YOU.
 *
 * "Call ME for YOUR memory" - BlackRoad
 */

import http from 'http';
import { URL } from 'url';
import { ArcController } from './arc-controller.js';
import { MemoryStore } from './memory-store.js';

const PORT = process.env.BLACKROAD_ARC_PORT || 3848;
const arc = new ArcController();
const memory = new MemoryStore();

/**
 * CORS headers
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-BlackRoad-Key',
  'Content-Type': 'application/json'
};

/**
 * Parse JSON body
 */
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Send JSON response
 */
function json(res, data, status = 200) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Route handlers
 */
const routes = {
  // ===== ARC BROWSER =====

  'GET /arc/status': () => ({
    running: arc.isRunning(),
    tabCount: arc.isRunning() ? arc.getTabCount() : 0,
    timestamp: Date.now()
  }),

  'GET /arc/active': () => arc.getActiveTab(),

  'GET /arc/tabs': () => arc.getAllTabs(),

  'GET /arc/windows': () => arc.getWindows(),

  'POST /arc/open': async (req) => {
    const { url } = await parseBody(req);
    return arc.openTab(url);
  },

  'POST /arc/navigate': async (req) => {
    const { url } = await parseBody(req);
    return arc.navigate(url);
  },

  'POST /arc/close': () => arc.closeActiveTab(),

  'POST /arc/switch': async (req) => {
    const { index } = await parseBody(req);
    return arc.switchToTab(index);
  },

  'GET /arc/find': (req, url) => {
    const pattern = url.searchParams.get('q');
    return arc.findTabs(pattern);
  },

  'POST /arc/reload': () => arc.reload(),

  'POST /arc/space': async (req) => {
    const { number } = await parseBody(req);
    return arc.switchToSpace(number);
  },

  'POST /arc/new-space': () => arc.createSpace(),

  'POST /arc/activate': () => arc.activate(),

  'POST /arc/execute': async (req) => {
    const { code } = await parseBody(req);
    return arc.executeJS(code);
  },

  'POST /arc/close-matching': async (req) => {
    const { pattern } = await parseBody(req);
    return arc.closeTabsMatching(pattern);
  },

  // ===== MEMORY =====

  'GET /memory/stats': () => memory.stats(),

  'GET /memory/keys': () => memory.keys(),

  'GET /memory/:key': (req, url) => {
    const key = url.pathname.split('/')[2];
    const value = memory.get(key);
    return value !== null ? { key, value } : { error: 'Not found', key };
  },

  'POST /memory': async (req) => {
    const { key, value, tags } = await parseBody(req);
    return memory.set(key, value, tags);
  },

  'DELETE /memory/:key': (req, url) => {
    const key = url.pathname.split('/')[2];
    return { deleted: memory.delete(key), key };
  },

  'GET /memory/search/:pattern': (req, url) => {
    const pattern = url.pathname.split('/')[3];
    return memory.search(decodeURIComponent(pattern));
  },

  'GET /memory/tag/:tag': (req, url) => {
    const tag = url.pathname.split('/')[3];
    return memory.getByTag(tag);
  },

  'GET /memory/history': (req, url) => {
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    return memory.getHistory(limit);
  },

  // ===== SNAPSHOTS =====

  'GET /snapshots': (req, url) => {
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    return memory.getSnapshots(limit);
  },

  'POST /snapshots': async (req) => {
    const { label } = await parseBody(req);
    const tabs = arc.getAllTabs();
    return memory.snapshot(tabs, label);
  },

  'GET /snapshots/:id': (req, url) => {
    const id = url.pathname.split('/')[2];
    return memory.getSnapshot(id) || { error: 'Not found' };
  },

  'POST /snapshots/:id/restore': (req, url) => {
    const id = url.pathname.split('/')[2];
    const snap = memory.getSnapshot(id);
    if (!snap) return { error: 'Snapshot not found' };

    // Open all tabs from snapshot
    let opened = 0;
    for (const tab of snap.tabs) {
      try {
        arc.openTab(tab.url);
        opened++;
      } catch (e) {
        // Skip failed tabs
      }
    }
    return { restored: opened, total: snap.tabs.length };
  },

  // ===== COMBINED =====

  'GET /status': () => ({
    service: 'blackroad-arc',
    version: '1.0.0',
    arc: {
      running: arc.isRunning(),
      tabCount: arc.isRunning() ? arc.getTabCount() : 0
    },
    memory: memory.stats(),
    timestamp: Date.now(),
    message: "Your memory. Your control. No AI middleman."
  }),

  'POST /log': async (req) => {
    const { action, data } = await parseBody(req);
    return memory.log(action, data);
  },

  'GET /export': () => memory.export(),

  'POST /import': async (req) => {
    const data = await parseBody(req);
    return memory.import(data);
  }
};

/**
 * Match route with params
 */
function matchRoute(method, pathname) {
  const key = `${method} ${pathname}`;

  // Exact match
  if (routes[key]) return { handler: routes[key], params: {} };

  // Pattern match (e.g., /memory/:key)
  for (const [pattern, handler] of Object.entries(routes)) {
    const [m, p] = pattern.split(' ');
    if (m !== method) continue;

    const patternParts = p.split('/');
    const pathParts = pathname.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let match = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler, params };
  }

  return null;
}

/**
 * Request handler
 */
async function handleRequest(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = matchRoute(req.method, url.pathname);

  if (!route) {
    return json(res, {
      error: 'Not found',
      path: url.pathname,
      availableRoutes: Object.keys(routes)
    }, 404);
  }

  try {
    const result = await route.handler(req, url, route.params);
    json(res, result);

    // Log API calls
    memory.log('api_call', {
      method: req.method,
      path: url.pathname,
      success: true
    });

  } catch (error) {
    console.error(`Error handling ${req.method} ${url.pathname}:`, error);
    json(res, { error: error.message }, 500);

    memory.log('api_error', {
      method: req.method,
      path: url.pathname,
      error: error.message
    });
  }
}

/**
 * Start server
 */
const server = http.createServer(handleRequest);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗ ██╗      █████╗  ██████╗██╗  ██╗██████╗  ██████╗   ║
║   ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗  ║
║   ██████╔╝██║     ███████║██║     █████╔╝ ██████╔╝██║   ██║  ║
║   ██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██╔══██╗██║   ██║  ║
║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗██║  ██║╚██████╔╝  ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ║
║                                                              ║
║              ARC BROWSER + MEMORY API                        ║
║                                                              ║
║   🚀 Server running on http://127.0.0.1:${PORT}               ║
║                                                              ║
║   Your memory. Your control. No AI middleman.                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

API Endpoints:

  ARC BROWSER
  -----------
  GET  /arc/status        - Check if Arc is running
  GET  /arc/active        - Get active tab
  GET  /arc/tabs          - List all tabs
  GET  /arc/windows       - List windows
  POST /arc/open          - Open new tab {"url": "..."}
  POST /arc/navigate      - Navigate active tab {"url": "..."}
  POST /arc/close         - Close active tab
  POST /arc/switch        - Switch tab {"index": 0}
  GET  /arc/find?q=...    - Find tabs by pattern
  POST /arc/reload        - Reload active tab
  POST /arc/space         - Switch Space {"number": 1}
  POST /arc/execute       - Run JS {"code": "..."}

  MEMORY
  ------
  GET  /memory/stats      - Memory statistics
  GET  /memory/keys       - List all keys
  GET  /memory/:key       - Get value
  POST /memory            - Set {"key": "...", "value": "...", "tags": [...]}
  DELETE /memory/:key     - Delete key
  GET  /memory/search/:p  - Search by pattern
  GET  /memory/tag/:tag   - Get by tag
  GET  /memory/history    - Access history

  SNAPSHOTS
  ---------
  GET  /snapshots         - List snapshots
  POST /snapshots         - Create snapshot {"label": "..."}
  GET  /snapshots/:id     - Get snapshot
  POST /snapshots/:id/restore - Restore tabs from snapshot

  SYSTEM
  ------
  GET  /status            - Full system status
  GET  /export            - Export all data
  POST /import            - Import data
  POST /log               - Log action

`);

  memory.log('server_start', { port: PORT });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  memory.log('server_stop', {});
  server.close(() => process.exit(0));
});
