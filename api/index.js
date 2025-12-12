import express from 'express';
import cors from 'cors';
import compression from 'compression';
import routes from '../backend/routes/routes.js';

const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes at root since /api prefix is stripped by rewrite
app.use('/', routes);

app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default function handler(req, res) {
  // Strip /api prefix from URL so Express routes match
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  
  return app(req, res);
}
