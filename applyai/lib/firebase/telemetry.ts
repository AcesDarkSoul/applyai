import { initAnalytics } from './analytics';
import { initCrashlytics } from './crashlytics';

let started = false;

/** Bootstrap Analytics + Crashlytics once at app start. */
export async function initTelemetry(): Promise<void> {
  if (started) return;
  started = true;
  await Promise.all([initAnalytics(), initCrashlytics()]);
}
