import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';

const highlights = [
  {
    icon: <AutoAwesomeRoundedIcon />,
    title: 'AI matching',
    text: 'See fit scores before you spend time applying.',
    color: '#0f8f68',
  },
  {
    icon: <RocketLaunchRoundedIcon />,
    title: 'Faster prep',
    text: 'Cover letters and outreach drafts in one click.',
    color: '#2aa8c4',
  },
  {
    icon: <VerifiedUserRoundedIcon />,
    title: 'Policy-safe apply',
    text: 'Opens official job pages — you stay in control.',
    color: '#e85d4c',
  },
];

export function LoginPage() {
  const { token, loading, error, loginDemo } = useAuthStore();

  if (token) return <Navigate to="/" replace />;

  return (
    <Box className="min-h-screen relative overflow-hidden">
      <Box
        className="aa-float"
        sx={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          top: -80,
          right: -60,
          background: 'radial-gradient(circle, rgba(240,180,41,0.35), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          bottom: -40,
          left: -80,
          background: 'radial-gradient(circle, rgba(42,168,196,0.28), transparent 70%)',
          pointerEvents: 'none',
          animation: 'float-y 7s ease-in-out infinite',
        }}
      />

      <Box
        className="relative min-h-screen grid lg:grid-cols-2"
        sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 } }}
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center gap-6 py-6"
        >
          <Typography
            variant="h1"
            className="aa-shimmer-text aa-page-title"
            sx={{ fontSize: { xs: '3.2rem', md: '4.6rem' }, lineHeight: 1.05 }}
          >
            ApplyAI
          </Typography>
          <Typography
            variant="h4"
            sx={{ maxWidth: 520, fontWeight: 500, color: 'text.secondary', lineHeight: 1.35 }}
          >
            Your colorful command center for jobs, matches, and applications.
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
            Discover roles, score fit instantly, draft materials with AI, and track every step —
            designed to feel clear for first-time users and fast for power users.
          </Typography>

          <Stack spacing={2} mt={1}>
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: `${item.color}22`,
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={700}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.text}
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            ))}
          </Stack>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="flex items-center"
        >
          <Box className="aa-surface rounded-[28px] w-full p-7 md:p-10 relative overflow-hidden">
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(145deg, rgba(15,143,104,0.08), rgba(240,180,41,0.1), rgba(42,168,196,0.08))',
                pointerEvents: 'none',
              }}
            />
            <Stack spacing={3} position="relative">
              <Typography variant="h4">Start in seconds</Typography>
              <Typography color="text.secondary">
                Demo mode is ready — no account setup required. Pick a role and explore the full
                dashboard experience.
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                variant="contained"
                size="large"
                disabled={loading}
                onClick={() => loginDemo(false)}
                startIcon={<RocketLaunchRoundedIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Opening…' : 'Enter as Candidate'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                disabled={loading}
                onClick={() => loginDemo(true)}
                sx={{ py: 1.4, borderWidth: 2 }}
              >
                Enter as Admin
              </Button>
              <Typography variant="caption" color="text.secondary">
                Tip: Use Candidate mode to try jobs, Smart Apply, and cover letters.
              </Typography>
            </Stack>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
