import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithGoogleIdToken } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
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

    await promptAsync();
  }, [promptAsync, onSuccess, onError]);

  return {
    signInWithGoogle: signInWithGooglePress,
    googleAuthReady: !!request || Platform.OS === 'web',
  };
}
