import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { firebaseResetPassword } from '../../shared/firebase/auth';

const PRIMARY = '#5b5ce2';

const highlights = [
  {
    icon: <AutoAwesomeRoundedIcon fontSize="small" />,
    title: 'Smart matching',
    desc: 'Roles ranked to your resume skills',
  },
  {
    icon: <DescriptionOutlinedIcon fontSize="small" />,
    title: 'Resume tailoring',
    desc: 'Polish drafts for each job post',
  },
  {
    icon: <BoltRoundedIcon fontSize="small" />,
    title: 'Apply assistant',
    desc: 'Cover letters ready when you are',
  },
  {
    icon: <InsightsRoundedIcon fontSize="small" />,
    title: 'Track progress',
    desc: 'See interviews and offers clearly',
  },
];

function GoogleGlyph() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 20, height: 20, display: 'block' }}
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Box>
  );
}

type Mode = 'login' | 'register' | 'forgot';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginPage() {
  const { token, profile, loading, error, login, register, loginWithGoogle, clearError } =
    useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const isNarrow = useMediaQuery('(max-width:480px)');

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  useEffect(() => {
    clearError();
    setLocalError('');
    setFieldErrors({});
    setResetSent(false);
  }, [mode, clearError]);

  if (token && profile) return <Navigate to="/" replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setLocalError('');
    clearError();
    setFieldErrors({});
    setResetSent(false);
  };

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (mode === 'register' && !name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email';
    if (mode !== 'forgot') {
      if (!password) next.password = 'Password is required';
      else if (password.length < 6) next.password = 'At least 6 characters';
    }
    if (mode === 'register') {
      if (!confirmPassword) next.confirm = 'Confirm your password';
      else if (password !== confirmPassword) next.confirm = 'Passwords do not match';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!validate()) return;

    if (mode === 'forgot') {
      setResetSending(true);
      try {
        await firebaseResetPassword(email.trim());
        setResetSent(true);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Could not send reset email');
      } finally {
        setResetSending(false);
      }
      return;
    }

    if (mode === 'register') {
      await register(name.trim(), email.trim(), password);
      return;
    }

    await login(email.trim(), password);
  };

  const handleGoogle = async () => {
    setLocalError('');
    await loginWithGoogle();
  };

  const displayError = localError || error;
  const busy = loading || resetSending;

  const brandMark = (size: number) => (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size > 44 ? 3.25 : 2.75,
        background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 12px 28px rgba(91,92,226,0.35)',
        flexShrink: 0,
      }}
    >
      <SmartToyRoundedIcon sx={{ fontSize: size > 44 ? 26 : 22 }} />
    </Box>
  );

  const form = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        width: '100%',
        maxWidth: { xs: 440, sm: 420 },
        mx: 'auto',
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: { xs: 3.5, sm: 4.5 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: {
          xs: '0 16px 40px rgba(30,31,54,0.1)',
          md: '0 28px 64px rgba(30,31,54,0.12)',
        },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${PRIMARY}, #14b8a6, #ec4899)`,
        },
      }}
    >
      <Stack spacing={{ xs: 2, sm: 2.25 }}>
        {!isDesktop && (
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" mb={0.25}>
            {brandMark(44)}
            <Box>
              <Typography fontWeight={900} fontSize={{ xs: 22, sm: 24 }} letterSpacing="-0.03em" lineHeight={1.1}>
                ApplyAI
              </Typography>
              <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing="0.04em">
                JOB SEARCH WORKSPACE
              </Typography>
            </Box>
          </Stack>
        )}

        {mode !== 'forgot' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              p: 0.5,
              borderRadius: 999,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {(['login', 'register'] as const).map((item) => {
              const active = mode === item;
              return (
                <Button
                  key={item}
                  type="button"
                  onClick={() => switchMode(item)}
                  disabled={busy}
                  sx={{
                    py: { xs: 1.1, sm: 1 },
                    minHeight: 44,
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: { xs: 14, sm: 15 },
                    color: active ? '#fff' : 'text.secondary',
                    background: active
                      ? `linear-gradient(135deg, ${PRIMARY}, #8183f0)`
                      : 'transparent',
                    boxShadow: active ? '0 8px 18px rgba(91,92,226,0.28)' : 'none',
                    '&:hover': {
                      background: active
                        ? `linear-gradient(135deg, ${PRIMARY}, #8183f0)`
                        : 'rgba(91,92,226,0.08)',
                    },
                  }}
                >
                  {item === 'login' ? 'Sign in' : 'Register'}
                </Button>
              );
            })}
          </Box>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <Box textAlign={{ xs: 'center', md: 'left' }} mb={0.25}>
              {mode === 'forgot' && (
                <Button
                  type="button"
                  startIcon={<ArrowBackRoundedIcon />}
                  onClick={() => switchMode('login')}
                  sx={{ mb: 1, ml: { md: -1 }, color: 'text.secondary', fontWeight: 700 }}
                  size="small"
                >
                  Back to sign in
                </Button>
              )}
              <Typography
                fontWeight={900}
                sx={{ fontSize: { xs: 22, sm: 26 }, letterSpacing: '-0.035em', lineHeight: 1.2 }}
              >
                {mode === 'login'
                  ? 'Welcome back'
                  : mode === 'register'
                    ? 'Create your account'
                    : 'Reset your password'}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 13.5, sm: 14.5 }, lineHeight: 1.5 }}>
                {mode === 'login'
                  ? 'Sign in with email or Google to continue'
                  : mode === 'register'
                    ? 'Free to start — your job workspace in one place'
                    : 'We’ll email you a secure link to set a new password'}
              </Typography>
            </Box>
          </motion.div>
        </AnimatePresence>

        {displayError ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 2.5, alignItems: 'center' }}
            onClose={() => {
              setLocalError('');
              clearError();
            }}
          >
            {displayError}
          </Alert>
        ) : null}

        <Collapse in={resetSent}>
          <Alert severity="success" icon={<CheckCircleRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 2.5 }}>
            Reset link sent. Check your inbox and spam folder.
          </Alert>
        </Collapse>

        {mode !== 'forgot' && (
          <>
            <Button
              type="button"
              variant="outlined"
              size="large"
              fullWidth
              disabled={busy}
              onClick={() => void handleGoogle()}
              startIcon={<GoogleGlyph />}
              sx={{
                py: 1.4,
                minHeight: 48,
                fontSize: 15,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(91,92,226,0.04)' },
              }}
            >
              {loading ? 'Connecting…' : 'Continue with Google'}
            </Button>

            <Divider sx={{ my: 0.15 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                or use email
              </Typography>
            </Divider>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`fields-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Stack spacing={1.85}>
              {mode === 'register' && (
                <TextField
                  label="Full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: undefined }));
                  }}
                  autoComplete="name"
                  fullWidth
                  required
                  disabled={busy}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                autoComplete="email"
                autoFocus={isDesktop}
                fullWidth
                required
                disabled={busy || (mode === 'forgot' && resetSent)}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                inputProps={{ inputMode: 'email' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {mode !== 'forgot' && (
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  fullWidth
                  required
                  disabled={busy}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password || (mode === 'login' ? undefined : 'Use 6+ characters')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              {mode === 'login' && (
                <Box textAlign="right" mt={-0.75}>
                  <MuiLink
                    component="button"
                    type="button"
                    underline="hover"
                    fontWeight={700}
                    fontSize={13.5}
                    onClick={() => switchMode('forgot')}
                    sx={{ color: PRIMARY }}
                  >
                    Forgot password?
                  </MuiLink>
                </Box>
              )}

              {mode === 'register' && (
                <>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {[0, 1, 2, 3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: 4,
                          borderRadius: 99,
                          transition: 'background 0.2s ease',
                          bgcolor:
                            passwordStrength > i
                              ? passwordStrength <= 1
                                ? 'error.main'
                                : passwordStrength === 2
                                  ? 'warning.main'
                                  : 'success.main'
                              : 'action.hover',
                        }}
                      />
                    ))}
                    <Typography variant="caption" color="text.secondary" fontWeight={700} minWidth={48}>
                      {password
                        ? passwordStrength <= 1
                          ? 'Weak'
                          : passwordStrength === 2
                            ? 'Okay'
                            : passwordStrength === 3
                              ? 'Good'
                              : 'Strong'
                        : ''}
                    </Typography>
                  </Stack>

                  <TextField
                    label="Confirm password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }));
                    }}
                    autoComplete="new-password"
                    fullWidth
                    required
                    disabled={busy}
                    error={Boolean(fieldErrors.confirm)}
                    helperText={fieldErrors.confirm}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}
            </Stack>
          </motion.div>
        </AnimatePresence>

        {!(mode === 'forgot' && resetSent) && (
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={busy}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ py: 1.55, minHeight: 50, fontSize: { xs: 15.5, sm: 16 }, mt: 0.15 }}
            fullWidth
          >
            {busy
              ? mode === 'login'
                ? 'Signing in…'
                : mode === 'register'
                  ? 'Creating account…'
                  : 'Sending link…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'register'
                  ? 'Create free account'
                  : 'Send reset link'}
          </Button>
        )}

        {mode === 'forgot' && resetSent && (
          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            onClick={() => switchMode('login')}
            sx={{ py: 1.55, minHeight: 50 }}
          >
            Back to sign in
          </Button>
        )}

        {mode !== 'forgot' && (
          <Typography textAlign="center" color="text.secondary" fontSize={{ xs: 13.5, sm: 14 }} sx={{ lineHeight: 1.5 }}>
            {mode === 'login' ? (
              <>
                New here?{' '}
                <MuiLink
                  component="button"
                  type="button"
                  underline="hover"
                  fontWeight={800}
                  onClick={() => switchMode('register')}
                >
                  Create an account
                </MuiLink>
              </>
            ) : (
              <>
                Already registered?{' '}
                <MuiLink
                  component="button"
                  type="button"
                  underline="hover"
                  fontWeight={800}
                  onClick={() => switchMode('login')}
                >
                  Sign in
                </MuiLink>
              </>
            )}
          </Typography>
        )}
      </Stack>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: {
          xs: `radial-gradient(640px 320px at 50% -8%, rgba(91,92,226,0.26), transparent 58%),
            radial-gradient(420px 260px at 100% 40%, rgba(20,184,166,0.1), transparent 55%),
            linear-gradient(180deg, #ebeefe 0%, #f3f4fb 42%, #f8fafc 100%)`,
          md: `radial-gradient(900px 480px at 8% -10%, rgba(91,92,226,0.22), transparent 55%),
            radial-gradient(700px 420px at 95% 10%, rgba(236,72,153,0.12), transparent 50%),
            radial-gradient(500px 320px at 40% 90%, rgba(20,184,166,0.08), transparent 55%),
            linear-gradient(160deg, #e8ebff 0%, #f3f4fb 42%, #f8fafc 100%)`,
        },
        pt: 'env(safe-area-inset-top)',
        pb: 'env(safe-area-inset-bottom)',
        '@keyframes float-y': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '40% 60% 55% 45%',
          background: 'linear-gradient(135deg, rgba(91,92,226,0.18), rgba(20,184,166,0.12))',
          filter: 'blur(2px)',
          top: '16%',
          left: '5%',
          animation: 'float-y 7s ease-in-out infinite',
        }}
      />
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.18), transparent 70%)',
          top: '58%',
          right: '6%',
          animation: 'float-y 9s ease-in-out infinite',
        }}
      />

      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1120,
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2.5, sm: 4, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' },
          gap: { xs: 2.5, md: 5 },
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Stack spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, pr: { lg: 2 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {brandMark(52)}
              <Box>
                <Typography fontWeight={900} fontSize={28} letterSpacing="-0.03em" lineHeight={1.1}>
                  ApplyAI
                </Typography>
                <Typography fontSize={12} fontWeight={700} color="text.secondary" letterSpacing="0.05em">
                  JOB SEARCH WORKSPACE
                </Typography>
              </Box>
            </Stack>

            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { md: 36, lg: 42 },
                letterSpacing: '-0.04em',
                lineHeight: 1.12,
                maxWidth: 500,
              }}
            >
              Land roles faster with a calm AI workspace
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 460, fontSize: 16.5, lineHeight: 1.65 }}>
              Match roles to your resume, tailor drafts, generate cover letters, and track every
              application — without losing control of submit.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.25,
                pt: 0.5,
                maxWidth: 480,
              }}
            >
              {highlights.map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(91,92,226,0.1)',
                    backdropFilter: 'blur(8px)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 24px rgba(91,92,226,0.12)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1.75,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(91,92,226,0.12)',
                        color: PRIMARY,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography fontWeight={800} fontSize={13.5} letterSpacing="-0.01em">
                      {item.title}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" fontSize={12.5} lineHeight={1.4} pl={0.25}>
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 0.5, px: 0.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: isNarrow ? 13.5 : 14.5, lineHeight: 1.55 }}>
              Match roles, tailor resumes, and track applications in one calm workspace.
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          {form}
        </motion.div>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{
          pb: { xs: 2.5, md: 3 },
          px: 2,
          position: 'relative',
          zIndex: 1,
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        Secure sign-in · Google & email · You stay in control
      </Typography>
    </Box>
  );
}
