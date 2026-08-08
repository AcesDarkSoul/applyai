import { Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
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
  const match = typeof job.matchScore === 'number' ? job.matchScore : null;
  const blurb = (job.description || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  const email = job.contactEmail || job.hrEmail;
  const phone = job.contactPhone || job.hrPhone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.995 }}
    >
      <Box
        className="aa-card aa-card-interactive p-4 md:p-5"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: accent,
            opacity: 0.85,
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
          alignItems={{ md: 'center' }}
        >
          <Stack direction="row" spacing={1.75} alignItems="flex-start" className="min-w-0 flex-1">
            {match != null && (
              <Box className="aa-match-ring" title={`${match}% resume match`}>
                {match}%
              </Box>
            )}
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
                {job.employmentType && (
                  <Chip size="small" label={job.employmentType} variant="outlined" />
                )}
                {email && (
                  <Chip
                    size="small"
                    icon={<MailOutlineIcon fontSize="small" />}
                    label={email}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: 11.5 }}
                  />
                )}
                {phone && (
                  <Chip
                    size="small"
                    icon={<PhoneOutlinedIcon fontSize="small" />}
                    label={phone}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: 11.5 }}
                  />
                )}
              </Stack>
              <Typography fontWeight={800} fontSize={18} letterSpacing="-0.02em" gutterBottom>
                {job.title}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={0.75}>
                <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography color="text.secondary" fontSize={13.5}>
                  {job.company} · {job.location}
                  {job.salary ? ` · ${job.salary}` : ''}
                </Typography>
              </Stack>
              {blurb && (
                <Typography color="text.secondary" fontSize={13} sx={{ opacity: 0.9 }}>
                  {blurb}
                  {(job.description || '').length > 140 ? '…' : ''}
                </Typography>
              )}
              {match != null && (
                <Box mt={1.25} maxWidth={220}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, match)}
                    sx={{
                      height: 6,
                      borderRadius: 99,
                      bgcolor: 'rgba(91,92,226,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 99,
                        bgcolor: match >= 70 ? PRIMARY : match >= 50 ? '#f59e0b' : '#94a3b8',
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {onSave && (
              <Button
                startIcon={<BookmarkBorderIcon />}
                onClick={onSave}
                variant="outlined"
                sx={{ borderRadius: 2.5 }}
              >
                Save
              </Button>
            )}
            <Button
              component={RouterLink}
              to={`/jobs/${job.id}`}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ borderRadius: 2.5, px: 2.25, fontWeight: 800 }}
            >
              View role
            </Button>
          </Stack>
        </Stack>
      </Box>
    </motion.div>
  );
}
