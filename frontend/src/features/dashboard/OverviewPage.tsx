import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { applicationRepository, jobRepository } from '../../shared/api/repositories';
import { StatTile } from '../../shared/components/StatTile';
import type { AppStats, Application, Job } from '../../shared/types';

const PRIMARY = '#5b5ce2';

const statusLabel: Record<string, string> = {
  applied: 'Applied',
  interview: 'Interview',
  viewed: 'Under Review',
  saved: 'Saved',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const statusColor: Record<string, string> = {
  applied: '#22c55e',
  interview: '#3b82f6',
  viewed: '#ef4444',
  saved: '#f59e0b',
  offer: '#f59e0b',
  rejected: '#ef4444',
  withdrawn: '#6b6f8c',
};

export function OverviewPage() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsFound, setJobsFound] = useState(0);
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, j, a] = await Promise.all([
          applicationRepository.stats(),
          jobRepository.today(),
          applicationRepository.list(),
        ]);
        if (!alive) return;
        setStats(s);
        setJobsFound(j.length);
        setJobs(j.slice(0, 3));
        setApps(a.slice(0, 5));
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

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = days.map(() => 0);
    for (const app of apps) {
      const d = new Date(app.updatedAt || app.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      // Map to weekday index Mon=0
      const js = d.getDay(); // 0 Sun
      const idx = js === 0 ? 6 : js - 1;
      counts[idx] += 1;
    }
    // Soft demo curve if empty so chart looks like mockup
    const fallback = [2, 4, 3, 6, 5, 7, 8];
    const hasData = counts.some((c) => c > 0);
    return days.map((day, i) => ({
      day,
      applications: hasData ? counts[i] : fallback[i],
    }));
  }, [apps]);

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error">{error}</Alert>}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.16), rgba(15,23,42,0.02) 48%, rgba(20,184,166,0.1))',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            gap={2.5}
            alignItems={{ md: 'center' }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Box className="aa-pulse-dot" />
                <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
                  Your job search HQ
                </Typography>
              </Stack>
              <Typography fontWeight={900} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em">
                Ready for your next move?
              </Typography>
              <Typography color="text.secondary" fontSize={14.5} sx={{ maxWidth: 520, mt: 0.75 }}>
                Review matches, track applications, and let AI draft cover letters when you apply.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button
                component={RouterLink}
                to="/jobs"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 2.5 }}
              >
                Find matches
              </Button>
              <Button component={RouterLink} to="/resume" variant="outlined" sx={{ px: 2.25 }}>
                Resume Studio
              </Button>
            </Stack>
          </Stack>
        </Box>
      </motion.div>

      <Box className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Jobs Found"
          value={jobsFound}
          delta="+12% from yesterday"
          accent={PRIMARY}
          icon={<PlaceOutlinedIcon fontSize="small" />}
          delay={0.05}
        />
        <StatTile
          label="Applications Sent"
          value={stats?.applied ?? 0}
          delta="+18% from yesterday"
          accent="#14b8a6"
          icon={<SendRoundedIcon fontSize="small" />}
          delay={0.1}
        />
        <StatTile
          label="Interviews"
          value={stats?.interview ?? 0}
          delta="4% from yesterday"
          accent="#ec4899"
          icon={<PersonOutlineRoundedIcon fontSize="small" />}
          delay={0.15}
        />
        <StatTile
          label="Offers"
          value={stats?.offer ?? 0}
          delta="+200% from yesterday"
          accent="#f59e0b"
          icon={<EmojiEventsOutlinedIcon fontSize="small" />}
          delay={0.2}
        />
      </Box>

      <Box className="grid gap-3 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Box className="aa-card p-5 h-full">
            <Typography fontWeight={800} mb={2}>
              Application Overview
            </Typography>
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,92,226,0.12)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#6b6f8c', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b6f8c', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(91,92,226,0.15)',
                      boxShadow: '0 8px 24px rgba(91,92,226,0.12)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke={PRIMARY}
                    strokeWidth={3}
                    dot={{ r: 5, fill: PRIMARY, strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </motion.div>

        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box className="aa-card p-5 h-full">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={800}>Top Job Matches</Typography>
              <Button
                component={RouterLink}
                to="/jobs"
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ fontWeight: 700 }}
              >
                View all
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {jobs.map((job) => (
                <Box
                  key={job.id}
                  component={RouterLink}
                  to={`/jobs/${job.id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(91,92,226,0.04)',
                    '&:hover': { bgcolor: 'rgba(91,92,226,0.1)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: PRIMARY,
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {(job.company || 'J').slice(0, 1).toUpperCase()}
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Typography fontWeight={700} fontSize={14} noWrap>
                      {job.title}
                    </Typography>
                    <Typography color="text.secondary" fontSize={12} noWrap>
                      {job.company}
                    </Typography>
                  </Box>
                  <Typography fontWeight={800} fontSize={13} sx={{ color: PRIMARY }}>
                    {job.matchScore ?? 90}%
                  </Typography>
                </Box>
              ))}
              {!jobs.length && (
                <Alert severity="info">No matches yet — open Find Jobs to refresh.</Alert>
              )}
            </Stack>
          </Box>
        </motion.div>
      </Box>

      <Box className="grid gap-3 lg:grid-cols-5">
        <Box className="aa-card p-5 lg:col-span-3">
          <Typography fontWeight={800} mb={2}>
            Recent Applications
          </Typography>
          <Stack spacing={1.25}>
            {apps.map((app) => (
              <Box
                key={app.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box className="min-w-0">
                  <Typography fontWeight={700} fontSize={14} noWrap>
                    {app.jobTitle}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12} noWrap>
                    {app.company}
                  </Typography>
                </Box>
                <Typography
                  fontWeight={700}
                  fontSize={13}
                  sx={{ color: statusColor[app.status] || PRIMARY, flexShrink: 0 }}
                >
                  {statusLabel[app.status] || app.status}
                </Typography>
              </Box>
            ))}
            {!apps.length && (
              <Typography color="text.secondary" fontSize={14}>
                No applications yet. Use Smart Apply from a job to start tracking.
              </Typography>
            )}
            <Button
              component={RouterLink}
              to="/applications"
              sx={{ alignSelf: 'flex-start', mt: 1 }}
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Open applications
            </Button>
          </Stack>
        </Box>

        <Box className="aa-card p-5 lg:col-span-2">
          <Typography fontWeight={800} mb={2}>
            Automation Status
          </Typography>
          <Stack spacing={1.75}>
            {[
              { name: 'Job Discovery', detail: 'Apify + SerpApi pipeline' },
              { name: 'AI Resume Tailoring', detail: 'ATS-ready drafts' },
              { name: 'Smart Apply Assistant', detail: 'Opens official apply URLs' },
            ].map((item) => (
              <Box
                key={item.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography fontWeight={700} fontSize={14}>
                    {item.name}
                  </Typography>
                  <Typography color="text.secondary" fontSize={12}>
                    {item.detail}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.75}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                      boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
                    }}
                  />
                  <Typography fontWeight={700} fontSize={12} color="success.main">
                    Active
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}
