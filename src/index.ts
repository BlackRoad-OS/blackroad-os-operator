import express from 'express';
import healthRoutes from './routes/healthRoutes';
import jobsRoutes from './routes/jobsRoutes';

const app = express();

app.use(express.json());

app.use(healthRoutes);
app.use('/jobs', jobsRoutes);

export default app;
