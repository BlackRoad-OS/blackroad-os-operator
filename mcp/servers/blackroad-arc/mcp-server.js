#!/usr/bin/env node

/**
 * BlackRoad Arc MCP Server
 *
 * MCP wrapper for the Arc Browser + Memory API
 * Exposes Arc control and memory to Claude Code
 */

import * as readline from 'readline';
import http from 'http';

const API_BASE = 'http://127.0.0.1:3848';

/**
 * Make HTTP request to Arc API
 */
function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * MCP Tool Definitions
 */
const TOOLS = [
  // === ARC BROWSER ===
  {
    name: 'arc_status',
    description: 'Check if Arc browser is running and get tab count',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'arc_active_tab',
    description: 'Get the currently active tab URL and title in Arc',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'arc_list_tabs',
    description: 'List all open tabs in Arc browser with URLs and titles',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'arc_open_tab',
    description: 'Open a new tab in Arc browser',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to open' }
      },
      required: ['url']
    }
  },
  {
    name: 'arc_navigate',
    description: 'Navigate the active Arc tab to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' }
      },
      required: ['url']
    }
  },
  {
    name: 'arc_close_tab',
    description: 'Close the active tab in Arc',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'arc_switch_tab',
    description: 'Switch to a specific tab by index (0-based)',
    inputSchema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Tab index (0-based)' }
      },
      required: ['index']
    }
  },
  {
    name: 'arc_find_tabs',
    description: 'Search for tabs matching a URL or title pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (regex)' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'arc_switch_space',
    description: 'Switch to an Arc Space by number (1-indexed)',
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'number', description: 'Space number (1, 2, 3, etc.)' }
      },
      required: ['number']
    }
  },
  {
    name: 'arc_reload',
    description: 'Reload the active tab in Arc',
    inputSchema: { type: 'object', properties: {} }
  },

  // === MEMORY ===
  {
    name: 'memory_get',
    description: 'Retrieve a value from BlackRoad memory by key',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to retrieve' }
      },
      required: ['key']
    }
  },
  {
    name: 'memory_set',
    description: 'Store a value in BlackRoad memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { description: 'Value to store (any JSON)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags for categorization' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'memory_delete',
    description: 'Delete a key from BlackRoad memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key to delete' }
      },
      required: ['key']
    }
  },
  {
    name: 'memory_search',
    description: 'Search BlackRoad memory by pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (regex)' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'memory_list_keys',
    description: 'List all keys in BlackRoad memory',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'memory_by_tag',
    description: 'Get all memory entries with a specific tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Tag to filter by' }
      },
      required: ['tag']
    }
  },
  {
    name: 'memory_stats',
    description: 'Get BlackRoad memory statistics',
    inputSchema: { type: 'object', properties: {} }
  },

  // === SNAPSHOTS ===
  {
    name: 'snapshot_create',
    description: 'Create a snapshot of all current Arc tabs',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Optional label for the snapshot' }
      }
    }
  },
  {
    name: 'snapshot_list',
    description: 'List saved browser snapshots',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max snapshots to return (default 10)' }
      }
    }
  },
  {
    name: 'snapshot_restore',
    description: 'Restore tabs from a saved snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Snapshot ID to restore' }
      },
      required: ['id']
    }
  },

  // === SYSTEM ===
  {
    name: 'blackroad_status',
    description: 'Get full BlackRoad Arc system status (Arc + Memory)',
    inputSchema: { type: 'object', properties: {} }
  }
];

/**
 * Handle tool calls
 */
async function handleToolCall(name, args) {
  try {
    switch (name) {
      // Arc
      case 'arc_status':
        return await apiCall('GET', '/arc/status');
      case 'arc_active_tab':
        return await apiCall('GET', '/arc/active');
      case 'arc_list_tabs':
        return await apiCall('GET', '/arc/tabs');
      case 'arc_open_tab':
        return await apiCall('POST', '/arc/open', { url: args.url });
      case 'arc_navigate':
        return await apiCall('POST', '/arc/navigate', { url: args.url });
      case 'arc_close_tab':
        return await apiCall('POST', '/arc/close');
      case 'arc_switch_tab':
        return await apiCall('POST', '/arc/switch', { index: args.index });
      case 'arc_find_tabs':
        return await apiCall('GET', `/arc/find?q=${encodeURIComponent(args.pattern)}`);
      case 'arc_switch_space':
        return await apiCall('POST', '/arc/space', { number: args.number });
      case 'arc_reload':
        return await apiCall('POST', '/arc/reload');

      // Memory
      case 'memory_get':
        return await apiCall('GET', `/memory/${encodeURIComponent(args.key)}`);
      case 'memory_set':
        return await apiCall('POST', '/memory', { key: args.key, value: args.value, tags: args.tags || [] });
      case 'memory_delete':
        return await apiCall('DELETE', `/memory/${encodeURIComponent(args.key)}`);
      case 'memory_search':
        return await apiCall('GET', `/memory/search/${encodeURIComponent(args.pattern)}`);
      case 'memory_list_keys':
        return await apiCall('GET', '/memory/keys');
      case 'memory_by_tag':
        return await apiCall('GET', `/memory/tag/${encodeURIComponent(args.tag)}`);
      case 'memory_stats':
        return await apiCall('GET', '/memory/stats');

      // Snapshots
      case 'snapshot_create':
        return await apiCall('POST', '/snapshots', { label: args.label });
      case 'snapshot_list':
        return await apiCall('GET', `/snapshots?limit=${args.limit || 10}`);
      case 'snapshot_restore':
        return await apiCall('POST', `/snapshots/${args.id}/restore`);

      // System
      case 'blackroad_status':
        return await apiCall('GET', '/status');

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * MCP Protocol Handler
 */
function handleMCPMessage(message) {
  const { jsonrpc, id, method, params } = message;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'blackroad-arc-mcp',
            version: '1.0.0'
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      };

    case 'tools/call':
      return handleToolCall(params.name, params.arguments || {})
        .then(result => ({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }]
          }
        }))
        .catch(error => ({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: error.message }
        }));

    case 'notifications/initialized':
      return null;

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
}

/**
 * Main
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      const response = await handleMCPMessage(message);

      if (response) {
        const result = response instanceof Promise ? await response : response;
        if (result) {
          console.log(JSON.stringify(result));
        }
      }
    } catch (error) {
      console.error('[MCP] Error:', error);
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }));
    }
  });

  console.error('[MCP] BlackRoad Arc MCP server started');
  console.error('[MCP] Connecting to API at', API_BASE);
}

main().catch(console.error);
