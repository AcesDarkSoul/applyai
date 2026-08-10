import { getAnalytics, isSupported, logEvent, setUserId } from 'firebase/analytics';
import app from './config';

type EventParams = Record<string, string | number | boolean | null | undefined>;

let analyticsReady: Promise<ReturnType<typeof getAnalytics> | null> | null = null;

async function getWebAnalytics() {
  if (!analyticsReady) {
    analyticsReady = (async () => {
      try {
        if (!(await isSupported())) return null;
        return getAnalytics(app);
      } catch {
        return null;
      }
    })();
  }
  return analyticsReady;
}

export async function initAnalytics(): Promise<void> {
  await getWebAnalytics();
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  const analytics = await getWebAnalytics();
  if (!analytics) return;
  try {
    setUserId(analytics, userId);
  } catch (e) {
    console.warn('Analytics setUserId failed:', e);
  }
}

export async function trackScreen(screenName: string, _screenClass?: string): Promise<void> {
  const analytics = await getWebAnalytics();
  if (!analytics) return;
  try {
    logEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: _screenClass ?? screenName,
    });
  } catch (e) {
    console.warn('Analytics screen_view failed:', e);
  }
}

export async function trackEvent(name: string, params?: EventParams): Promise<void> {
  const analytics = await getWebAnalytics();
  if (!analytics) return;
  try {
    logEvent(analytics, name as 'select_content', params as never);
  } catch (e) {
    console.warn(`Analytics event "${name}" failed:`, e);
  }
}

export async function trackLogin(method: string): Promise<void> {
  await trackEvent('login', { method });
}

export async function trackSignUp(method: string): Promise<void> {
  await trackEvent('sign_up', { method });
}
