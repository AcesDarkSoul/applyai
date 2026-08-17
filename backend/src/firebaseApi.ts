import type { Express } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

let app: Express | undefined;

function getApp(): Express {
  if (!app) {
    // Lazy load so Firebase deploy analysis does not time out on Admin/Firestore init.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createApp } = require('./app') as { createApp: () => Express };
    app = createApp();
  }
  return app;
}

/**
 * Public HTTPS entry for the Express API.
 * Hosting rewrite: https://petcare-9f4e6.web.app/api/**
 */
export const api = onRequest(
  {
    memory: '1GiB',
    timeoutSeconds: 180,
    concurrency: 40,
    invoker: 'public',
  },
  (req, res) => {
    getApp()(req, res);
  },
);
