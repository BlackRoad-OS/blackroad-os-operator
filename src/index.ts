import express from 'express';
import packageJson from '../package.json';
import jobsRoutes from './routes/jobsRoutes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'operator' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'operator' });
});

app.get('/version', (_req, res) => {
  res.json({ version: packageJson.version, service: 'operator' });
});

app.use('/jobs', jobsRoutes);

export default app;
