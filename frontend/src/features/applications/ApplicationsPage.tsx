import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { applicationRepository } from '../../shared/api/repositories';
import type { Application, ApplicationStatus } from '../../shared/types';

const statuses: ApplicationStatus[] = [
  'saved',
  'applied',
  'viewed',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

const statusColor: Record<ApplicationStatus, string> = {
  saved: '#f59e0b',
  applied: '#22c55e',
  viewed: '#ef4444',
  interview: '#3b82f6',
  offer: '#f59e0b',
  rejected: '#ef4444',
  withdrawn: '#6b6f8c',
};

export function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setApps(await applicationRepository.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onStatus(id: string, status: ApplicationStatus) {
    try {
      await applicationRepository.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-5 md:p-6"
          sx={{
            background: 'linear-gradient(120deg, rgba(91,92,226,0.1), rgba(236,72,153,0.06))',
          }}
        >
          <Typography fontWeight={800} fontSize={22} letterSpacing="-0.02em" gutterBottom>
            Applications
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Update status as you move — interviews, offers, and follow-ups stay organized.
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {!apps.length && (
        <Alert severity="info">
          No applications yet. Use Smart Apply from a job detail page to start tracking.
        </Alert>
      )}

      <Stack spacing={2}>
        {apps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Box className="aa-card p-5">
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                gap={2}
                alignItems={{ md: 'center' }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {app.jobTitle}
                  </Typography>
                  <Typography color="text.secondary" mb={1}>
                    {app.company} · {app.source}
                  </Typography>
                  <Chip
                    size="small"
                    label={app.status}
                    sx={{
                      bgcolor: `${statusColor[app.status]}22`,
                      color: statusColor[app.status],
                      fontWeight: 800,
                      textTransform: 'capitalize',
                    }}
                  />
                </Box>
                <TextField
                  select
                  label="Update status"
                  size="small"
                  value={app.status}
                  onChange={(e) => void onStatus(app.id, e.target.value as ApplicationStatus)}
                  sx={{ minWidth: 190, bgcolor: 'background.paper', borderRadius: 2 }}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>
          </motion.div>
        ))}
      </Stack>
    </Stack>
  );
}
