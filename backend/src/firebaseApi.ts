import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { createApp } from './app';
import { logger } from './config/logger';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

const app = createApp();

logger.info('Firebase HTTPS function `api` ready (Express)');

/**
 * Public HTTPS entry for the Express API.
 * URL: https://us-central1-<project>.cloudfunctions.net/api/...
 * App base: .../api/api/v1  (function name + Express /api/v1 routes)
 */
export const api = onRequest(
  {
    memory: '1GiB',
    timeoutSeconds: 120,
    concurrency: 40,
    invoker: 'public',
  },
  app,
);
