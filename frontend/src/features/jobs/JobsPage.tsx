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
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { applicationRepository, jobRepository } from '../../shared/api/repositories';
import { JobCard } from '../../shared/components/JobCard';
import type { Job } from '../../shared/types';
import { useAuthStore } from '../auth/authStore';

const PRIMARY = '#5b5ce2';

type SourceFilter = 'all' | 'naukri' | 'indeed' | 'other';

const FILTERS: Array<{ id: SourceFilter; label: string; color: string }> = [
  { id: 'all', label: 'All boards', color: PRIMARY },
  { id: 'naukri', label: 'Naukri', color: '#ec4899' },
  { id: 'indeed', label: 'Indeed', color: '#14b8a6' },
  { id: 'other', label: 'Other', color: '#f59e0b' },
];

function LoadingSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[0, 1, 2].map((i) => (
        <Box key={i} className="aa-card p-5">
          <Stack direction="row" spacing={2}>
            <Box className="aa-skeleton" sx={{ width: 52, height: 52 }} />
            <Box flex={1}>
              <Box className="aa-skeleton" sx={{ height: 14, width: '35%', mb: 1.25 }} />
              <Box className="aa-skeleton" sx={{ height: 22, width: '70%', mb: 1 }} />
              <Box className="aa-skeleton" sx={{ height: 12, width: '55%' }} />
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function JobsPage() {
  const [params] = useSearchParams();
  const profile = useAuthStore((s) => s.profile);
  const resumeQuery = profile?.title || (profile?.skills || []).slice(0, 3).join(' ') || '';

  const [q, setQ] = useState(params.get('q') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<SourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);

  async function load(query = '', matchedOnly = !query) {
    setLoading(true);
    setError(null);
    try {
      const data =
        matchedOnly && !query.trim()
          ? await jobRepository.board('', { minScore: 40 })
          : await jobRepository.board(query);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get('q') || '';
    setQ(initial);
    void load(initial, !initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, profile?.uid, profile?.title]);

  const counts = useMemo(() => {
    const base: Record<SourceFilter, number> = {
      all: jobs.length,
      naukri: 0,
      indeed: 0,
      other: 0,
    };
    for (const job of jobs) {
      const key = (job.source || 'other').toLowerCase() as SourceFilter;
      if (key in base && key !== 'all') base[key] += 1;
      else base.other += 1;
    }
    return base;
  }, [jobs]);

  const visible = useMemo(() => {
    if (source === 'all') return jobs;
    return jobs.filter((j) => (j.source || 'other').toLowerCase() === source);
  }, [jobs, source]);

  const topMatch = jobs[0]?.matchScore;

  async function onSave(id: string) {
    try {
      await jobRepository.save(id);
      setSavedMsg('Saved to your shortlist');
      setTimeout(() => setSavedMsg(null), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save job');
    }
  }

  async function onAutoApply() {
    setApplying(true);
    setError(null);
    setAutoResult(null);
    try {
      const result = await applicationRepository.autoApply({
        minScore: 55,
        limit: 8,
        boardOnly: true,
      });
      setAutoOpen(false);
      setAutoResult(
        `Background apply finished for ${result.applied.length} role(s)${
          result.skipped.length ? ` · skipped ${result.skipped.length}` : ''
        }. Emails/WhatsApp sent when contacts + your SMTP/WA API are configured — no apps opened.`,
      );
      await load(q, !q.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-apply failed');
      setAutoOpen(false);
    } finally {
      setApplying(false);
    }
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
              'linear-gradient(125deg, rgba(91,92,226,0.14), rgba(15,23,42,0.02) 48%, rgba(236,72,153,0.08))',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            gap={2}
            alignItems={{ md: 'flex-start' }}
            mb={2.5}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Box className="aa-pulse-dot" />
                <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
                  Live matching to your resume
                </Typography>
              </Stack>
              <Typography fontWeight={900} fontSize={{ xs: 26, md: 30 }} letterSpacing="-0.03em">
                Find Jobs
              </Typography>
              <Typography color="text.secondary" fontSize={14.5} sx={{ maxWidth: 560, mt: 0.75 }}>
                {resumeQuery ? (
                  <>
                    Ranked for <strong>{resumeQuery}</strong> — best matches first, with AI cover
                    letters on apply.
                  </>
                ) : (
                  <>
                    Upload a resume in Resume Studio so we can rank roles and draft cover letters for
                    you.
                  </>
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                icon={<WorkOutlineRoundedIcon />}
                label={`${jobs.length} roles`}
                sx={{ fontWeight: 800, bgcolor: 'rgba(91,92,226,0.12)', color: PRIMARY }}
              />
              {typeof topMatch === 'number' && (
                <Chip
                  label={`Top match ${topMatch}%`}
                  sx={{ fontWeight: 800, bgcolor: 'rgba(34,197,94,0.12)', color: '#15803d' }}
                />
              )}
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25}>
            <TextField
              fullWidth
              size="small"
              placeholder={
                resumeQuery
                  ? `Search or leave blank for “${resumeQuery}” matches…`
                  : 'Search title, company, or skill…'
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load(q)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  boxShadow: '0 1px 0 rgba(91,92,226,0.04)',
                },
              }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                onClick={() => void load(q)}
                disabled={loading}
                sx={{ minWidth: 110, py: 1.15, borderRadius: 2.5, fontWeight: 800 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeRoundedIcon />}
                disabled={loading}
                onClick={() => {
                  setQ('');
                  void load('', true);
                }}
                sx={{ py: 1.15, borderRadius: 2.5, fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                Best matches
              </Button>
              <Button
                variant="contained"
                startIcon={<BoltRoundedIcon />}
                disabled={applying || loading || !resumeQuery}
                onClick={() => setAutoOpen(true)}
                sx={{
                  py: 1.15,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(120deg, #5b5ce2, #7c3aed 55%, #ec4899)',
                  boxShadow: '0 10px 24px rgba(91,92,226,0.28)',
                  '&:hover': {
                    background: 'linear-gradient(120deg, #4f50d4, #6d28d9 55%, #db2777)',
                  },
                }}
              >
                Auto apply
              </Button>
            </Stack>
          </Stack>

          {!resumeQuery && (
            <Alert
              severity="info"
              sx={{ mt: 2, borderRadius: 3 }}
              action={
                <Button
                  component={RouterLink}
                  to="/resume"
                  size="small"
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{ fontWeight: 800 }}
                >
                  Open Resume Studio
                </Button>
              }
            >
              Add your resume to unlock ranked matches and AI cover letters on every apply.
            </Alert>
          )}
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {FILTERS.map((f, i) => {
            const selected = source === f.id;
            return (
              <motion.div key={f.id} whileTap={{ scale: 0.96 }}>
                <Chip
                  label={`${f.label} (${counts[f.id]})`}
                  onClick={() => setSource(f.id)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 700,
                    borderColor: f.color,
                    bgcolor: selected ? f.color : 'transparent',
                    color: selected ? '#fff' : 'text.primary',
                    transition: '0.18s ease',
                    animationDelay: `${i * 40}ms`,
                    '&:hover': { bgcolor: selected ? f.color : `${f.color}18` },
                  }}
                />
              </motion.div>
            );
          })}
        </Stack>
      </motion.div>

      <AnimatePresence>
        {savedMsg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              {savedMsg}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      {autoResult && (
        <Alert
          severity="success"
          sx={{ borderRadius: 3 }}
          action={
            <Button component={RouterLink} to="/applications" color="inherit" size="small" sx={{ fontWeight: 800 }}>
              View applications
            </Button>
          }
        >
          {autoResult}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary" fontWeight={700} fontSize={13}>
              {visible.length} role{visible.length === 1 ? '' : 's'}
              {source !== 'all' ? ` on ${source}` : ''} · sorted by resume match
            </Typography>
          </Stack>
          {visible.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} onSave={() => void onSave(job.id)} />
          ))}
          {!visible.length && (
            <Box className="aa-card p-8 text-center">
              <Typography fontWeight={800} fontSize={18} mb={1}>
                No roles in this view yet
              </Typography>
              <Typography color="text.secondary" fontSize={14} mb={2.5} maxWidth={420} mx="auto">
                Try Best matches, clear the source filter, or search a skill from your resume.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={() => {
                  setSource('all');
                  setQ('');
                  void load('', true);
                }}
                sx={{ borderRadius: 2.5, fontWeight: 800 }}
              >
                Show best matches
              </Button>
            </Box>
          )}
        </Stack>
      )}

      <Dialog
        open={autoOpen}
        onClose={() => !applying && setAutoOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 1.5,
            background: 'linear-gradient(120deg, rgba(91,92,226,0.12), rgba(236,72,153,0.08))',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: PRIMARY,
                color: '#fff',
              }}
            >
              {applying ? <CircularProgress size={18} color="inherit" /> : <BoltRoundedIcon />}
            </Box>
            <DialogTitle sx={{ p: 0, fontWeight: 900 }}>Auto-apply to top matches?</DialogTitle>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary" fontSize={14} lineHeight={1.7}>
            We’ll apply to up to 8 board jobs with ≥55% match to{' '}
            <strong>{resumeQuery || 'your profile'}</strong>. Each apply generates an AI cover letter —
            emailed or WhatsApp’d when contacts exist; otherwise we open the official apply link with
            the letter ready to paste.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAutoOpen(false)} disabled={applying} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void onAutoApply()}
            disabled={applying}
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <BoltRoundedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 800, px: 2 }}
          >
            {applying ? 'Applying & writing letters…' : 'Confirm auto-apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
