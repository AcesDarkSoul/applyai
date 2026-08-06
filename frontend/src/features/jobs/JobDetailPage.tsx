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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { aiRepository, applicationRepository, jobRepository } from '../../shared/api/repositories';
import type { Job } from '../../shared/types';

export function JobDetailPage() {
  const { id = '' } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [outreachMsg, setOutreachMsg] = useState<string | null>(null);

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

  async function onOutreachApply() {
    if (!job) return;
    setBusy(true);
    setError(null);
    setOutreachMsg(null);
    try {
      const result = await applicationRepository.outreachApply(job.id);
      setOutreachOpen(false);
      const o = result.outreach;
      setOutreachMsg(o.note);
      if (o.channel === 'whatsapp' && o.waLink && !o.sent) {
        window.open(o.waLink, '_blank', 'noopener,noreferrer');
      } else if (o.channel === 'smart_apply') {
        window.open(result.applyUrl, '_blank', 'noopener,noreferrer');
      } else if (o.channel === 'email' && o.body) {
        setLetter(o.body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outreach apply failed');
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
          className="aa-card p-5 md:p-6"
          sx={{
            background: 'linear-gradient(135deg, rgba(91,92,226,0.12), rgba(124,126,240,0.06))',
          }}
        >
          <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
            <Chip label={job.source} color="info" />
            {job.isRemote && <Chip label="Remote" color="success" variant="outlined" />}
            {job.salary && <Chip label={job.salary} color="secondary" />}
          </Stack>
          <Typography fontWeight={800} fontSize={28} letterSpacing="-0.02em" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary" fontWeight={500}>
            {job.company} · {job.location}
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}
      {outreachMsg && <Alert severity="info">{outreachMsg}</Alert>}

      {job.matchBreakdown && (
        <Box className="aa-card p-5">
          <Typography fontWeight={800} fontSize={18} gutterBottom>
            Why you match · {job.matchScore}%
          </Typography>
          <Typography color="text.secondary" mb={2} fontSize={14}>
            Use this breakdown to decide quickly — or improve weak areas on your profile.
          </Typography>
          {Object.entries(job.matchBreakdown)
            .filter(([k]) => k !== 'overall')
            .map(([key, value]) => (
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
                    height: 8,
                    borderRadius: 99,
                    bgcolor: 'rgba(91,92,226,0.12)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      bgcolor: '#5b5ce2',
                    },
                  }}
                />
              </Box>
            ))}
        </Box>
      )}

      <Box className="aa-card p-5">
        <Typography fontWeight={800} fontSize={18} gutterBottom>
          Role overview
        </Typography>
        <Typography whiteSpace="pre-wrap" color="text.secondary" lineHeight={1.7}>
          {job.description}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="large"
          onClick={() => setOutreachOpen(true)}
          disabled={busy}
          startIcon={<SendRoundedIcon />}
        >
          Apply with Outreach
        </Button>
        <Button
          variant="outlined"
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
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Smart Apply</DialogTitle>
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

      <Dialog open={outreachOpen} onClose={() => setOutreachOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Apply with Outreach</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We scan this posting (including LinkedIn/Indeed text) for a public email or phone:
          </Typography>
          <Typography component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>
              <strong>Email found</strong> → send an application email written from your resume
              profile
            </li>
            <li>
              <strong>Phone found</strong> → send a WhatsApp apply message
            </li>
            <li>
              <strong>Neither</strong> → open Smart Apply (official URL — no silent site submit)
            </li>
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Upload your resume on{' '}
            <Button component={RouterLink} to="/profile" size="small" sx={{ p: 0, minWidth: 0 }}>
              Profile
            </Button>{' '}
            first. Sending is dry-run until SendGrid / Twilio are configured and{' '}
            <code>OUTREACH_DRY_RUN=false</code>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOutreachOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void onOutreachApply()} disabled={busy}>
            {busy ? 'Working…' : 'Confirm outreach'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
