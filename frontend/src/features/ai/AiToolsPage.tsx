import {
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

const PRIMARY = '#5b5ce2';

const tools = [
  {
    title: 'Resume Builder',
    body: 'Upload a file or build an advanced multi-section resume from your profile form.',
    scoreLabel: 'ATS Score',
    cta: 'Open Resume Studio',
    to: '/resume',
  },
  {
    title: 'Cover Letter Studio',
    body: 'Generate a tailored cover letter from any job detail page.',
    scoreLabel: 'AI Ready',
    cta: 'Open Jobs',
    to: '/jobs',
  },
  {
    title: 'Smart Apply Assistant',
    body: 'Opens the official apply URL — you stay in control of submission.',
    scoreLabel: 'Policy Safe',
    cta: 'Find Jobs',
    to: '/jobs',
  },
];

export function AiToolsPage() {
  const profile = useAuthStore((s) => s.profile);
  const ats = profile?.atsScore ?? 98;

  return (
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-6"
          sx={{
            background: 'linear-gradient(135deg, rgba(91,92,226,0.12), rgba(124,126,240,0.06))',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <AutoAwesomeRoundedIcon sx={{ color: PRIMARY }} />
            <Typography variant="h5" fontWeight={800}>
              AI Tools
            </Typography>
          </Stack>
          <Typography color="text.secondary" maxWidth={560}>
            Tailor resumes, draft cover letters, and use Smart Apply — without silent auto-submit.
          </Typography>
        </Box>
      </motion.div>

      <Box className="grid gap-3 md:grid-cols-3">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Box className="aa-card p-5 h-full flex flex-col">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: 'rgba(91,92,226,0.12)',
                  color: PRIMARY,
                  display: 'grid',
                  placeItems: 'center',
                  mb: 2,
                }}
              >
                <DescriptionOutlinedIcon />
              </Box>
              <Typography fontWeight={800} mb={0.5}>
                {tool.title}
              </Typography>
              <Typography color="text.secondary" fontSize={13.5} mb={2} sx={{ flex: 1 }}>
                {tool.body}
              </Typography>
              {tool.title === 'Resume Builder' && (
                <Box mb={2}>
                  <Stack direction="row" justifyContent="space-between" mb={0.75}>
                    <Typography fontSize={12} fontWeight={700} color="text.secondary">
                      {tool.scoreLabel}
                    </Typography>
                    <Typography fontSize={12} fontWeight={800} sx={{ color: PRIMARY }}>
                      {ats}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Number(ats) || 0)}
                    sx={{
                      height: 8,
                      borderRadius: 99,
                      bgcolor: 'rgba(91,92,226,0.12)',
                      '& .MuiLinearProgress-bar': { bgcolor: PRIMARY, borderRadius: 99 },
                    }}
                  />
                </Box>
              )}
              <Button
                component={RouterLink}
                to={tool.to}
                variant="contained"
                fullWidth
                startIcon={tool.title === 'Resume Builder' ? <DownloadRoundedIcon /> : undefined}
              >
                {tool.cta}
              </Button>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Stack>
  );
}
