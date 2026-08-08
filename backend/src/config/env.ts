import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDemoMode = env.DEMO_MODE || !env.FIREBASE_PROJECT_ID;
