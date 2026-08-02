import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import ThumbDownOffAltRoundedIcon from '@mui/icons-material/ThumbDownOffAltRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { applicationRepository, jobRepository } from '../../shared/api/repositories';
import { JobCard } from '../../shared/components/JobCard';
import { StatTile } from '../../shared/components/StatTile';
import type { AppStats, Job } from '../../shared/types';
import { useAuthStore } from '../auth/authStore';

export function OverviewPage() {
  const profile = useAuthStore((s) => s.profile);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, j] = await Promise.all([applicationRepository.stats(), jobRepository.today()]);
        if (!alive) return;
        setStats(s);
        setJobs(j.slice(0, 3));
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-surface rounded-[28px] p-6 md:p-8 relative overflow-hidden"
          sx={{
            background:
              'linear-gradient(135deg, rgba(15,143,104,0.16), rgba(42,168,196,0.12) 45%, rgba(240,180,41,0.18))',
          }}
        >
          <Typography variant="h3" className="aa-page-title" gutterBottom>
            Your day at a glance
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560, mb: 2.5 }}>
            Track applications, polish your profile, and jump into the strongest matches — all in
            one friendly workspace.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/jobs"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Browse today&apos;s jobs
            </Button>
            <Button component={RouterLink} to="/profile" variant="outlined" sx={{ borderWidth: 2 }}>
              Improve profile
            </Button>
          </Stack>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}

      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Applied"
          value={stats?.applied ?? 0}
          accent="#0f8f68"
          icon={<WorkOutlineRoundedIcon />}
          delay={0.05}
        />
        <StatTile
          label="Interviews"
          value={stats?.interview ?? 0}
          accent="#2aa8c4"
          icon={<EventAvailableRoundedIcon />}
          delay={0.1}
        />
        <StatTile
          label="Offers"
          value={stats?.offer ?? 0}
          accent="#f0b429"
          icon={<CardGiftcardRoundedIcon />}
          delay={0.15}
        />
        <StatTile
          label="Rejected"
          value={stats?.rejected ?? 0}
          accent="#e85d4c"
          icon={<ThumbDownOffAltRoundedIcon />}
          delay={0.2}
        />
      </Box>

      <Box className="aa-surface rounded-[28px] p-6">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Box>
            <Typography variant="h5" gutterBottom>
              Profile strength
            </Typography>
            <Typography color="text.secondary">
              Stronger profiles unlock better match scores and smarter AI drafts.
            </Typography>
          </Box>
          <Typography variant="h4" color="primary.main" fontWeight={800}>
            {profile?.profileCompleteness ?? 0}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={profile?.profileCompleteness ?? 0}
          sx={{
            height: 12,
            borderRadius: 99,
            mb: 1.5,
            bgcolor: 'rgba(15,143,104,0.12)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 99,
              background: 'linear-gradient(90deg, #0f8f68, #2aa8c4, #f0b429)',
            },
          }}
        />
        <Typography color="text.secondary">
          ATS score {profile?.atsScore ?? '—'} · Keep skills and summary updated
        </Typography>
      </Box>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Top matches today</Typography>
          <Button component={RouterLink} to="/jobs" endIcon={<ArrowForwardRoundedIcon />}>
            View all
          </Button>
        </Stack>
        <Stack spacing={2}>
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
          {!jobs.length && (
            <Alert severity="info">No jobs yet. Open Today&apos;s Jobs to refresh.</Alert>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
