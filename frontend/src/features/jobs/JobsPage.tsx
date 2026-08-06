import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jobRepository } from '../../shared/api/repositories';
import { JobCard } from '../../shared/components/JobCard';
import type { Job } from '../../shared/types';

const PRIMARY = '#5b5ce2';

type SourceFilter = 'all' | 'linkedin' | 'naukri' | 'indeed' | 'googlejobs' | 'other';

const FILTERS: Array<{ id: SourceFilter; label: string; color: string }> = [
  { id: 'all', label: 'All', color: PRIMARY },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2' },
  { id: 'naukri', label: 'Naukri', color: '#ec4899' },
  { id: 'indeed', label: 'Indeed', color: '#14b8a6' },
  { id: 'googlejobs', label: 'Google Jobs', color: '#3b82f6' },
  { id: 'other', label: 'Other', color: '#f59e0b' },
];

export function JobsPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<SourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function load(query = '') {
    setLoading(true);
    setError(null);
    try {
      const data = query ? await jobRepository.search(query) : await jobRepository.today();
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
    void load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const counts = useMemo(() => {
    const base: Record<SourceFilter, number> = {
      all: jobs.length,
      linkedin: 0,
      naukri: 0,
      indeed: 0,
      googlejobs: 0,
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

  return (
    <Stack spacing={2.5}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Box className="aa-card p-5 md:p-6">
          <Typography fontWeight={800} fontSize={22} letterSpacing="-0.02em" gutterBottom>
            Find Jobs
          </Typography>
          <Typography color="text.secondary" fontSize={14} sx={{ maxWidth: 620, mb: 2 }}>
            Search live roles from LinkedIn, Indeed, and Google Jobs. Smart Apply opens the official
            posting — you finish apply on that site.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search title, company, or skill…"
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
      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box className="grid place-items-center py-16">
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : (
        <Stack spacing={1.5}>
          <Typography color="text.secondary" fontWeight={600} fontSize={13}>
            {visible.length} role{visible.length === 1 ? '' : 's'}
            {source !== 'all' ? ` on ${source}` : ''} found
          </Typography>
          {visible.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} onSave={() => void onSave(job.id)} />
          ))}
          {!visible.length && (
            <Alert severity="info">No roles in this category. Try All, or search “react”.</Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
