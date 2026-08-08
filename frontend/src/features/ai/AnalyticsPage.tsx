import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { applicationRepository } from '../../shared/api/repositories';
import { StatTile } from '../../shared/components/StatTile';
import type { AppStats } from '../../shared/types';

const PRIMARY = '#5b5ce2';

const BAR_COLORS = [PRIMARY, '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6'];

export function AnalyticsPage() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await applicationRepository.stats();
        if (alive) setStats(s);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load analytics');
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
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  const data = [
    { name: 'Applied', value: stats?.applied ?? 0 },
    { name: 'Interview', value: stats?.interview ?? 0 },
    { name: 'Offer', value: stats?.offer ?? 0 },
    { name: 'Rejected', value: stats?.rejected ?? 0 },
    { name: 'Saved', value: stats?.saved ?? 0 },
  ];

  const total =
    (stats?.applied ?? 0) +
    (stats?.interview ?? 0) +
    (stats?.offer ?? 0) +
    (stats?.rejected ?? 0) +
    (stats?.saved ?? 0);

  return (
    <Stack spacing={3}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.14), rgba(15,23,42,0.02) 48%, rgba(20,184,166,0.1))',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
            <InsightsRoundedIcon sx={{ color: PRIMARY }} />
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Funnel health at a glance
            </Typography>
          </Stack>
          <Typography fontWeight={900} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em">
            Insights & Analytics
          </Typography>
          <Typography color="text.secondary" mt={0.75} fontSize={14.5} maxWidth={520}>
            Track how applications move from saved → applied → interview → offer, then improve what
            converts.
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}

      <Box className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total tracked"
          value={total}
          accent={PRIMARY}
          icon={<InsightsRoundedIcon fontSize="small" />}
          delay={0.05}
        />
        <StatTile
          label="Applied"
          value={stats?.applied ?? 0}
          accent="#14b8a6"
          icon={<SendRoundedIcon fontSize="small" />}
          delay={0.1}
        />
        <StatTile
          label="Interviews"
          value={stats?.interview ?? 0}
          accent="#3b82f6"
          icon={<PersonOutlineRoundedIcon fontSize="small" />}
          delay={0.15}
        />
        <StatTile
          label="Offers"
          value={stats?.offer ?? 0}
          accent="#f59e0b"
          icon={<EmojiEventsOutlinedIcon fontSize="small" />}
          delay={0.2}
        />
      </Box>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Box className="aa-card p-5">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography fontWeight={800}>Application funnel</Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <BookmarkBorderRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                {stats?.saved ?? 0} saved
              </Typography>
            </Stack>
          </Stack>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,92,226,0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b6f8c', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#6b6f8c', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: '1px solid rgba(91,92,226,0.15)',
                    boxShadow: '0 10px 28px rgba(91,92,226,0.12)',
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </motion.div>
    </Stack>
  );
}
