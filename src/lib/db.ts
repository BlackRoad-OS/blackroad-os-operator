import { Pool } from 'pg';
import { config, isDatabaseEnabled } from '../config';
import { logger } from './logger';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
    logger.info('Initialized Postgres pool', { dbUrl: 'DATABASE_URL' });
  }
  return pool;
}

export async function checkDbConnection(): Promise<'ok' | 'error' | 'disabled'> {
  if (!isDatabaseEnabled) return 'disabled';

  try {
    const client = await getDbPool().connect();
    await client.query('SELECT 1');
    client.release();
    return 'ok';
  } catch (err) {
    logger.error('Database connectivity check failed', { error: (err as Error).message });
    return 'error';
  }
}
