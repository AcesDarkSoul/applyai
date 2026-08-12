import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithGoogleIdToken } from '@/lib/firebase/auth';
import { formatAuthError } from '@/lib/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

/** Web OAuth client (type 3) — required so Firebase accepts the ID token audience */
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
/** Android OAuth client (type 1) — required for custom-scheme redirects on device / Play builds */
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

export function useGoogleAuth(onSuccess?: () => void, onError?: (error: string) => void) {
  const hasWebClientId = GOOGLE_WEB_CLIENT_ID.length > 0;
  const hasAndroidClientId = GOOGLE_ANDROID_CLIENT_ID.length > 0;
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Never pass the WEB client as `clientId` on native — Google rejects custom schemes
  // (applyai://) for WEB clients with: "Custom scheme URIs are not allowed for 'WEB' client type."
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: hasWebClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
    androidClientId: hasAndroidClientId ? GOOGLE_ANDROID_CLIENT_ID : undefined,
    ...(Platform.OS === 'web' && hasWebClientId ? { clientId: GOOGLE_WEB_CLIENT_ID } : null),
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

    if (!hasWebClientId) {
      const msg =
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in applyai/.env.';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    if (Platform.OS === 'android' && !hasAndroidClientId) {
      const msg =
        'Google Sign-In needs an Android OAuth client. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (google-services.json → oauth_client client_type 1).';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    if (!request) {
      const msg = 'Google Sign-In is still loading. Please wait a moment and try again.';
      onErrorRef.current?.(msg);
      throw new Error(msg);
    }

    await promptAsync();
  }, [promptAsync, hasWebClientId, hasAndroidClientId, request]);

  const nativeReady =
    hasWebClientId &&
    !!request &&
    (Platform.OS !== 'android' || hasAndroidClientId);

  return {
    signInWithGoogle: signInWithGooglePress,
    // Web uses Firebase popup; Android needs Web + Android OAuth clients
    googleAuthReady: Platform.OS === 'web' || nativeReady,
  };
}
