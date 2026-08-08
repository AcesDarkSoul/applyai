import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { applicationRepository } from '../../shared/api/repositories';
import type { Application, ApplicationStatus } from '../../shared/types';

const PRIMARY = '#5b5ce2';

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
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    return {
      total: apps.length,
      applied: apps.filter((a) => a.status === 'applied' || a.status === 'viewed').length,
      interview: apps.filter((a) => a.status === 'interview').length,
      withLetter: apps.filter((a) => Boolean(a.coverLetter)).length,
    };
  }, [apps]);

  async function onStatus(id: string, status: ApplicationStatus) {
    try {
      await applicationRepository.updateStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function copyLetter(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Could not copy cover letter');
    }
  }

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.14), rgba(15,23,42,0.02) 50%, rgba(236,72,153,0.08))',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Box className="aa-pulse-dot" />
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Outreach + cover letters in one place
            </Typography>
          </Stack>
          <Typography fontWeight={900} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em" gutterBottom>
            Applications
          </Typography>
          <Typography color="text.secondary" fontSize={14.5} maxWidth={560}>
            Track every apply — status updates and AI cover letters stay with each role.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={2}>
            {[
              { label: 'Total', value: stats.total },
              { label: 'Applied', value: stats.applied },
              { label: 'Interviews', value: stats.interview },
              { label: 'Cover letters', value: stats.withLetter },
            ].map((s) => (
              <Chip
                key={s.label}
                label={`${s.label}: ${s.value}`}
                sx={{ fontWeight: 800, bgcolor: 'rgba(91,92,226,0.1)', color: PRIMARY }}
              />
            ))}
          </Stack>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}
      {!apps.length && (
        <Box className="aa-card p-8 text-center">
          <Typography fontWeight={800} fontSize={18} mb={1}>
            No applications yet
          </Typography>
          <Typography color="text.secondary" fontSize={14} mb={2.5}>
            Use Smart Apply or Auto apply from Find Jobs — we’ll draft an AI cover letter every time.
          </Typography>
          <Button
            component={RouterLink}
            to="/jobs"
            variant="contained"
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            Browse matched jobs
          </Button>
        </Box>
      )}

      <Stack spacing={1.75}>
        {apps.map((app, index) => {
          const expanded = openLetter === app.id;
          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <Box className="aa-card aa-card-interactive p-5">
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  gap={2}
                  alignItems={{ md: 'flex-start' }}
                >
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={800} fontSize={18} letterSpacing="-0.02em">
                      {app.jobTitle}
                    </Typography>
                    <Typography color="text.secondary" mb={1.25} fontSize={14}>
                      {app.company} · {app.source}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
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
                      {app.coverLetter && (
                        <Chip
                          size="small"
                          label="AI cover letter"
                          onClick={() => setOpenLetter(expanded ? null : app.id)}
                          onDelete={() => setOpenLetter(expanded ? null : app.id)}
                          deleteIcon={
                            <ExpandMoreRoundedIcon
                              sx={{
                                transform: expanded ? 'rotate(180deg)' : 'none',
                                transition: '0.2s ease',
                              }}
                            />
                          }
                          sx={{ fontWeight: 700, bgcolor: 'rgba(91,92,226,0.1)', color: PRIMARY }}
                        />
                      )}
                    </Stack>

                    <Collapse in={expanded && Boolean(app.coverLetter)}>
                      <Box
                        mt={2}
                        p={2}
                        sx={{
                          borderRadius: 3,
                          bgcolor: 'rgba(91,92,226,0.04)',
                          border: '1px solid rgba(91,92,226,0.12)',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography fontWeight={800} fontSize={13}>
                            Cover letter
                          </Typography>
                          <IconButton
                            size="small"
                            title="Copy"
                            onClick={() => app.coverLetter && void copyLetter(app.id, app.coverLetter)}
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {copied === app.id && (
                          <Typography fontSize={12} color="success.main" mb={0.75} fontWeight={700}>
                            Copied
                          </Typography>
                        )}
                        <Typography
                          whiteSpace="pre-wrap"
                          color="text.secondary"
                          fontSize={13}
                          lineHeight={1.7}
                          sx={{ maxHeight: 200, overflow: 'auto' }}
                        >
                          {app.coverLetter}
                        </Typography>
                      </Box>
                    </Collapse>
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
          );
        })}
      </Stack>
    </Stack>
  );
}
