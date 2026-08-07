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
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: { xs: 3, sm: 4 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 16px 40px rgba(30,31,54,0.08)',
      }}
    >
      <Stack spacing={2.25}>
        {!isDesktop && (
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" mb={0.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: PRIMARY,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <SmartToyRoundedIcon fontSize="small" />
            </Box>
            <Typography fontWeight={800} fontSize={20}>
              ApplyAI
            </Typography>
          </Stack>
        )}

        <Box textAlign={{ xs: 'center', md: 'left' }}>
          <Typography fontWeight={800} sx={{ fontSize: { xs: 22, sm: 26 }, letterSpacing: '-0.03em' }}>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 14, sm: 15 } }}>
            Sign in with your email to continue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
          sx={{
            py: 1.45,
            borderRadius: 2.5,
            fontSize: 16,
            mt: 0.5,
          }}
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
        background: {
          xs: `linear-gradient(180deg, rgba(91,92,226,0.12) 0%, #f4f5fb 42%)`,
          md: '#f4f5fb',
        },
      }}
    >
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
        }}
      >
        {/* Brand / marketing — compact on mobile, full on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Stack spacing={{ xs: 2, md: 3 }} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: PRIMARY,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <SmartToyRoundedIcon />
              </Box>
              <Typography fontWeight={800} fontSize={24}>
                ApplyAI
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { md: 36, lg: 40 },
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                maxWidth: 460,
              }}
            >
              Your AI job search workspace
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 440, fontSize: 16, lineHeight: 1.6 }}>
              Match roles, tailor your resume, and track applications — all in one place.
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
                    '& .MuiChip-icon': { color: PRIMARY },
                  }}
                />
              ))}
            </Stack>
          </Stack>

          {/* Mobile intro — short & friendly */}
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
        sx={{ pb: { xs: 2.5, md: 3 }, px: 2 }}
      >
        Secure sign-in · Demo-ready workspace
      </Typography>
    </Box>
  );
}
