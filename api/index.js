import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import routes directly
import routes from '../backend/routes/routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    databaseUrl: process.env.DATABASE_URL ? 'set' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'not set'
  });
});

app.use('/', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize Prisma Client (singleton pattern for serverless)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default async function handler(req, res) {
  // Strip /api prefix from URL so Express routes match
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }

  // Debug: return early with env info if health check
  if (req.url === '/health') {
    return res.json({ 
      status: 'ok', 
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'MISSING',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Test connection by doing a simple query
    await prisma.$connect();
  } catch (err) {
    console.error('DB connection failed:', err);
    return res.status(500).json({ 
      error: 'Database connection failed', 
      details: err.message,
      databaseUrl: process.env.DATABASE_URL ? 'configured but failed' : 'NOT CONFIGURED'
    });
  }
  
  return app(req, res);
}
