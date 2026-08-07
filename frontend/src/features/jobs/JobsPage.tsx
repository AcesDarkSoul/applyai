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
import { motion } from 'framer-motion';
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
      const data = matchedOnly && !query.trim()
        ? await jobRepository.board('', { minScore: 40 })
        : await jobRepository.board(query);
      // Already sorted by match on backend — keep that order
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
        `Applied to ${result.applied.length} matched role(s)${
          result.skipped.length ? ` · skipped ${result.skipped.length}` : ''
        }. ${result.complianceNote}`,
      );
      // Open official apply URLs that still need manual completion (max 3 tabs)
      for (const url of result.applyUrls.slice(0, 3)) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Box className="aa-card p-5 md:p-6">
          <Typography fontWeight={800} fontSize={22} letterSpacing="-0.02em" gutterBottom>
            Find Jobs
          </Typography>
          <Typography color="text.secondary" fontSize={14} sx={{ maxWidth: 640, mb: 1.5 }}>
            Roles ranked to your resume
            {resumeQuery ? (
              <>
                {' '}
                · matching <strong>{resumeQuery}</strong>
              </>
            ) : (
              <> · upload a resume on Profile for better matches</>
            )}
            . LinkedIn & Google Jobs posts are under Hiring Posts.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
                  bgcolor: 'background.default',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => void load(q)}
              disabled={loading}
              sx={{ minWidth: 120, py: 1.1 }}
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
              sx={{ minWidth: 150, py: 1.1, whiteSpace: 'nowrap' }}
            >
              Best matches
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<BoltRoundedIcon />}
              disabled={applying || loading || !resumeQuery}
              onClick={() => setAutoOpen(true)}
              sx={{ minWidth: 140, py: 1.1, whiteSpace: 'nowrap' }}
            >
              Auto apply
            </Button>
          </Stack>
        </Box>
      </motion.div>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {FILTERS.map((f) => {
          const selected = source === f.id;
          return (
            <Chip
              key={f.id}
              label={`${f.label} (${counts[f.id]})`}
              onClick={() => setSource(f.id)}
              variant={selected ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                borderColor: f.color,
                bgcolor: selected ? f.color : 'transparent',
                color: selected ? '#fff' : 'text.primary',
                '&:hover': { bgcolor: selected ? f.color : `${f.color}18` },
              }}
            />
          );
        })}
      </Stack>

      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}
      {autoResult && (
        <Alert
          severity="success"
          action={
            <Button component={RouterLink} to="/applications" color="inherit" size="small">
              View applications
            </Button>
          }
        >
          {autoResult}
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box className="grid place-items-center py-16">
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : (
        <Stack spacing={1.5}>
          <Typography color="text.secondary" fontWeight={600} fontSize={13}>
            {visible.length} role{visible.length === 1 ? '' : 's'}
            {source !== 'all' ? ` on ${source}` : ''} · sorted by resume match
          </Typography>
          {visible.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} onSave={() => void onSave(job.id)} />
          ))}
          {!visible.length && (
            <Alert severity="info">
              No matching board roles yet. Upload your resume, tap Best matches, or search a skill
              like “android”.
            </Alert>
          )}
        </Stack>
      )}

      <Dialog open={autoOpen} onClose={() => !applying && setAutoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Auto-apply to top matches?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontSize={14}>
            We’ll apply to up to 8 board jobs with ≥55% match to your resume (
            {resumeQuery || 'your profile'}). When a posting has email/phone we outreach; otherwise
            we track the application and open the official apply link for you to finish.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoOpen(false)} disabled={applying}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void onAutoApply()}
            disabled={applying}
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <BoltRoundedIcon />}
          >
            {applying ? 'Applying…' : 'Confirm auto-apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
