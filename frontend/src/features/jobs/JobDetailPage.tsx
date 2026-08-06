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
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { aiRepository, applicationRepository, jobRepository } from '../../shared/api/repositories';
import { ContentSections } from '../../shared/components/ContentSections';
import { extractContacts, parseContentSections } from '../../shared/lib/contentParse';
import type { Job } from '../../shared/types';

const PRIMARY = '#5b5ce2';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

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

  const sections = useMemo(
    () => (job ? parseContentSections(job.description || '') : []),
    [job],
  );
  const contacts = useMemo(
    () => (job ? extractContacts(job.description || '') : { email: null, phone: null }),
    [job],
  );

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
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  if (!job) {
    return <Alert severity="error">{error || 'Job not found'}</Alert>;
  }

  const isPostLike = job.source === 'linkedin' || job.source === 'googlejobs';

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to={isPostLike ? '/posts' : '/jobs'}
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to {isPostLike ? 'posts' : 'jobs'}
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-5 md:p-7"
          sx={{
            background: 'linear-gradient(135deg, rgba(91,92,226,0.12), rgba(124,126,240,0.06))',
          }}
        >
          <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
            <Chip label="Job" sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700 }} />
            <Chip label={job.source} variant="outlined" />
            {job.isRemote && <Chip label="Remote" color="success" variant="outlined" />}
            {job.employmentType && <Chip label={job.employmentType} variant="outlined" />}
            {job.salary && <Chip label={job.salary} color="secondary" />}
            {typeof job.matchScore === 'number' && (
              <Chip
                label={`${job.matchScore}% match`}
                sx={{ bgcolor: `${PRIMARY}18`, color: PRIMARY, fontWeight: 800 }}
              />
            )}
          </Stack>
          <Typography fontWeight={800} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary" fontWeight={600}>
            {job.company} · {job.location}
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}
      {outreachMsg && <Alert severity="info">{outreachMsg}</Alert>}

      <Box className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <BusinessOutlinedIcon fontSize="small" />, label: 'Company', value: job.company },
          { icon: <PlaceOutlinedIcon fontSize="small" />, label: 'Location', value: job.location },
          {
            icon: <WorkOutlineRoundedIcon fontSize="small" />,
            label: 'Type',
            value: job.employmentType || (job.isRemote ? 'Remote' : 'On-site / hybrid'),
          },
          {
            icon: <ScheduleRoundedIcon fontSize="small" />,
            label: 'Posted',
            value: formatDate(job.postedAt),
          },
        ].map((item) => (
          <Box key={item.label} className="aa-card p-3.5">
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75} sx={{ color: PRIMARY }}>
              {item.icon}
              <Typography fontSize={12} fontWeight={700} color="text.secondary">
                {item.label}
              </Typography>
            </Stack>
            <Typography fontWeight={700} fontSize={14}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {(contacts.email || contacts.phone) && (
        <Box className="aa-card p-4">
          <Typography fontWeight={800} fontSize={14} mb={1}>
            Contacts found in listing
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {contacts.email && <Chip label={contacts.email} color="primary" variant="outlined" />}
            {contacts.phone && <Chip label={contacts.phone} color="secondary" variant="outlined" />}
          </Stack>
        </Box>
      )}

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
                    '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: PRIMARY },
                  }}
                />
              </Box>
            ))}
        </Box>
      )}

      <Box className="aa-card p-5 md:p-6">
        <Typography fontWeight={800} fontSize={18} mb={1}>
          Full job details
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <ContentSections sections={sections} />
      </Box>

      <Box className="aa-card p-5">
        <Typography fontWeight={800} fontSize={16} mb={1.5}>
          Complete original description
        </Typography>
        <Typography
          whiteSpace="pre-wrap"
          color="text.secondary"
          fontSize={14}
          lineHeight={1.75}
          sx={{ maxHeight: 360, overflow: 'auto' }}
        >
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
        {isPostLike && (
          <Button component={RouterLink} to={`/posts/post-${job.id}`} size="large">
            View as post
          </Button>
        )}
      </Stack>

      {letter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <TextField
            label="AI cover letter / outreach draft — edit freely"
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
            We scan this listing for a public email or phone, then use your resume profile.
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Detected — Email: {contacts.email || 'none'} · Phone: {contacts.phone || 'none'}
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
