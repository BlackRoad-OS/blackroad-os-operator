import request from 'supertest';
import { createApp } from '../src/index';
import { SERVICE_ID } from '../src/config/serviceConfig';

describe('GET /health', () => {
  const app = createApp();

  it('returns health payload with service id and timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, service: SERVICE_ID });
    expect(typeof response.body.ts).toBe('string');
  });
});
