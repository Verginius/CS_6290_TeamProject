import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import simulationRoutes from './routes/simulationRoutes';
import { ScriptRunner } from './services/scriptRunner';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

export const scriptRunner = new ScriptRunner(io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

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

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server is running at http://localhost:${PORT}`);
  console.log(`Waiting for simulations to provide data...`);
});
