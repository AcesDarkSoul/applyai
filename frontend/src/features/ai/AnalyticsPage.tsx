import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { applicationRepository } from '../../shared/api/repositories';
import type { AppStats } from '../../shared/types';

const PRIMARY = '#5b5ce2';

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

  return (
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-6"
          sx={{
            background: 'linear-gradient(135deg, rgba(91,92,226,0.12), rgba(20,184,166,0.08))',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
            <InsightsRoundedIcon sx={{ color: PRIMARY }} />
            <Typography variant="h5" fontWeight={800}>
              Insights & Analytics
            </Typography>
          </Stack>
          <Typography color="text.secondary">
            Track funnel health across applications — improve & grow over time.
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}

      <Box className="aa-card p-5">
        <Typography fontWeight={800} mb={2}>
          Application funnel
        </Typography>
        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,92,226,0.12)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b6f8c', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#6b6f8c', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid rgba(91,92,226,0.15)',
                }}
              />
              <Bar dataKey="value" fill={PRIMARY} radius={[10, 10, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Stack>
  );
}
