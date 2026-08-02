import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import type { Job } from '../types';

const sourceColor: Record<string, string> = {
  linkedin: '#2aa8c4',
  indeed: '#0f8f68',
  naukri: '#e85d4c',
  other: '#f0b429',
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Box
        className="aa-surface rounded-3xl p-5 md:p-6 relative overflow-hidden"
        sx={{
          transition: 'border-color 0.25s ease',
          '&:hover': { borderColor: accent },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(120deg, ${accent}14, transparent 42%)`,
            pointerEvents: 'none',
          }}
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          position="relative"
        >
          <Box>
            <Stack direction="row" gap={1} mb={1} flexWrap="wrap" alignItems="center">
              <Chip
                size="small"
                label={job.source}
                sx={{ bgcolor: `${accent}22`, color: accent, fontWeight: 700 }}
              />
              {job.isRemote && (
                <Chip size="small" label="Remote" color="success" variant="outlined" />
              )}
              {typeof job.matchScore === 'number' && (
                <Chip
                  size="small"
                  label={`${job.matchScore}% match`}
                  sx={{
                    bgcolor: 'secondary.main',
                    color: '#1a1405',
                    fontWeight: 800,
                  }}
                />
              )}
            </Stack>
            <Typography variant="h5" className="aa-page-title" gutterBottom>
              {job.title}
            </Typography>
            <Typography color="text.secondary">
              {job.company} · {job.location}
              {job.salary ? ` · ${job.salary}` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start">
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
