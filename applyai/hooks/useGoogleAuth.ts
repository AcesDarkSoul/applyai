import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithGoogleIdToken } from '@/lib/firebase/auth';
import { formatAuthError } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const hasGoogleClientId = GOOGLE_WEB_CLIENT_ID.length > 0;
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: hasGoogleClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
    clientId: hasGoogleClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
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
      onErrorRef.current?.(response.error?.message || 'Google sign-in failed');
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
