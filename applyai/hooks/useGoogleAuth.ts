import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { signInWithGoogle, signInWithGoogleIdToken, formatAuthError } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

let nativeConfigured = false;

function configureNativeGoogleSignIn() {
  if (nativeConfigured || Platform.OS === 'web') return;
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in applyai/.env.'
    );
  }
  GoogleSignin.configure({
    // Must be the Web OAuth client so Google returns a Firebase-compatible ID token
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  nativeConfigured = true;
}

function mapNativeGoogleError(error: unknown): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return '';
      case statusCodes.IN_PROGRESS:
        return 'Google sign-in is already in progress.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is missing or out of date on this device.';
      case 'DEVELOPER_ERROR':
      case '10':
        return 'Google Sign-In isn’t ready on this Play build. Sign in with email instead.';
      default:
        return error.message || `Google sign-in failed (${error.code})`;
    }
  }
  return formatAuthError(error);
}

/**
 * Android/iOS: native Google Sign-In → Firebase ID token.
 * Web: Firebase Google popup.
 */
export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const hasWebClientId = GOOGLE_WEB_CLIENT_ID.length > 0;
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      configureNativeGoogleSignIn();
    } catch (e) {
      console.warn('[google-auth] configure failed', e);
    }
  }, []);

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

    if (!hasWebClientId) {
      const msg =
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in applyai/.env.';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    try {
      configureNativeGoogleSignIn();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      if (!isSuccessResponse(result)) {
        onErrorRef.current?.('');
        return;
      }

      let idToken = result.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error(
          'Google did not return an ID token. Confirm EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is the Web client ID.'
        );
      }

      await signInWithGoogleIdToken(idToken);
      onSuccessRef.current?.();
    } catch (e: unknown) {
      const mapped = mapNativeGoogleError(e);
      if (mapped) onErrorRef.current?.(mapped);
      if (mapped) throw e;
    }
  }, [hasWebClientId]);

  return {
    signInWithGoogle: signInWithGooglePress,
    googleAuthReady: hasWebClientId,
  };
}
