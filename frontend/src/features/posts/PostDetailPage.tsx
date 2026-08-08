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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { applicationRepository, jobRepository, postRepository } from '../../shared/api/repositories';
import { ContentSections } from '../../shared/components/ContentSections';
import type { HiringPost } from '../../shared/types';

const PRIMARY = '#5b5ce2';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PostDetailPage() {
  const { id = '' } = useParams();
  const [post, setPost] = useState<HiringPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [letter, setLetter] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await postRepository.get(decodeURIComponent(id));
        if (alive) setPost(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSmartApply() {
    if (!post) return;
    setBusy(true);
    setError(null);
    try {
      const result = await applicationRepository.smartApply(post.jobId);
      setConfirmOpen(false);
      if (result.coverLetter) setLetter(result.coverLetter);
      setMsg('AI cover letter ready below — nothing was opened.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smart Apply failed');
    } finally {
      setBusy(false);
    }
  }

  async function onOutreachApply() {
    if (!post) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const result = await applicationRepository.outreachApply(post.jobId);
      setOutreachOpen(false);
      const o = result.outreach;
      setMsg(o.note);
      const letterText = result.coverLetter || o.coverLetter || o.body || '';
      if (letterText) setLetter(letterText);
      // Background only — never open WhatsApp or apply URLs
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outreach failed');
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

  if (!post) {
    return <Alert severity="error">{error || 'Post not found'}</Alert>;
  }

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to="/posts"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to posts
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-5 md:p-7"
          sx={{
            background: 'linear-gradient(135deg, rgba(10,102,194,0.1), rgba(91,92,226,0.08))',
          }}
        >
          <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
            <Chip label="Hiring post" sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700 }} />
            <Chip label={post.source} variant="outlined" />
            {post.isRemote && <Chip label="Remote" color="success" variant="outlined" />}
            {typeof post.matchScore === 'number' && (
              <Chip
                label={`${post.matchScore}% match`}
                sx={{ bgcolor: `${PRIMARY}18`, color: PRIMARY, fontWeight: 800 }}
              />
            )}
          </Stack>
          <Typography fontWeight={800} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em" gutterBottom>
            {post.title}
          </Typography>
          <Typography color="text.secondary" fontWeight={600} fontSize={15}>
            Posted by {post.author || post.company}
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {msg && <Alert severity="info">{msg}</Alert>}

      <Box className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <BusinessOutlinedIcon fontSize="small" />, label: 'Company', value: post.company },
          { icon: <PlaceOutlinedIcon fontSize="small" />, label: 'Location', value: post.location },
          { icon: <MailOutlineRoundedIcon fontSize="small" />, label: 'Email in post', value: post.contacts.email || 'Not listed' },
          { icon: <PhoneOutlinedIcon fontSize="small" />, label: 'Phone in post', value: post.contacts.phone || 'Not listed' },
        ].map((item) => (
          <Box key={item.label} className="aa-card p-3.5">
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75} sx={{ color: PRIMARY }}>
              {item.icon}
              <Typography fontSize={12} fontWeight={700} color="text.secondary">
                {item.label}
              </Typography>
            </Stack>
            <Typography fontWeight={700} fontSize={14} sx={{ wordBreak: 'break-word' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box className="aa-card p-5 md:p-6">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography fontWeight={800} fontSize={18}>
            Full post details
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Posted {formatDate(post.postedAt)}
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />
        <ContentSections sections={post.sections} />
      </Box>

      <Box className="aa-card p-5">
        <Typography fontWeight={800} fontSize={16} mb={1.5}>
          Complete original text
        </Typography>
        <Typography
          whiteSpace="pre-wrap"
          color="text.secondary"
          fontSize={14}
          lineHeight={1.75}
          sx={{ maxHeight: 420, overflow: 'auto' }}
        >
          {post.body || 'No body text available.'}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="large"
          startIcon={<SendRoundedIcon />}
          disabled={busy}
          onClick={() => setOutreachOpen(true)}
        >
          Apply with Outreach
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<OpenInNewRoundedIcon />}
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          Smart Apply
        </Button>
        <Button
          size="large"
          variant="outlined"
          startIcon={<OpenInNewRoundedIcon />}
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open original
        </Button>
        <Button
          size="large"
          startIcon={<BookmarkBorderIcon />}
          onClick={async () => {
            await jobRepository.save(post.jobId);
            setMsg('Saved linked job to shortlist');
          }}
        >
          Save
        </Button>
        <Button component={RouterLink} to={`/jobs/${post.jobId}`} size="large">
          Open as job
        </Button>
      </Stack>

      {letter && (
        <TextField
          label="Outreach email draft"
          multiline
          minRows={8}
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          fullWidth
        />
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Smart Apply</DialogTitle>
        <DialogContent>
          <Typography>
            Open the official post for <strong>{post.title}</strong> at <strong>{post.company}</strong>.
            You complete the application on the source site.
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
        <DialogTitle sx={{ fontWeight: 800 }}>Apply from this post</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We use contacts found in the full post text, then your resume profile for the message.
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Email: {post.contacts.email || 'none'} · Phone: {post.contacts.phone || 'none'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOutreachOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void onOutreachApply()} disabled={busy}>
            {busy ? 'Working…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
