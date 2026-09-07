import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
// Local-only overrides (PORT, FIREBASE_*). Not deployed by Firebase CLI.
dotenv.config({ path: '.env.local', override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Prefer explicit local creds; on Cloud Functions use GCLOUD_PROJECT + ADC.
  FIREBASE_PROJECT_ID: z
    .string()
    .optional()
    .default(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'petcare-9f4e6'),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  RAPIDAPI_KEY: z.string().optional().default(''),
  RAPIDAPI_JSEARCH_HOST: z.string().default('jsearch.p.rapidapi.com'),
  APIFY_TOKEN: z.string().optional().default(''),
  APIFY_LINKEDIN_ACTOR_ID: z.string().default('curious_coder/linkedin-jobs-scraper'),
  APIFY_INDEED_ACTOR_ID: z.string().default('misceres/indeed-scraper'),
  SERPAPI_API_KEY: z.string().optional().default(''),
  JOB_SEARCH_QUERY: z.string().default('Full Stack Developer'),
  JOB_SEARCH_LOCATION: z.string().default('India'),
  JOB_SEARCH_LIMIT: z.coerce.number().default(15),
  // serpapi,indeed,linkedin  (linkedin is slow — omit for quick local tests)
  JOB_SCRAPE_SOURCES: z.string().default('serpapi,indeed'),
  INGEST_API_KEY: z.string().default('applyai-local-ingest'),
  PREFER_LIVE_CATALOG: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AI_RATE_LIMIT_MAX: z.coerce.number().default(30),
  DEMO_MODE: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  SENDGRID_API_KEY: z.string().optional().default(''),
  SENDGRID_FROM_EMAIL: z.string().optional().default(''),
  /** Optional global user mailbox (prefer per-profile outreach.smtp*) */
  USER_SMTP_HOST: z.string().optional().default(''),
  USER_SMTP_PORT: z.coerce.number().optional().default(587),
  USER_SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  USER_SMTP_USER: z.string().optional().default(''),
  USER_SMTP_PASS: z.string().optional().default(''),
  /** Meta WhatsApp Cloud API (user Business number) */
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(''),
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  // e.g. whatsapp:+14155238886 (Twilio sandbox) or your WhatsApp-enabled number
  TWILIO_WHATSAPP_FROM: z.string().optional().default(''),
  OUTREACH_DRY_RUN: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  /** Daily job fetch + auto-apply scheduler */
  DAILY_AUTOMATION_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  /** Cron: default 8:00 AM Asia/Kolkata every day */
  DAILY_AUTOMATION_CRON: z.string().optional().default('0 8 * * *'),
  DAILY_AUTOMATION_TZ: z.string().optional().default('Asia/Kolkata'),
  DAILY_AUTOMATION_RUN_ON_START: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  DAILY_AUTOMATION_STARTUP_DELAY_MS: z.coerce.number().optional().default(12_000),
  DAILY_AUTO_APPLY_LIMIT: z.coerce.number().optional().default(8),
  DAILY_AUTO_APPLY_MIN_SCORE: z.coerce.number().optional().default(55),
  /**
   * When true, users need an active plan before paid features work.
   * Independent of Razorpay: without keys, demo-activate still unlocks a plan.
   */
  BILLING_REQUIRE_PLAN: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  /** Razorpay Dashboard → API Keys (Key Id is public; Key Secret stays on the server). */
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  /** Dashboard → Webhooks → Secret (optional but recommended). */
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDemoMode = env.DEMO_MODE || !env.FIREBASE_PROJECT_ID;
