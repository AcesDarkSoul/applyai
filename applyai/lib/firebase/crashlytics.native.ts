import {
  getCrashlytics,
  log as crashLog,
  recordError as crashRecordError,
  setAttribute,
  setAttributes,
  setUserId as crashSetUserId,
} from '@react-native-firebase/crashlytics';

export async function initCrashlytics(): Promise<void> {
  const crashlytics = getCrashlytics();
  crashLog(crashlytics, 'Crashlytics initialized');
}

export async function setCrashlyticsUser(user: {
  uid: string;
  email?: string | null;
  name?: string | null;
} | null): Promise<void> {
  const crashlytics = getCrashlytics();
  try {
    if (!user) {
      await crashSetUserId(crashlytics, '');
      return;
    }
    await crashSetUserId(crashlytics, user.uid);
    await setAttributes(crashlytics, {
      email: user.email ?? '',
      name: user.name ?? '',
    });
  } catch (e) {
    console.warn('Crashlytics setUser failed:', e);
  }
}

export function crashlyticsLog(message: string): void {
  try {
    crashLog(getCrashlytics(), message);
  } catch (e) {
    console.warn('Crashlytics log failed:', e);
  }
}

export function recordError(error: unknown, context?: string): void {
  try {
    const crashlytics = getCrashlytics();
    if (context) crashLog(crashlytics, context);
    const err =
      error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : 'Unknown error');
    crashRecordError(crashlytics, err);
  } catch (e) {
    console.warn('Crashlytics recordError failed:', e);
  }
}

export async function setCrashlyticsAttribute(name: string, value: string): Promise<void> {
  try {
    await setAttribute(getCrashlytics(), name, value);
  } catch (e) {
    console.warn('Crashlytics setAttribute failed:', e);
  }
}
