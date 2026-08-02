import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { jobRepository } from '../../shared/api/repositories';
import { JobCard } from '../../shared/components/JobCard';
import type { Job } from '../../shared/types';

export function JobsPage() {
  const [q, setQ] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
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
    void load();
  }, []);

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
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-surface rounded-[28px] p-6 md:p-8"
          sx={{
            background:
              'linear-gradient(120deg, rgba(42,168,196,0.16), rgba(15,143,104,0.1) 50%, rgba(240,180,41,0.14))',
          }}
        >
          <Typography variant="h3" className="aa-page-title" gutterBottom>
            Today&apos;s Jobs
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            Color-coded sources, live match scores, and one-tap save — built so anyone can shortlist
            fast.
          </Typography>
        </Box>
      </motion.div>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
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
              bgcolor: 'background.paper',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={() => void load(q)}
          disabled={loading}
          sx={{ minWidth: 140, py: 1.6 }}
        >
          Search
        </Button>
      </Stack>

      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box className="grid place-items-center py-16">
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          <Typography color="text.secondary" fontWeight={600}>
            {jobs.length} role{jobs.length === 1 ? '' : 's'} found
          </Typography>
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} onSave={() => void onSave(job.id)} />
          ))}
          {!jobs.length && (
            <Alert severity="info">No matches. Try a broader search like “react” or “node”.</Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
