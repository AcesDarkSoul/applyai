import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithGoogleIdToken } from '@/lib/firebase/auth';
import { formatAuthError } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

/** Google Android OAuth requires reverse-client-id redirect, not the app package scheme. */
function androidReverseClientScheme(androidClientId: string): string | undefined {
  const match = androidClientId.match(/^([^.]+)\.apps\.googleusercontent\.com$/);
  return match ? `com.googleusercontent.apps.${match[1]}` : undefined;
}

export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const hasGoogleClientId = GOOGLE_WEB_CLIENT_ID.length > 0;
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const androidScheme = useMemo(
    () => (GOOGLE_ANDROID_CLIENT_ID ? androidReverseClientScheme(GOOGLE_ANDROID_CLIENT_ID) : undefined),
    []
  );

  // webClientId = Firebase ID token audience; androidClientId = native Android OAuth client
  // Do NOT pass `clientId` on Android — it forces the web client + wrong redirect → "invalid_request".
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: hasGoogleClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
      ...(Platform.OS === 'web' && hasGoogleClientId ? { clientId: GOOGLE_WEB_CLIENT_ID } : null),
      selectAccount: true,
    },
    Platform.OS === 'android' && androidScheme
      ? {
          scheme: androidScheme,
          path: 'oauthredirect',
          native: `${androidScheme}:/oauthredirect`,
        }
      : undefined
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.params.id_token ||
        response.authentication?.idToken ||
        '';
      if (idToken) {
        signInWithGoogleIdToken(idToken)
          .then(() => onSuccessRef.current?.())
          .catch((e: unknown) => {
            onErrorRef.current?.(formatAuthError(e));
          });
      } else {
        onErrorRef.current?.('Google did not return an ID token. Try again.');
      }
    } else if (response?.type === 'error') {
      const detail =
        response.error?.message ||
        response.params?.error_description ||
        response.params?.error ||
        'Google sign-in failed';
      onErrorRef.current?.(String(detail));
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      // User closed the sheet — clear loading without an alarming error
      onErrorRef.current?.('');
    }
  }, [response]);

  const signInWithGooglePress = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        await signInWithGoogle();
        onSuccessRef.current?.();
      } catch (e: unknown) {
        onErrorRef.current?.(formatAuthError(e));
        throw e;
      }
      return;
    }

    if (!hasGoogleClientId) {
      const msg =
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in applyai/.env (Firebase Console → Authentication → Google).';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    if (Platform.OS === 'android' && !GOOGLE_ANDROID_CLIENT_ID) {
      const msg =
        'Android Google Sign-In needs EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (from google-services.json oauth_client type 1).';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    if (!request) {
      const msg = 'Google Sign-In is still loading. Please wait a moment and try again.';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    await promptAsync();
  }, [promptAsync, hasGoogleClientId, request]);

  return {
    signInWithGoogle: signInWithGooglePress,
    // Web uses Firebase popup; mobile needs OAuth web client ID
    googleAuthReady: Platform.OS === 'web' || (hasGoogleClientId && !!request),
  };
}
