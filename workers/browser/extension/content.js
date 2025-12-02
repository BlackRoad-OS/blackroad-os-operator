/**
 * BlackRoad Browser Bridge - Content Script
 *
 * Injected into pages for DOM access
 * Minimal footprint - most logic is in background.js
 */

// Mark that BlackRoad is present (for debugging)
window.__BLACKROAD_BROWSER_BRIDGE__ = true;

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ status: 'alive', url: window.location.href });
  }
  return true;
});

console.log('[BlackRoad] Browser Bridge active on', window.location.hostname);
