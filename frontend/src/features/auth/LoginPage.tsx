import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';

const PRIMARY = '#5b5ce2';

const highlights = [
  {
    icon: <AutoAwesomeRoundedIcon />,
    title: 'Smart Job Matching',
    text: 'AI ranks roles by skills, experience, and location fit.',
  },
  {
    icon: <DescriptionOutlinedIcon />,
    title: 'Resume Tailoring',
    text: 'Beat the ATS with tailored resumes and cover letters.',
  },
  {
    icon: <BoltRoundedIcon />,
    title: 'Smart Apply Assistant',
    text: 'Opens official apply pages — you stay in control.',
  },
  {
    icon: <InsightsRoundedIcon />,
    title: 'Track & Analyze',
    text: 'See applications, interviews, and offers in one place.',
  },
];

export function LoginPage() {
  const { token, loading, error, loginDemo } = useAuthStore();

  if (token) return <Navigate to="/" replace />;

  return (
    <Box className="min-h-screen" sx={{ bgcolor: '#f4f5fb' }}>
      <Box
        className="relative min-h-screen grid lg:grid-cols-2"
        sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 }, gap: 4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center gap-5 py-4"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: PRIMARY,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <SmartToyRoundedIcon />
            </Box>
            <Typography fontWeight={800} fontSize={22}>
              ApplyAI
            </Typography>
          </Stack>

          <Typography
            sx={{ fontWeight: 800, fontSize: { xs: 32, md: 40 }, letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
            AI-Powered Job Application Automation
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
            Find. Match. Tailor. Apply. — a clean workspace for discovering roles and tracking every
            step.
          </Typography>

          <Stack spacing={2} mt={1}>
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(91,92,226,0.12)',
                      color: PRIMARY,
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <Box className="aa-card w-full p-7 md:p-9">
            <Stack spacing={2.5}>
              <Typography fontWeight={800} fontSize={24} letterSpacing="-0.02em">
                Start in seconds
              </Typography>
              <Typography color="text.secondary">
                Demo mode is ready — enter as a candidate and explore the dashboard.
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
                sx={{ py: 1.4 }}
              >
                Enter as Admin
              </Button>
              <Typography variant="caption" color="text.secondary">
                Tip: Use Candidate mode for jobs, Smart Apply, and cover letters.
              </Typography>
            </Stack>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
