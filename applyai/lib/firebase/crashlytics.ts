/** Web: Firebase Crashlytics is native-only. Errors are forwarded to Analytics. */
import { trackEvent } from './analytics';

export async function initCrashlytics(): Promise<void> {
  // no-op on web
}

export async function setCrashlyticsUser(_user: {
  uid: string;
  email?: string | null;
  name?: string | null;
} | null): Promise<void> {
  // no-op on web
}

export function crashlyticsLog(message: string): void {
  if (__DEV__) console.debug('[crashlytics]', message);
}

export function recordError(error: unknown, context?: string): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error';
  void trackEvent('exception', {
    description: context ? `${context}: ${message}` : message,
    fatal: false,
  });
}

export async function setCrashlyticsAttribute(_name: string, _value: string): Promise<void> {
  // no-op on web
}
