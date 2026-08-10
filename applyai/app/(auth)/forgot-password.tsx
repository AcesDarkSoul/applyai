import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import {
  AuthShell,
  AuthErrorBanner,
  AuthSuccessBanner,
} from '@/components/auth/AuthShell';
import { resetPassword, formatAuthError } from '@/lib/firebase/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    setEmailError('');
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (e: unknown) {
      setError(formatAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={success ? 'Check your email' : 'Reset password'}
      subtitle={
        success
          ? 'We sent a secure link. Open it to choose a new password.'
          : 'Enter your account email and we’ll send a reset link.'
      }
      footerPrompt="Remembered it?"
      footerLinkLabel="Back to sign in"
      footerHref="/(auth)/login"
      brandTagline="We’ll help you get back into your workspace"
    >
      {success ? (
        <AuthSuccessBanner message="Password reset email sent. Check inbox and spam." />
      ) : (
        <>
          <AuthErrorBanner message={error} />
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={emailError}
            editable={!loading}
          />
          <Button title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" />
        </>
      )}
    </AuthShell>
  );
}
