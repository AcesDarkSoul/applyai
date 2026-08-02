import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { jobRepository } from '../../shared/api/repositories';
import { JobCard } from '../../shared/components/JobCard';
import type { Job } from '../../shared/types';

export function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await jobRepository.saved();
        if (alive) setJobs(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load saved jobs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Box className="grid place-items-center py-24">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-surface rounded-[28px] p-6 md:p-8"
          sx={{
            background:
              'linear-gradient(120deg, rgba(240,180,41,0.22), rgba(15,143,104,0.1))',
          }}
        >
          <Typography variant="h3" className="aa-page-title" gutterBottom>
            Saved Jobs
          </Typography>
          <Typography color="text.secondary">
            Your shortlist — revisit matches when you&apos;re ready to apply.
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {!jobs.length && (
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/jobs" color="inherit" size="small">
              Browse jobs
            </Button>
          }
        >
          Nothing saved yet. Tap Save on any role to build your shortlist.
        </Alert>
      )}
      <Stack spacing={2}>
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </Stack>
    </Stack>
  );
}
