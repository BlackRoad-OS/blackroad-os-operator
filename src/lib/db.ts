import { Pool } from 'pg';
import { config } from '../config';
import { logger } from './logger';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.dbUrl });
    logger.info('Initialized Postgres pool', { dbUrl: 'DATABASE_URL' });
  }
  return pool;
}

export async function checkDbConnection(): Promise<'ok' | 'error'> {
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
