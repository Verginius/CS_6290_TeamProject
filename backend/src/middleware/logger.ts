import { Request, Response, NextFunction } from 'express';

// Simple request logger middleware to trace incoming API calls
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Continue processing
  next();

  // Log when request is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
  });
};
