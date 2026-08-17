import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { apiRouter } from './routes';

function resolveCorsOrigin(): cors.CorsOptions['origin'] {
  const allowed = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.includes('*')) return true;

  return (origin, callback) => {
    // Native apps / server-to-server have no Origin header
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // COOP:same-origin breaks Google sign-in popups on web (window.closed / window.close).
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  app.use(
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-Authorization', 'X-Request-Id', 'X-Ingest-Key'],
    }),
  );
  app.use(express.json({ limit: '16mb' }));
  app.use(requestIdMiddleware);
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      name: 'ApplyAI API',
      docs: '/api/docs',
      health: '/api/v1/health',
    });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
