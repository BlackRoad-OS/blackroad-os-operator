#!/usr/bin/env node

/**
 * Arc Browser Controller
 *
 * Native AppleScript bridge for Arc Browser control
 * No AI dependency - pure local automation
 */

import { execSync } from 'child_process';

/**
 * Execute AppleScript and return result
 */
function osascript(script) {
  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      encoding: 'utf-8',
      timeout: 10000
    });
    return result.trim();
  } catch (error) {
    throw new Error(`AppleScript error: ${error.message}`);
  }
}

/**
 * Arc Controller Class
 */
export class ArcController {

  /**
   * Check if Arc is running
   */
  isRunning() {
    try {
      const result = osascript('tell application "System Events" to get name of every process whose name contains "Arc"');
      return result.includes('Arc');
    } catch {
      return false;
    }
  }

  /**
   * Get active tab info
   */
  getActiveTab() {
    const url = osascript('tell application "Arc" to get URL of active tab of front window');
    const title = osascript('tell application "Arc" to get title of active tab of front window');
    return { url, title };
  }

  /**
   * Get all tabs in current window
   */
  getAllTabs() {
    const raw = osascript('tell application "Arc" to get {URL, title} of every tab of front window');
    const parts = raw.split(', ');
    const mid = Math.floor(parts.length / 2);
    const urls = parts.slice(0, mid);
    const titles = parts.slice(mid);

    return urls.map((url, i) => ({
      index: i,
      url: url.trim(),
      title: titles[i]?.trim() || ''
    }));
  }

  /**
   * Get all windows
   */
  getWindows() {
    const result = osascript('tell application "Arc" to get name of every window');
    return result.split(', ').map((name, i) => ({ index: i, name: name.trim() }));
  }

  /**
   * Open new tab with URL
   */
  openTab(url) {
    osascript(`tell application "Arc" to make new tab at front window with properties {URL:"${url}"}`);
    return { success: true, url };
  }

  /**
   * Navigate active tab to URL
   */
  navigate(url) {
    osascript(`tell application "Arc" to set URL of active tab of front window to "${url}"`);
    return { success: true, url };
  }

  /**
   * Close active tab
   */
  closeActiveTab() {
    osascript('tell application "Arc" to close active tab of front window');
    return { success: true };
  }

  /**
   * Switch to tab by index (0-based)
   */
  switchToTab(index) {
    // Arc uses 1-based indexing in AppleScript
    osascript(`tell application "Arc" to set active tab index of front window to ${index + 1}`);
    return { success: true, index };
  }

  /**
   * Search tabs by URL or title pattern
   */
  findTabs(pattern) {
    const tabs = this.getAllTabs();
    const regex = new RegExp(pattern, 'i');
    return tabs.filter(tab => regex.test(tab.url) || regex.test(tab.title));
  }

  /**
   * Activate Arc (bring to front)
   */
  activate() {
    osascript('tell application "Arc" to activate');
    return { success: true };
  }

  /**
   * Reload active tab
   */
  reload() {
    osascript('tell application "Arc" to reload active tab of front window');
    return { success: true };
  }

  /**
   * Execute JavaScript in active tab (requires accessibility)
   */
  executeJS(code) {
    const escaped = code.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const result = osascript(`tell application "Arc" to execute active tab of front window javascript "${escaped}"`);
    return { result };
  }

  /**
   * Create new Space (via keyboard shortcut simulation)
   */
  createSpace() {
    osascript(`
      tell application "Arc" to activate
      tell application "System Events"
        keystroke "+" using {command down, shift down}
      end tell
    `);
    return { success: true, note: 'Space creation triggered via keyboard' };
  }

  /**
   * Switch to Space by number (1-indexed)
   */
  switchToSpace(number) {
    osascript(`
      tell application "Arc" to activate
      tell application "System Events"
        keystroke "${number}" using {control down}
      end tell
    `);
    return { success: true, space: number };
  }

  /**
   * Open Command Palette (Cmd+T)
   */
  openCommandPalette() {
    osascript(`
      tell application "Arc" to activate
      tell application "System Events"
        keystroke "t" using {command down}
      end tell
    `);
    return { success: true };
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    osascript(`
      tell application "Arc" to activate
      tell application "System Events"
        keystroke "s" using {command down}
      end tell
    `);
    return { success: true };
  }

  /**
   * Get tab count
   */
  getTabCount() {
    const result = osascript('tell application "Arc" to count of tabs of front window');
    return parseInt(result, 10);
  }

  /**
   * Batch close tabs matching pattern
   */
  closeTabsMatching(pattern) {
    const tabs = this.findTabs(pattern);
    let closed = 0;

    // Close from highest index to lowest to avoid index shifting
    for (const tab of tabs.sort((a, b) => b.index - a.index)) {
      try {
        osascript(`tell application "Arc" to close tab ${tab.index + 1} of front window`);
        closed++;
      } catch (e) {
        // Tab may have already been closed
      }
    }

    return { closed, pattern };
  }
}

// CLI interface
if (process.argv[1].endsWith('arc-controller.js')) {
  const arc = new ArcController();
  const cmd = process.argv[2];
  const arg = process.argv[3];

  const commands = {
    status: () => ({ running: arc.isRunning(), tabCount: arc.isRunning() ? arc.getTabCount() : 0 }),
    active: () => arc.getActiveTab(),
    tabs: () => arc.getAllTabs(),
    windows: () => arc.getWindows(),
    open: () => arc.openTab(arg),
    navigate: () => arc.navigate(arg),
    close: () => arc.closeActiveTab(),
    switch: () => arc.switchToTab(parseInt(arg, 10)),
    find: () => arc.findTabs(arg),
    reload: () => arc.reload(),
    space: () => arc.switchToSpace(parseInt(arg, 10)),
    'new-space': () => arc.createSpace(),
    activate: () => arc.activate(),
  };

  if (commands[cmd]) {
    console.log(JSON.stringify(commands[cmd](), null, 2));
  } else {
    console.log('Usage: arc-controller.js <command> [arg]');
    console.log('Commands:', Object.keys(commands).join(', '));
  }
}

export default ArcController;
