import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { aiRepository, applicationRepository, jobRepository } from '../../shared/api/repositories';
import type { Job } from '../../shared/types';

export function JobDetailPage() {
  const { id = '' } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await jobRepository.get(id);
        if (alive) setJob(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSmartApply() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const result = await applicationRepository.smartApply(job.id);
      setConfirmOpen(false);
      window.open(result.applyUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smart Apply failed');
    } finally {
      setBusy(false);
    }
  }

  async function onCoverLetter() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const content = await aiRepository.coverLetter(job.id);
      setLetter(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover letter failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return <Alert severity="error">{error || 'Job not found'}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-surface rounded-[28px] p-6 md:p-8 relative overflow-hidden"
          sx={{
            background:
              'linear-gradient(135deg, rgba(15,143,104,0.18), rgba(42,168,196,0.12), rgba(232,93,76,0.1))',
          }}
        >
          <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
            <Chip label={job.source} color="info" />
            {job.isRemote && <Chip label="Remote" color="success" variant="outlined" />}
            {job.salary && <Chip label={job.salary} color="secondary" />}
          </Stack>
          <Typography variant="h3" className="aa-page-title" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary" variant="h6" fontWeight={500}>
            {job.company} · {job.location}
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}

      {job.matchBreakdown && (
        <Box className="aa-surface rounded-[28px] p-6">
          <Typography variant="h5" gutterBottom>
            Why you match · {job.matchScore}%
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Use this breakdown to decide quickly — or improve weak areas on your profile.
          </Typography>
          {Object.entries(job.matchBreakdown)
            .filter(([k]) => k !== 'overall')
            .map(([key, value], i) => (
              <Box key={key} mb={1.5}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography textTransform="capitalize" fontWeight={600}>
                    {key}
                  </Typography>
                  <Typography fontWeight={700} color="primary.main">
                    {value}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={value}
                  sx={{
                    height: 10,
                    borderRadius: 99,
                    bgcolor: 'rgba(15,143,104,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      background:
                        i % 2 === 0
                          ? 'linear-gradient(90deg, #0f8f68, #2aa8c4)'
                          : 'linear-gradient(90deg, #f0b429, #e85d4c)',
                    },
                  }}
                />
              </Box>
            ))}
        </Box>
      )}

      <Box className="aa-surface rounded-[28px] p-6">
        <Typography variant="h5" gutterBottom>
          Role overview
        </Typography>
        <Typography whiteSpace="pre-wrap" color="text.secondary" lineHeight={1.7}>
          {job.description}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
          startIcon={<OpenInNewRoundedIcon />}
        >
          Smart Apply
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => void onCoverLetter()}
          disabled={busy}
          startIcon={<AutoAwesomeRoundedIcon />}
          sx={{ borderWidth: 2 }}
        >
          Generate cover letter
        </Button>
        <Button
          size="large"
          startIcon={<BookmarkBorderIcon />}
          onClick={async () => {
            await jobRepository.save(job.id);
            setSavedMsg('Saved to shortlist');
          }}
        >
          Save
        </Button>
      </Stack>

      {letter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <TextField
            label="AI cover letter — edit freely before sending"
            multiline
            minRows={10}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
          />
        </motion.div>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontFamily: 'Fraunces, serif' }}>Confirm Smart Apply</DialogTitle>
        <DialogContent>
          <Typography>
            We&apos;ll open the official posting for <strong>{job.title}</strong> at{' '}
            <strong>{job.company}</strong> and start tracking it here. You finish the application on
            the company site.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void onSmartApply()} disabled={busy}>
            Confirm & open
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
