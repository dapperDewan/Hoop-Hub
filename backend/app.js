import express from 'express';
import cors from 'cors';
import compression from 'compression';
import routes from './routes/routes.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', routes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  return app;
};
