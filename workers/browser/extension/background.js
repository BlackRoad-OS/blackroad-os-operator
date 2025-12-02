/**
 * BlackRoad Browser Bridge - Background Service Worker
 *
 * Connects to local MCP server via WebSocket
 * Receives commands, executes them, returns results
 */

const WS_URL = 'ws://127.0.0.1:3847';
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

// Connection state
let isConnected = false;

/**
 * Connect to local MCP server
 */
function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  console.log('[BlackRoad] Connecting to MCP server...');

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[BlackRoad] Connected to MCP server');
      isConnected = true;
      reconnectAttempts = 0;

      // Send handshake
      ws.send(JSON.stringify({
        type: 'handshake',
        agent: 'blackroad-browser-ext',
        version: '1.0.0'
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        const result = await handleCommand(message);
        ws.send(JSON.stringify({
          id: message.id,
          result
        }));
      } catch (error) {
        console.error('[BlackRoad] Error handling message:', error);
        ws.send(JSON.stringify({
          id: event.data?.id,
          error: error.message
        }));
      }
    };

    ws.onclose = () => {
      console.log('[BlackRoad] Disconnected from MCP server');
      isConnected = false;
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('[BlackRoad] WebSocket error:', error);
      isConnected = false;
    };

  } catch (error) {
    console.error('[BlackRoad] Failed to connect:', error);
    scheduleReconnect();
  }
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`[BlackRoad] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectAttempts})`);
    setTimeout(connect, RECONNECT_DELAY);
  } else {
    console.log('[BlackRoad] Max reconnect attempts reached. Start MCP server and reload extension.');
  }
}

/**
 * Handle incoming commands from MCP server
 */
async function handleCommand(message) {
  const { command, params } = message;

  switch (command) {
    case 'screenshot':
      return await captureScreenshot(params);

    case 'get_page_text':
      return await getPageText(params);

    case 'list_tabs':
      return await listTabs();

    case 'read_element':
      return await readElement(params);

    case 'get_billing_info':
      return await getBillingInfo(params);

    case 'navigate':
      return await navigateTo(params);

    case 'click':
      return await clickElement(params);

    case 'type_text':
      return await typeText(params);

    case 'ping':
      return { status: 'pong', timestamp: Date.now() };

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

/**
 * Capture screenshot of current tab
 */
async function captureScreenshot(params = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('No active tab found');
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 90
  });

  return {
    dataUrl,
    url: tab.url,
    title: tab.title,
    timestamp: Date.now()
  };
}

/**
 * Extract text content from page
 */
async function getPageText(params = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('No active tab found');
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (selector) => {
      const element = selector ? document.querySelector(selector) : document.body;
      if (!element) return null;

      // Get visible text, excluding scripts and styles
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.textContent.trim() === '') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const texts = [];
      while (walker.nextNode()) {
        texts.push(walker.currentNode.textContent.trim());
      }

      return texts.join('\n');
    },
    args: [params.selector || null]
  });

  return {
    text: results[0]?.result || '',
    url: tab.url,
    title: tab.title
  };
}

/**
 * List all open tabs
 */
async function listTabs() {
  const tabs = await chrome.tabs.query({});

  return {
    count: tabs.length,
    tabs: tabs.map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      active: tab.active,
      windowId: tab.windowId
    }))
  };
}

/**
 * Read specific DOM element
 */
async function readElement(params) {
  const { selector } = params;

  if (!selector) {
    throw new Error('selector is required');
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return {
        text: el.textContent?.trim(),
        html: el.outerHTML,
        tag: el.tagName.toLowerCase(),
        attributes: Object.fromEntries(
          Array.from(el.attributes).map(a => [a.name, a.value])
        )
      };
    },
    args: [selector]
  });

  return results[0]?.result;
}

/**
 * Extract billing information from page
 */
async function getBillingInfo(params = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const text = document.body.innerText;

      // Find dollar amounts
      const dollarRegex = /\$[\d,]+\.?\d*/g;
      const amounts = text.match(dollarRegex) || [];

      // Find billing-related text
      const billingKeywords = ['billing', 'payment', 'subscription', 'plan', 'invoice', 'charge', 'cost', 'price', 'total', 'due', 'monthly', 'annual'];
      const lines = text.split('\n').filter(line =>
        billingKeywords.some(kw => line.toLowerCase().includes(kw))
      );

      // Find dates
      const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi;
      const dates = text.match(dateRegex) || [];

      return {
        amounts: [...new Set(amounts)],
        billingLines: lines.slice(0, 20),
        dates: [...new Set(dates)],
        pageTitle: document.title
      };
    }
  });

  return {
    url: tab.url,
    ...results[0]?.result
  };
}

/**
 * Navigate to URL
 */
async function navigateTo(params) {
  const { url } = params;

  if (!url) {
    throw new Error('url is required');
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.update(tab.id, { url });

  return { success: true, url };
}

/**
 * Click on element
 */
async function clickElement(params) {
  const { selector, text } = params;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, txt) => {
      let element;

      if (sel) {
        element = document.querySelector(sel);
      } else if (txt) {
        // Find element by text content
        const xpath = `//*[contains(text(), '${txt}')]`;
        element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }

      if (!element) {
        return { success: false, error: 'Element not found' };
      }

      element.click();
      return { success: true, tag: element.tagName };
    },
    args: [selector, text]
  });

  return results[0]?.result;
}

/**
 * Type text into element
 */
async function typeText(params) {
  const { text, selector } = params;

  if (!text) {
    throw new Error('text is required');
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, txt) => {
      const element = sel ? document.querySelector(sel) : document.activeElement;

      if (!element) {
        return { success: false, error: 'No element focused' };
      }

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = txt;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return { success: true };
      }

      return { success: false, error: 'Element is not an input' };
    },
    args: [selector, text]
  });

  return results[0]?.result;
}

// Start connection
connect();

// Reconnect when extension is activated
chrome.runtime.onStartup.addListener(connect);
chrome.runtime.onInstalled.addListener(connect);

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getStatus') {
    sendResponse({ connected: isConnected });
  }
  return true;
});
