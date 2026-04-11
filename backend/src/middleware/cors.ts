import cors from 'cors';

// Configuring CORS middleware to allow specific origins for frontend integration
const corsOptions = {
  origin: '*', // Currently allows all. Adapt to 'http://localhost:5173' for strict local Vite frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const corsMiddleware = cors(corsOptions);
