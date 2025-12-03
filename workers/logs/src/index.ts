/**
 * BlackRoad OS Centralized Logging Service
 *
 * Provides centralized logging for all BlackRoad OS services using Cloudflare D1.
 * Supports log ingestion, querying, and statistics.
 */

interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  MAX_LOG_RETENTION_DAYS?: string;
}

interface LogEntry {
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
  request_id?: string;
  user_id?: string;
}

interface LogQuery {
  service?: string;
  level?: string;
  start_time?: number;
  end_time?: number;
  request_id?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

// CORS headers helper
function corsHeaders(origin: string = '*'): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// JSON response helper
function jsonResponse(data: any, status: number = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Validate log entry
function validateLogEntry(data: any): { valid: boolean; error?: string } {
  if (!data.service || typeof data.service !== 'string') {
    return { valid: false, error: 'service is required and must be a string' };
  }

  if (!data.level || !['info', 'warn', 'error', 'debug'].includes(data.level)) {
    return { valid: false, error: 'level must be one of: info, warn, error, debug' };
  }

  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'message is required and must be a string' };
  }

  return { valid: true };
}

// Write log entry to D1
async function writeLog(db: D1Database, entry: LogEntry): Promise<number> {
  const timestamp = Date.now();
  const metadata = entry.metadata ? JSON.stringify(entry.metadata) : null;

  const result = await db
    .prepare(
      'INSERT INTO logs (timestamp, service, level, message, metadata, request_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      timestamp,
      entry.service,
      entry.level,
      entry.message,
      metadata,
      entry.request_id || null,
      entry.user_id || null
    )
    .run();

  return result.meta.last_row_id || 0;
}

// Query logs from D1
async function queryLogs(db: D1Database, query: LogQuery): Promise<any[]> {
  let sql = 'SELECT * FROM logs WHERE 1=1';
  const params: any[] = [];

  if (query.service) {
    sql += ' AND service = ?';
    params.push(query.service);
  }

  if (query.level) {
    sql += ' AND level = ?';
    params.push(query.level);
  }

  if (query.start_time) {
    sql += ' AND timestamp >= ?';
    params.push(query.start_time);
  }

  if (query.end_time) {
    sql += ' AND timestamp <= ?';
    params.push(query.end_time);
  }

  if (query.request_id) {
    sql += ' AND request_id = ?';
    params.push(query.request_id);
  }

  if (query.user_id) {
    sql += ' AND user_id = ?';
    params.push(query.user_id);
  }

  sql += ' ORDER BY timestamp DESC';

  const limit = Math.min(query.limit || 100, 1000); // Max 1000 results
  sql += ' LIMIT ?';
  params.push(limit);

  if (query.offset) {
    sql += ' OFFSET ?';
    params.push(query.offset);
  }

  const result = await db.prepare(sql).bind(...params).all();

  // Parse metadata JSON
  return result.results.map((row: any) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}

// Get log statistics
async function getLogStats(db: D1Database): Promise<any> {
  // Overall stats
  const totalResult = await db
    .prepare('SELECT COUNT(*) as total FROM logs')
    .first();

  // Stats by service and level
  const statsResult = await db
    .prepare('SELECT * FROM log_stats ORDER BY count DESC')
    .all();

  // Recent activity (last 24 hours)
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recentResult = await db
    .prepare('SELECT service, level, COUNT(*) as count FROM logs WHERE timestamp >= ? GROUP BY service, level')
    .bind(last24h)
    .all();

  return {
    total: totalResult?.total || 0,
    by_service_level: statsResult.results,
    last_24h: recentResult.results,
  };
}

// Cleanup old logs (called by cron)
async function cleanupOldLogs(db: D1Database, retentionDays: number): Promise<number> {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare('DELETE FROM logs WHERE timestamp < ?')
    .bind(cutoffTime)
    .run();

  return result.meta.changes || 0;
}

// Main request handler
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = env.ALLOWED_ORIGINS || '*';

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(origin),
    });
  }

  // Health check
  if (path === '/health' || path === '/') {
    return jsonResponse(
      {
        status: 'healthy',
        service: 'blackroad-logs',
        timestamp: Date.now(),
      },
      200,
      corsHeaders(origin)
    );
  }

  // POST /log - Write a log entry
  if (path === '/log' && request.method === 'POST') {
    try {
      const data = await request.json();

      // Validate
      const validation = validateLogEntry(data);
      if (!validation.valid) {
        return jsonResponse(
          { error: validation.error },
          400,
          corsHeaders(origin)
        );
      }

      // Write to DB
      const logId = await writeLog(env.DB, data as LogEntry);

      return jsonResponse(
        {
          success: true,
          log_id: logId,
          timestamp: Date.now(),
        },
        201,
        corsHeaders(origin)
      );
    } catch (error) {
      return jsonResponse(
        {
          error: 'Failed to write log',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
        corsHeaders(origin)
      );
    }
  }

  // GET /logs - Query logs
  if (path === '/logs' && request.method === 'GET') {
    try {
      const query: LogQuery = {
        service: url.searchParams.get('service') || undefined,
        level: url.searchParams.get('level') || undefined,
        start_time: url.searchParams.get('start_time')
          ? parseInt(url.searchParams.get('start_time')!)
          : undefined,
        end_time: url.searchParams.get('end_time')
          ? parseInt(url.searchParams.get('end_time')!)
          : undefined,
        request_id: url.searchParams.get('request_id') || undefined,
        user_id: url.searchParams.get('user_id') || undefined,
        limit: url.searchParams.get('limit')
          ? parseInt(url.searchParams.get('limit')!)
          : 100,
        offset: url.searchParams.get('offset')
          ? parseInt(url.searchParams.get('offset')!)
          : 0,
      };

      const logs = await queryLogs(env.DB, query);

      return jsonResponse(
        {
          success: true,
          count: logs.length,
          logs,
        },
        200,
        corsHeaders(origin)
      );
    } catch (error) {
      return jsonResponse(
        {
          error: 'Failed to query logs',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
        corsHeaders(origin)
      );
    }
  }

  // GET /logs/stats - Get statistics
  if (path === '/logs/stats' && request.method === 'GET') {
    try {
      const stats = await getLogStats(env.DB);

      return jsonResponse(
        {
          success: true,
          stats,
        },
        200,
        corsHeaders(origin)
      );
    } catch (error) {
      return jsonResponse(
        {
          error: 'Failed to get stats',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
        corsHeaders(origin)
      );
    }
  }

  // 404
  return jsonResponse(
    {
      error: 'Not found',
      available_endpoints: [
        'GET /health',
        'POST /log',
        'GET /logs',
        'GET /logs/stats',
      ],
    },
    404,
    corsHeaders(origin)
  );
}

// Cron handler for cleanup
async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const retentionDays = parseInt(env.MAX_LOG_RETENTION_DAYS || '90');
  const deleted = await cleanupOldLogs(env.DB, retentionDays);
  console.log(`Cleanup completed: deleted ${deleted} old log entries`);
}

// Export Cloudflare Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    return handleScheduled(event, env);
  },
};
