import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithGoogleIdToken } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const hasGoogleClientId = GOOGLE_WEB_CLIENT_ID.length > 0;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: hasGoogleClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
    clientId: hasGoogleClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        signInWithGoogleIdToken(idToken)
          .then(() => onSuccess?.())
          .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : 'Google sign-in failed';
            onError?.(message);
          });
      }
    } else if (response?.type === 'error') {
      onError?.(response.error?.message || 'Google sign-in was cancelled');
    }
  }, [response]);

  const signInWithGooglePress = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        await signInWithGoogle();
        onSuccess?.();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Google sign-in failed';
        onError?.(message);
      }
      return;
    }

    if (!hasGoogleClientId) {
      onError?.(
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in applyai/.env (Firebase Console → Authentication → Google).'
      );
      return;
    }

    await promptAsync();
  }, [promptAsync, onSuccess, onError, hasGoogleClientId]);

  return {
    signInWithGoogle: signInWithGooglePress,
    // Web uses Firebase popup; mobile needs OAuth web client ID
    googleAuthReady: Platform.OS === 'web' || (hasGoogleClientId && !!request),
  };
}
