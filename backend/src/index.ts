import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import simulationRoutes from './routes/simulationRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/simulation', simulationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running at http://localhost:${PORT}`);
  console.log(`Waiting for simulations to provide data...`);
});
