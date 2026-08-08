import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';

const PRIMARY = '#5b5ce2';

const highlights = [
  { icon: <AutoAwesomeRoundedIcon fontSize="small" />, title: 'Smart Matching' },
  { icon: <DescriptionOutlinedIcon fontSize="small" />, title: 'Resume Tailoring' },
  { icon: <BoltRoundedIcon fontSize="small" />, title: 'Apply Assistant' },
  { icon: <InsightsRoundedIcon fontSize="small" />, title: 'Track Progress' },
];

export function LoginPage() {
  const { token, loading, error, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isDesktop = useMediaQuery('(min-width:900px)');

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const form = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 420,
        mx: 'auto',
        p: { xs: 2.75, sm: 3.75 },
        borderRadius: { xs: 3.5, sm: 4.5 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 24px 60px rgba(30,31,54,0.12)',
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
      <Stack spacing={2.25}>
        {!isDesktop && (
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" mb={0.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.75,
                background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 24px rgba(91,92,226,0.35)',
              }}
            >
              <SmartToyRoundedIcon fontSize="small" />
            </Box>
            <Typography fontWeight={900} fontSize={22} letterSpacing="-0.03em">
              ApplyAI
            </Typography>
          </Stack>
        )}

        <Box textAlign={{ xs: 'center', md: 'left' }}>
          <Typography fontWeight={900} sx={{ fontSize: { xs: 24, sm: 28 }, letterSpacing: '-0.035em' }}>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 14, sm: 15 } }}>
            Sign in to continue your job search
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus={isDesktop}
          fullWidth
          required
          inputProps={{ inputMode: 'email' }}
        />

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          fullWidth
          required
          helperText="Minimum 6 characters"
          InputProps={{
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

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ py: 1.5, fontSize: 16, mt: 0.5 }}
          fullWidth
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
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
          xs: `radial-gradient(700px 360px at 50% -10%, rgba(91,92,226,0.22), transparent 55%),
            linear-gradient(180deg, rgba(91,92,226,0.1) 0%, #f3f4fb 45%)`,
          md: `radial-gradient(900px 480px at 8% -10%, rgba(91,92,226,0.2), transparent 55%),
            radial-gradient(700px 420px at 95% 10%, rgba(236,72,153,0.1), transparent 50%),
            linear-gradient(160deg, #eef0ff 0%, #f3f4fb 40%, #f8fafc 100%)`,
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
          top: '18%',
          left: '6%',
          animation: 'float-y 7s ease-in-out infinite',
        }}
      />

      <Box
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1080,
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          gap: { xs: 3, md: 5 },
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
          <Stack spacing={{ xs: 2, md: 3 }} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3.25,
                  background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 14px 32px rgba(91,92,226,0.35)',
                }}
              >
                <SmartToyRoundedIcon />
              </Box>
              <Box>
                <Typography fontWeight={900} fontSize={26} letterSpacing="-0.03em" lineHeight={1.1}>
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
                fontSize: { md: 38, lg: 44 },
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                maxWidth: 480,
              }}
            >
              Land roles faster with a calm AI workspace
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 440, fontSize: 16.5, lineHeight: 1.65 }}>
              Match roles to your resume, tailor drafts, generate cover letters, and track every
              application — without losing control of submit.
            </Typography>

            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ pt: 0.5 }}>
              {highlights.map((item) => (
                <Chip
                  key={item.title}
                  icon={item.icon}
                  label={item.title}
                  sx={{
                    bgcolor: 'rgba(91,92,226,0.1)',
                    color: PRIMARY,
                    fontWeight: 700,
                    border: '1px solid rgba(91,92,226,0.12)',
                    '& .MuiChip-icon': { color: PRIMARY },
                  }}
                />
              ))}
            </Stack>
          </Stack>

          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 0.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.5, px: 1 }}>
              Match roles, tailor resumes, and track applications.
            </Typography>
            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={0.75}
              justifyContent="center"
              sx={{ mt: 1.75 }}
            >
              {highlights.map((item) => (
                <Chip
                  key={item.title}
                  size="small"
                  icon={item.icon}
                  label={item.title}
                  sx={{
                    bgcolor: 'rgba(91,92,226,0.1)',
                    color: PRIMARY,
                    fontWeight: 650,
                    '& .MuiChip-icon': { color: PRIMARY },
                  }}
                />
              ))}
            </Stack>
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
        sx={{ pb: { xs: 2.5, md: 3 }, px: 2, position: 'relative', zIndex: 1 }}
      >
        Secure sign-in · Demo-ready workspace
      </Typography>
    </Box>
  );
}
