import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logLogin,
  logScreenView,
  logSignUp,
  setUserId as firebaseSetUserId,
} from '@react-native-firebase/analytics';

type EventParams = Record<string, string | number | boolean | null | undefined>;

export async function initAnalytics(): Promise<void> {
  // Native Analytics auto-initializes with the Google Services config.
  getAnalytics();
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  try {
    await firebaseSetUserId(getAnalytics(), userId);
  } catch (e) {
    console.warn('Analytics setUserId failed:', e);
  }
}

export async function trackScreen(screenName: string, screenClass?: string): Promise<void> {
  try {
    await logScreenView(getAnalytics(), {
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch (e) {
    console.warn('Analytics screen_view failed:', e);
  }
}

export async function trackEvent(name: string, params?: EventParams): Promise<void> {
  try {
    await firebaseLogEvent(getAnalytics(), name as 'select_content', params as never);
  } catch (e) {
    console.warn(`Analytics event "${name}" failed:`, e);
  }
}

export async function trackLogin(method: string): Promise<void> {
  try {
    await logLogin(getAnalytics(), { method });
  } catch (e) {
    console.warn('Analytics login failed:', e);
  }
}

export async function trackSignUp(method: string): Promise<void> {
  try {
    await logSignUp(getAnalytics(), { method });
  } catch (e) {
    console.warn('Analytics sign_up failed:', e);
  }
}
