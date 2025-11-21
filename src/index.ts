import express from 'express';
import packageJson from '../package.json';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'operator' });
});

app.get('/version', (_req, res) => {
  res.json({ version: packageJson.version, service: 'operator' });
});

export default app;
