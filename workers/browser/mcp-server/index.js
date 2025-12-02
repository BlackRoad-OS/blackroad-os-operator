#!/usr/bin/env node

/**
 * BlackRoad Browser MCP Server
 *
 * Bridges Claude ↔ Browser via MCP protocol
 *
 * Architecture:
 * - Reads MCP commands from stdin
 * - Sends commands to browser extension via WebSocket
 * - Returns results to stdout
 */

import { WebSocketServer } from 'ws';
import * as readline from 'readline';

const WS_PORT = 3847;

// Store connected extension
let extensionSocket = null;
let pendingRequests = new Map();
let requestId = 0;

/**
 * MCP Tool Definitions
 */
const TOOLS = [
  {
    name: 'screenshot',
    description: 'Capture screenshot of current browser tab. Returns base64 PNG image.',
    inputSchema: {
      type: 'object',
      properties: {
        tab_id: {
          type: 'string',
          description: 'Optional specific tab ID'
        },
        full_page: {
          type: 'boolean',
          description: 'Capture full page (not just viewport)',
          default: false
        }
      }
    }
  },
  {
    name: 'get_page_text',
    description: 'Extract readable text content from the current browser page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Optional CSS selector to scope text extraction'
        }
      }
    }
  },
  {
    name: 'list_tabs',
    description: 'List all open browser tabs with their URLs and titles',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'read_element',
    description: 'Read content of a specific DOM element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element'
        }
      },
      required: ['selector']
    }
  },
  {
    name: 'get_billing_info',
    description: 'Extract billing and payment information from the current page. Finds dollar amounts, billing dates, and subscription details.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'navigate',
    description: 'Navigate the current tab to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'click',
    description: 'Click on an element in the page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for element to click'
        },
        text: {
          type: 'string',
          description: 'Alternative: click element containing this text'
        }
      }
    }
  },
  {
    name: 'type_text',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to type'
        },
        selector: {
          type: 'string',
          description: 'Optional CSS selector (defaults to focused element)'
        }
      },
      required: ['text']
    }
  }
];

/**
 * Start WebSocket server for browser extension
 */
function startWebSocketServer() {
  const wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });

  wss.on('connection', (ws) => {
    console.error('[MCP] Browser extension connected');
    extensionSocket = ws;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle handshake
        if (message.type === 'handshake') {
          console.error(`[MCP] Extension handshake: ${message.agent} v${message.version}`);
          return;
        }

        // Handle response to pending request
        if (message.id && pendingRequests.has(message.id)) {
          const { resolve, reject } = pendingRequests.get(message.id);
          pendingRequests.delete(message.id);

          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
          }
        }
      } catch (error) {
        console.error('[MCP] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.error('[MCP] Browser extension disconnected');
      extensionSocket = null;

      // Reject all pending requests
      for (const [id, { reject }] of pendingRequests) {
        reject(new Error('Extension disconnected'));
        pendingRequests.delete(id);
      }
    });

    ws.on('error', (error) => {
      console.error('[MCP] WebSocket error:', error);
    });
  });

  console.error(`[MCP] WebSocket server listening on ws://127.0.0.1:${WS_PORT}`);
}

/**
 * Send command to browser extension
 */
function sendToExtension(command, params = {}) {
  return new Promise((resolve, reject) => {
    if (!extensionSocket) {
      reject(new Error('Browser extension not connected. Install and enable the BlackRoad Browser extension.'));
      return;
    }

    const id = ++requestId;
    pendingRequests.set(id, { resolve, reject });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }
    }, 30000);

    extensionSocket.send(JSON.stringify({ id, command, params }));
  });
}

/**
 * Handle MCP tool call
 */
async function handleToolCall(name, args) {
  switch (name) {
    case 'screenshot':
      return await sendToExtension('screenshot', args);

    case 'get_page_text':
      return await sendToExtension('get_page_text', args);

    case 'list_tabs':
      return await sendToExtension('list_tabs', args);

    case 'read_element':
      return await sendToExtension('read_element', args);

    case 'get_billing_info':
      return await sendToExtension('get_billing_info', args);

    case 'navigate':
      return await sendToExtension('navigate', args);

    case 'click':
      return await sendToExtension('click', args);

    case 'type_text':
      return await sendToExtension('type_text', args);

    default:
      throw new Error(`Unknown tool: ${name}`);
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
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'blackroad-browser-mcp',
            version: '1.0.0'
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS
        }
      };

    case 'tools/call':
      // Handle async tool call
      return handleToolCall(params.name, params.arguments || {})
        .then(result => ({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          }
        }))
        .catch(error => ({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: error.message
          }
        }));

    case 'notifications/initialized':
      // Client is ready
      return null;

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      };
  }
}

/**
 * Main: Start MCP server
 */
async function main() {
  // Start WebSocket server for extension
  startWebSocketServer();

  // Read MCP messages from stdin
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
        // Handle both sync and async responses
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
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
  });

  console.error('[MCP] BlackRoad Browser MCP server started');
  console.error('[MCP] Waiting for browser extension connection...');
}

main().catch(console.error);
