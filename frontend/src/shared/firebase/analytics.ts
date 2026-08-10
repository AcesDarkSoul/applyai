import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  type Analytics,
} from 'firebase/analytics';
import app from './config';

type EventParams = Record<string, string | number | boolean | null | undefined>;

let analytics: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (!app) return null;
  if (analytics) return analytics;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (!(await isSupported())) return null;
        analytics = getAnalytics(app);
        return analytics;
      } catch {
        // Analytics optional — ignore blockers (adblock, unsupported env)
        return null;
      }
    })();
  }
  return initPromise;
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  const instance = await initAnalytics();
  if (!instance) return;
  try {
    setUserId(instance, userId);
  } catch {
    // ignore
  }
}

export async function trackScreen(path: string): Promise<void> {
  const instance = await initAnalytics();
  if (!instance) return;
  try {
    logEvent(instance, 'screen_view', {
      firebase_screen: path,
      firebase_screen_class: path,
    });
  } catch {
    // ignore
  }
}

export async function trackEvent(name: string, params?: EventParams): Promise<void> {
  const instance = await initAnalytics();
  if (!instance) return;
  try {
    logEvent(instance, name as 'select_content', params as never);
  } catch {
    // ignore
  }
}

export async function trackLogin(method: string): Promise<void> {
  await trackEvent('login', { method });
}

export async function trackSignUp(method: string): Promise<void> {
  await trackEvent('sign_up', { method });
}

/** GA4 exception event — web substitute for Crashlytics non-fatals. */
export async function trackException(error: unknown, fatal = false): Promise<void> {
  const description =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error';
  await trackEvent('exception', { description, fatal });
}

export function installWebErrorReporting(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    void trackException(event.error ?? event.message, true);
  });

  window.addEventListener('unhandledrejection', (event) => {
    void trackException(event.reason, false);
  });
}
