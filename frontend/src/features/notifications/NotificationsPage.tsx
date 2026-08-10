import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { notificationRepository } from '../../shared/api/repositories';
import type { AppNotification, NotificationPrefs } from '../../shared/types';

const PRIMARY = '#5b5ce2';

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    inAppEnabled: true,
    emailEnabled: true,
    highMatchJobs: true,
    interviewUpdates: true,
    weeklySummary: true,
    highMatchMinScore: 70,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationRepository.list();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePrefs(next: NotificationPrefs) {
    setSaving(true);
    setError(null);
    try {
      const saved = await notificationRepository.updatePrefs(next);
      setPrefs({ ...prefs, ...saved });
      setMsg('Notification preferences saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save prefs');
    } finally {
      setSaving(false);
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.14), rgba(15,23,42,0.02) 50%, rgba(20,184,166,0.1))',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <NotificationsActiveRoundedIcon sx={{ color: PRIMARY }} />
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Module 10 · Push + email alerts
            </Typography>
          </Stack>
          <Typography fontWeight={900} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em" gutterBottom>
            Notifications
          </Typography>
          <Typography color="text.secondary" fontSize={14.5} maxWidth={560}>
            High-match jobs, interview updates, and weekly summaries — in-app now, email when SendGrid/SMTP is configured.
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {msg && <Alert severity="success">{msg}</Alert>}

      <Box className="aa-card p-5">
        <Typography fontWeight={800} mb={1.5}>
          Preferences
        </Typography>
        <Stack spacing={0.5}>
          {(
            [
              ['emailEnabled', 'Email digests'],
              ['highMatchJobs', 'New high-match jobs'],
              ['interviewUpdates', 'Interview / status updates'],
              ['weeklySummary', 'Weekly summary'],
            ] as const
          ).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={prefs[key] !== false}
                  disabled={saving}
                  onChange={(_, checked) => {
                    const next = { ...prefs, [key]: checked };
                    setPrefs(next);
                    void savePrefs(next);
                  }}
                />
              }
              label={label}
            />
          ))}
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={800}>Inbox</Typography>
        <Button
          startIcon={<DoneAllRoundedIcon />}
          onClick={async () => {
            await notificationRepository.markAllRead();
            await load();
          }}
          sx={{ fontWeight: 700 }}
        >
          Mark all read
        </Button>
      </Stack>

      {!items.length && (
        <Box className="aa-card p-8 text-center">
          <Typography fontWeight={800} mb={1}>
            No notifications yet
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            They appear after daily automation finds high matches or when application status advances.
          </Typography>
        </Box>
      )}

      <Stack spacing={1.25}>
        {items.map((n) => (
          <Box
            key={n.id}
            className="aa-card p-4"
            sx={{ opacity: n.read ? 0.72 : 1, borderLeft: n.read ? undefined : `3px solid ${PRIMARY}` }}
          >
            <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
              <Box>
                <Stack direction="row" spacing={1} mb={0.75} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={n.type.replace(/_/g, ' ')} />
                  {!n.read && <Chip size="small" color="primary" label="new" />}
                  {n.emailSent && <Chip size="small" variant="outlined" label="emailed" />}
                </Stack>
                <Typography fontWeight={800}>{n.title}</Typography>
                <Typography color="text.secondary" fontSize={13.5} whiteSpace="pre-wrap" mt={0.5}>
                  {n.body}
                </Typography>
                <Typography fontSize={12} color="text.secondary" mt={1}>
                  {new Date(n.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Stack spacing={1}>
                {n.href && (
                  <Button
                    component={RouterLink}
                    to={n.href}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Open
                  </Button>
                )}
                {!n.read && (
                  <Button
                    size="small"
                    onClick={async () => {
                      await notificationRepository.markRead(n.id);
                      await load();
                    }}
                  >
                    Mark read
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
