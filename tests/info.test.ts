import request from 'supertest';
import { createApp } from '../src/index';
import { SERVICE_ID, SERVICE_NAME } from '../src/config/serviceConfig';
import pkg from '../package.json';

describe('GET /info', () => {
  const app = createApp();

  it('returns service metadata', async () => {
    const response = await request(app).get('/info');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: SERVICE_NAME,
      id: SERVICE_ID,
      version: pkg.version,
    });
    expect(typeof response.body.time).toBe('string');
    expect(typeof response.body.env).toBe('string');
  });
});
