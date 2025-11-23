import express from 'express';
import { healthHandler } from './health/health';
import healthRoutes from './routes/healthRoutes';
import jobsRoutes from './routes/jobsRoutes';

const app = express();

app.use(express.json());

app.get('/health', healthHandler);
app.use(healthRoutes);
app.use('/jobs', jobsRoutes);

export default app;
