import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import type { Job } from '../types';

const PRIMARY = '#5b5ce2';

const sourceColor: Record<string, string> = {
  linkedin: '#0a66c2',
  indeed: '#14b8a6',
  naukri: '#ec4899',
  googlejobs: '#3b82f6',
  other: '#f59e0b',
};

interface JobCardProps {
  job: Job;
  onSave?: () => void;
  index?: number;
}

export function JobCard({ job, onSave, index = 0 }: JobCardProps) {
  const accent = sourceColor[job.source] || sourceColor.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <Box className="aa-card p-4 md:p-5">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          alignItems={{ md: 'center' }}
        >
          <Box className="min-w-0 flex-1">
            <Stack direction="row" gap={1} mb={1} flexWrap="wrap" alignItems="center">
              <Chip
                size="small"
                label={job.source}
                sx={{ bgcolor: `${accent}18`, color: accent, fontWeight: 700 }}
              />
              {job.isRemote && (
                <Chip size="small" label="Remote" variant="outlined" color="success" />
              )}
              {typeof job.matchScore === 'number' && (
                <Chip
                  size="small"
                  label={`${job.matchScore}% Match`}
                  sx={{ bgcolor: `${PRIMARY}18`, color: PRIMARY, fontWeight: 800 }}
                />
              )}
            </Stack>
            <Typography fontWeight={800} fontSize={18} letterSpacing="-0.02em" gutterBottom>
              {job.title}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              {job.company} · {job.location}
              {job.salary ? ` · ${job.salary}` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {onSave && (
              <Button startIcon={<BookmarkBorderIcon />} onClick={onSave} variant="outlined">
                Save
              </Button>
            )}
            <Button
              component={RouterLink}
              to={`/jobs/${job.id}`}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              View role
            </Button>
          </Stack>
        </Stack>
      </Box>
    </motion.div>
  );
}
