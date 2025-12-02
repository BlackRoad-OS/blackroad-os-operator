#!/usr/bin/env node

/**
 * BlackRoad Memory Store
 *
 * Local persistent memory - NO AI REQUIRED
 * Your memory, your control
 *
 * Stores:
 * - Browser state snapshots
 * - Custom memory entries
 * - Session history
 * - Learned patterns
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

const DATA_DIR = join(process.env.HOME, '.blackroad', 'memory');
const MEMORY_FILE = join(DATA_DIR, 'store.json');
const HISTORY_FILE = join(DATA_DIR, 'history.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Generate content hash for deduplication
 */
function hash(content) {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

/**
 * Memory Store Class
 */
export class MemoryStore {
  constructor() {
    ensureDataDir();
    this.memory = this._load(MEMORY_FILE) || {
      entries: {},
      tags: {},
      sessions: [],
      meta: { created: Date.now(), version: 1 }
    };
    this.history = this._load(HISTORY_FILE) || [];
  }

  _load(file) {
    try {
      if (existsSync(file)) {
        return JSON.parse(readFileSync(file, 'utf-8'));
      }
    } catch (e) {
      console.error(`Failed to load ${file}:`, e.message);
    }
    return null;
  }

  _save() {
    writeFileSync(MEMORY_FILE, JSON.stringify(this.memory, null, 2));
    writeFileSync(HISTORY_FILE, JSON.stringify(this.history.slice(-1000), null, 2)); // Keep last 1000
  }

  /**
   * Store a memory entry
   */
  set(key, value, tags = []) {
    const id = hash({ key, value });
    const entry = {
      id,
      key,
      value,
      tags,
      created: Date.now(),
      updated: Date.now(),
      accessCount: 0
    };

    this.memory.entries[key] = entry;

    // Index by tags
    for (const tag of tags) {
      if (!this.memory.tags[tag]) this.memory.tags[tag] = [];
      if (!this.memory.tags[tag].includes(key)) {
        this.memory.tags[tag].push(key);
      }
    }

    this._save();
    return entry;
  }

  /**
   * Get a memory entry
   */
  get(key) {
    const entry = this.memory.entries[key];
    if (entry) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
      this._save();
    }
    return entry?.value || null;
  }

  /**
   * Get entry with metadata
   */
  getMeta(key) {
    return this.memory.entries[key] || null;
  }

  /**
   * Delete a memory entry
   */
  delete(key) {
    const entry = this.memory.entries[key];
    if (entry) {
      // Remove from tag indices
      for (const tag of entry.tags || []) {
        if (this.memory.tags[tag]) {
          this.memory.tags[tag] = this.memory.tags[tag].filter(k => k !== key);
        }
      }
      delete this.memory.entries[key];
      this._save();
      return true;
    }
    return false;
  }

  /**
   * List all keys
   */
  keys() {
    return Object.keys(this.memory.entries);
  }

  /**
   * Search by tag
   */
  getByTag(tag) {
    const keys = this.memory.tags[tag] || [];
    return keys.map(k => ({ key: k, ...this.memory.entries[k] }));
  }

  /**
   * Search entries by pattern (key or value)
   */
  search(pattern) {
    const regex = new RegExp(pattern, 'i');
    return Object.entries(this.memory.entries)
      .filter(([key, entry]) =>
        regex.test(key) ||
        regex.test(JSON.stringify(entry.value))
      )
      .map(([key, entry]) => ({ key, ...entry }));
  }

  /**
   * Store browser state snapshot
   */
  snapshot(tabs, label = null) {
    const snap = {
      id: hash({ tabs, time: Date.now() }),
      timestamp: Date.now(),
      label: label || `Snapshot ${new Date().toISOString()}`,
      tabCount: tabs.length,
      tabs: tabs.map(t => ({ url: t.url, title: t.title }))
    };

    this.memory.sessions.push(snap);

    // Keep last 50 snapshots
    if (this.memory.sessions.length > 50) {
      this.memory.sessions = this.memory.sessions.slice(-50);
    }

    this._save();
    return snap;
  }

  /**
   * Get session snapshots
   */
  getSnapshots(limit = 10) {
    return this.memory.sessions.slice(-limit);
  }

  /**
   * Restore tabs from snapshot
   */
  getSnapshot(id) {
    return this.memory.sessions.find(s => s.id === id);
  }

  /**
   * Log to history
   */
  log(action, data = {}) {
    const entry = {
      timestamp: Date.now(),
      action,
      data
    };
    this.history.push(entry);
    this._save();
    return entry;
  }

  /**
   * Get recent history
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  /**
   * Export all memory
   */
  export() {
    return {
      memory: this.memory,
      history: this.history,
      exportedAt: Date.now()
    };
  }

  /**
   * Import memory
   */
  import(data) {
    if (data.memory) {
      this.memory = { ...this.memory, ...data.memory };
    }
    if (data.history) {
      this.history = [...this.history, ...data.history];
    }
    this._save();
    return { success: true };
  }

  /**
   * Get stats
   */
  stats() {
    return {
      entryCount: Object.keys(this.memory.entries).length,
      tagCount: Object.keys(this.memory.tags).length,
      snapshotCount: this.memory.sessions.length,
      historyCount: this.history.length,
      created: this.memory.meta.created,
      dataDir: DATA_DIR
    };
  }

  /**
   * Clear all memory (careful!)
   */
  clear() {
    this.memory = {
      entries: {},
      tags: {},
      sessions: [],
      meta: { created: Date.now(), version: 1, clearedFrom: this.memory.meta }
    };
    this.history = [];
    this._save();
    return { cleared: true };
  }
}

// CLI interface
if (process.argv[1].endsWith('memory-store.js')) {
  const store = new MemoryStore();
  const cmd = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  const commands = {
    get: () => store.get(arg1),
    set: () => store.set(arg1, arg2),
    delete: () => store.delete(arg1),
    keys: () => store.keys(),
    search: () => store.search(arg1),
    tag: () => store.getByTag(arg1),
    stats: () => store.stats(),
    history: () => store.getHistory(parseInt(arg1) || 50),
    snapshots: () => store.getSnapshots(parseInt(arg1) || 10),
    export: () => store.export(),
  };

  if (commands[cmd]) {
    console.log(JSON.stringify(commands[cmd](), null, 2));
  } else {
    console.log('Usage: memory-store.js <command> [args]');
    console.log('Commands:', Object.keys(commands).join(', '));
  }
}

export default MemoryStore;
