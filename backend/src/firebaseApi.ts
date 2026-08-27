import type { Express } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

/** Live keys live in Secret Manager — do not also put them in .env / .env.petcare-* */
const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

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
    secrets: [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret],
  },
  (req, res) => {
    getApp()(req, res);
  },
);
