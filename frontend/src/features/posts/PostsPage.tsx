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
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { postRepository } from '../../shared/api/repositories';
import type { HiringPost } from '../../shared/types';

const PRIMARY = '#5b5ce2';

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PostsPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [posts, setPosts] = useState<HiringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('all');

  async function load(query = '') {
    setLoading(true);
    setError(null);
    try {
      setPosts(await postRepository.list(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
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

  const visible = useMemo(() => {
    if (source === 'all') return posts;
    return posts.filter((p) => p.source?.toLowerCase() === source.toLowerCase());
  }, [posts, source]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: posts.length, indeed: 0, linkedin: 0, naukri: 0, googlejobs: 0, other: 0 };
    for (const p of posts) {
      const src = p.source?.toLowerCase() || 'other';
      if (src in base) {
        base[src] += 1;
      } else {
        base.other += 1;
      }
    }
    return base;
  }, [posts]);

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
              'linear-gradient(125deg, rgba(10,102,194,0.1), rgba(91,92,226,0.12) 45%, rgba(59,130,246,0.08))',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Box className="aa-pulse-dot" />
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Live Hiring Posts
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={0.75}>
            <ArticleOutlinedIcon sx={{ color: PRIMARY }} />
            <Typography fontWeight={900} fontSize={{ xs: 24, md: 28 }} letterSpacing="-0.03em">
              Hiring Posts
            </Typography>
          </Stack>
          <Typography color="text.secondary" fontSize={14.5} sx={{ maxWidth: 640, mb: 2.25 }}>
            Explore live hiring posts with complete details and original contact info extracted directly from active listings.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search posts by title, company, or skill…"
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
            />
            <Button variant="contained" onClick={() => void load(q)} disabled={loading} sx={{ minWidth: 120 }}>
              Search
            </Button>
          </Stack>
        </Box>
      </motion.div>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {[
          { id: 'all', label: 'All', color: PRIMARY, count: counts.all },
          { id: 'indeed', label: 'Indeed', color: '#14b8a6', count: counts.indeed },
          { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', count: counts.linkedin },
          { id: 'naukri', label: 'Naukri', color: '#ec4899', count: counts.naukri },
          { id: 'googlejobs', label: 'Google Jobs', color: '#3b82f6', count: counts.googlejobs },
          { id: 'other', label: 'Other', color: '#f59e0b', count: counts.other },
        ]
          .filter((f) => f.id === 'all' || f.count > 0)
          .map((f) => {
            const selected = source === f.id;
            return (
              <Chip
                key={f.id}
                label={`${f.label} (${f.count})`}
                onClick={() => setSource(f.id)}
                sx={{
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: f.color,
                  bgcolor: selected ? f.color : 'transparent',
                  color: selected ? '#fff' : 'text.primary',
                }}
              />
            );
          })}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box className="grid place-items-center py-16">
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : (
        <Stack spacing={1.5}>
          <Typography color="text.secondary" fontWeight={600} fontSize={13}>
            {visible.length} post{visible.length === 1 ? '' : 's'}
          </Typography>
          {visible.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Box className="aa-card p-4 md:p-5">
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  gap={2}
                  alignItems={{ md: 'flex-start' }}
                >
                  <Box className="min-w-0 flex-1">
                    <Stack direction="row" gap={1} mb={1} flexWrap="wrap" alignItems="center">
                      <Chip
                        size="small"
                        label={post.source}
                        sx={{
                          bgcolor: post.source === 'linkedin' ? '#0a66c218' : '#3b82f618',
                          color: post.source === 'linkedin' ? '#0a66c2' : '#3b82f6',
                          fontWeight: 700,
                        }}
                      />
                      {post.isRemote && <Chip size="small" label="Remote" variant="outlined" color="success" />}
                      {typeof post.matchScore === 'number' && (
                        <Chip
                          size="small"
                          label={`${post.matchScore}% Match`}
                          sx={{ bgcolor: `${PRIMARY}18`, color: PRIMARY, fontWeight: 800 }}
                        />
                      )}
                      {formatDate(post.postedAt) && (
                        <Typography fontSize={12} color="text.secondary">
                          {formatDate(post.postedAt)}
                        </Typography>
                      )}
                    </Stack>
                    <Typography fontWeight={800} fontSize={18} letterSpacing="-0.02em" gutterBottom>
                      {post.title}
                    </Typography>
                    <Typography color="text.secondary" fontSize={14} mb={1.25}>
                      {post.company} · {post.location}
                    </Typography>
                    <Typography color="text.secondary" fontSize={13.5} lineHeight={1.6} sx={{ mb: 1.25 }}>
                      {post.excerpt}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {post.contacts.email && (
                        <Chip
                          size="small"
                          icon={<MailOutlineRoundedIcon />}
                          label={post.contacts.email}
                          variant="outlined"
                        />
                      )}
                      {post.contacts.phone && (
                        <Chip
                          size="small"
                          icon={<PhoneOutlinedIcon />}
                          label={post.contacts.phone}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={`/posts/${encodeURIComponent(post.id)}`}
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ flexShrink: 0 }}
                  >
                    View full post
                  </Button>
                </Stack>
              </Box>
            </motion.div>
          ))}
          {!visible.length && (
            <Alert severity="info">
              No hiring posts available right now. Check back soon or visit Find Jobs to discover active openings.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
