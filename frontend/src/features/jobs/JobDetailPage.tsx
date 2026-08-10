import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { aiRepository, applicationRepository, jobRepository } from '../../shared/api/repositories';
import { ContentSections } from '../../shared/components/ContentSections';
import { extractContacts, parseContentSections } from '../../shared/lib/contentParse';
import type { Job, SkillGapResult } from '../../shared/types';

const PRIMARY = '#5b5ce2';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function JobDetailPage() {
  const { id = '' } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [outreachMsg, setOutreachMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [assistiveChecked, setAssistiveChecked] = useState(false);
  const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);
  const [tailoredHtml, setTailoredHtml] = useState<string | null>(null);
  const [tailorNotes, setTailorNotes] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [duplicateWarn, setDuplicateWarn] = useState<string | null>(null);
  const [acknowledgeDuplicate, setAcknowledgeDuplicate] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await jobRepository.get(id);
        if (alive) setJob(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    setAssistiveChecked(false);
    setAcknowledgeDuplicate(false);
  }, [confirmOpen, outreachOpen]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      try {
        const saved = await jobRepository.saved();
        if (alive) setIsSaved(saved.some((j) => j.id === id));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function openSmartApplyConfirm() {
    setDuplicateWarn(null);
    setAcknowledgeDuplicate(false);
    try {
      const check = await applicationRepository.checkDuplicate(id);
      if (check.duplicate && check.message) setDuplicateWarn(check.message);
    } catch {
      /* proceed without pre-check */
    }
    setConfirmOpen(true);
  }

  async function openOutreachConfirm() {
    setDuplicateWarn(null);
    setAcknowledgeDuplicate(false);
    try {
      const check = await applicationRepository.checkDuplicate(id);
      if (check.duplicate && check.message) setDuplicateWarn(check.message);
    } catch {
      /* proceed without pre-check */
    }
    setOutreachOpen(true);
  }

  const sections = useMemo(
    () => (job ? parseContentSections(job.description || '') : []),
    [job],
  );
  const contacts = useMemo(
    () => (job ? extractContacts(job.description || '') : { email: null, phone: null }),
    [job],
  );

  async function onSmartApply() {
    if (!job) return;
    if (duplicateWarn && !acknowledgeDuplicate) {
      setError('Please acknowledge the duplicate-apply warning to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await applicationRepository.smartApply(job.id, {
        acknowledgeDuplicate: Boolean(duplicateWarn) || undefined,
      });
      setConfirmOpen(false);
      if (result.coverLetter) setLetter(result.coverLetter);
      setSavedMsg(
        `Tracked application for ${job.title}. AI cover letter ready below — nothing was opened.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smart Apply failed');
    } finally {
      setBusy(false);
    }
  }

  async function onOutreachApply() {
    if (!job) return;
    if (duplicateWarn && !acknowledgeDuplicate) {
      setError('Please acknowledge the duplicate-apply warning to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    setOutreachMsg(null);
    try {
      const result = await applicationRepository.outreachApply(job.id, {
        acknowledgeDuplicate: Boolean(duplicateWarn) || undefined,
      });
      setOutreachOpen(false);
      const o = result.outreach;
      setOutreachMsg(o.note);
      const letterText = result.coverLetter || o.coverLetter || o.body || '';
      if (letterText) setLetter(letterText);
      setSavedMsg(
        o.sent
          ? `Sent in background for ${job.title} — ${o.channel} to ${o.to || 'contact'}.`
          : `Application tracked for ${job.title}. ${o.note}`,
      );
      // Never open WhatsApp / browser — background automation only
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outreach apply failed');
    } finally {
      setBusy(false);
    }
  }

  async function onCoverLetter() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const content = await aiRepository.coverLetter(job.id);
      setLetter(content);
      setSavedMsg('AI cover letter ready — edit and copy anytime.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover letter failed');
    } finally {
      setBusy(false);
    }
  }

  async function copyLetter() {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy cover letter');
    }
  }

  async function onSkillGap() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      setSkillGap(await aiRepository.skillGap(job.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Skill gap analysis failed');
    } finally {
      setBusy(false);
    }
  }

  async function onTailorResume() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const result = await aiRepository.tailorResume(job.id);
      setTailoredHtml(result.resume.htmlContent || null);
      setTailorNotes(result.notes || []);
      setSavedMsg(
        `ATS resume variant ready${result.aiAssisted ? ' (AI-assisted)' : ''} — score ${result.resume.atsScore ?? '—'}. Master profile unchanged.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume tailor failed');
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

  if (!job) {
    return <Alert severity="error">{error || 'Job not found'}</Alert>;
  }

  const isPostLike = job.source === 'linkedin' || job.source === 'googlejobs';

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to={isPostLike ? '/posts' : '/jobs'}
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to {isPostLike ? 'posts' : 'jobs'}
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(135deg, rgba(91,92,226,0.14), rgba(124,126,240,0.05) 50%, rgba(236,72,153,0.08))',
          }}
        >
          <Stack direction="row" gap={1} mb={1.5} flexWrap="wrap">
            <Chip label="Job" sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700 }} />
            <Chip label={job.source} variant="outlined" />
            {job.isRemote && <Chip label="Remote" color="success" variant="outlined" />}
            {job.employmentType && <Chip label={job.employmentType} variant="outlined" />}
            {job.salary && <Chip label={job.salary} color="secondary" />}
            {typeof job.matchScore === 'number' && (
              <Chip
                label={`${job.matchScore}% match`}
                sx={{ bgcolor: `${PRIMARY}18`, color: PRIMARY, fontWeight: 800 }}
              />
            )}
          </Stack>
          <Typography fontWeight={900} fontSize={{ xs: 26, md: 32 }} letterSpacing="-0.03em" gutterBottom>
            {job.title}
          </Typography>
          <Typography color="text.secondary" fontWeight={600} fontSize={15}>
            {job.company} · {job.location}
          </Typography>
        </Box>
      </motion.div>

      {error && <Alert severity="error">{error}</Alert>}
      {savedMsg && <Alert severity="success">{savedMsg}</Alert>}
      {outreachMsg && <Alert severity="info">{outreachMsg}</Alert>}

      <Box className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <BusinessOutlinedIcon fontSize="small" />, label: 'Company', value: job.company },
          { icon: <PlaceOutlinedIcon fontSize="small" />, label: 'Location', value: job.location },
          {
            icon: <WorkOutlineRoundedIcon fontSize="small" />,
            label: 'Type',
            value: job.employmentType || (job.isRemote ? 'Remote' : 'On-site / hybrid'),
          },
          {
            icon: <ScheduleRoundedIcon fontSize="small" />,
            label: 'Posted',
            value: formatDate(job.postedAt),
          },
        ].map((item) => (
          <Box key={item.label} className="aa-card p-3.5">
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75} sx={{ color: PRIMARY }}>
              {item.icon}
              <Typography fontSize={12} fontWeight={700} color="text.secondary">
                {item.label}
              </Typography>
            </Stack>
            <Typography fontWeight={700} fontSize={14}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {(contacts.email || contacts.phone) && (
        <Box className="aa-card p-4">
          <Typography fontWeight={800} fontSize={14} mb={1}>
            Contacts found in listing
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {contacts.email && <Chip label={contacts.email} color="primary" variant="outlined" />}
            {contacts.phone && <Chip label={contacts.phone} color="secondary" variant="outlined" />}
          </Stack>
        </Box>
      )}

      {job.matchBreakdown && (
        <Box className="aa-card p-5">
          <Typography fontWeight={800} fontSize={18} gutterBottom>
            Why you match · {job.matchScore}%
          </Typography>
          <Typography color="text.secondary" mb={2} fontSize={14}>
            Use this breakdown to decide quickly — or improve weak areas on your profile.
          </Typography>
          {Object.entries(job.matchBreakdown)
            .filter(([k]) => k !== 'overall')
            .map(([key, value]) => (
              <Box key={key} mb={1.5}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography textTransform="capitalize" fontWeight={600}>
                    {key}
                  </Typography>
                  <Typography fontWeight={700} color="primary.main">
                    {value}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={value}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    bgcolor: 'rgba(91,92,226,0.12)',
                    '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: PRIMARY },
                  }}
                />
              </Box>
            ))}
          <Button
            sx={{ mt: 1, fontWeight: 800, borderRadius: 2 }}
            variant="outlined"
            startIcon={<SchoolRoundedIcon />}
            disabled={busy}
            onClick={() => void onSkillGap()}
          >
            Skill gap + learning roadmap
          </Button>
        </Box>
      )}

      {skillGap && (
        <Box className="aa-card p-5">
          <Typography fontWeight={800} fontSize={18} gutterBottom>
            Skill gap · {skillGap.matchScore}% match
          </Typography>
          <Typography color="text.secondary" fontSize={14} mb={1.5}>
            {skillGap.summary}
            {skillGap.aiAssisted ? ' · AI coach' : ''}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mb={2}>
            {skillGap.matchedSkills.map((s) => (
              <Chip key={`m-${s}`} size="small" color="success" variant="outlined" label={s} />
            ))}
            {skillGap.missingSkills.map((s) => (
              <Chip key={`x-${s}`} size="small" color="warning" label={`Gap: ${s}`} />
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {skillGap.learningRoadmap.map((step) => (
              <Box key={step.skill} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(91,92,226,0.06)' }}>
                <Typography fontWeight={800}>
                  {step.skill} · ~{step.estimatedHours}h
                </Typography>
                <Typography fontSize={13} color="text.secondary" mb={0.75}>
                  {step.why}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {step.resources.map((r) => (
                    <Link key={r.url} href={r.url} target="_blank" rel="noreferrer" fontSize={13}>
                      {r.title}
                    </Link>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <Box className="aa-card p-5 md:p-6">
        <Typography fontWeight={800} fontSize={18} mb={1}>
          Full job details
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <ContentSections sections={sections} />
      </Box>

      <Box className="aa-card p-5">
        <Typography fontWeight={800} fontSize={16} mb={1.5}>
          Complete original description
        </Typography>
        <Typography
          whiteSpace="pre-wrap"
          color="text.secondary"
          fontSize={14}
          lineHeight={1.75}
          sx={{ maxHeight: 360, overflow: 'auto' }}
        >
          {job.description}
        </Typography>
      </Box>

      <Box
        className="aa-card p-4"
        sx={{
          position: { lg: 'sticky' },
          bottom: { lg: 16 },
          zIndex: 2,
          backdropFilter: 'blur(8px)',
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          border: '1px solid rgba(91,92,226,0.12)',
          boxShadow: '0 12px 40px rgba(91,92,226,0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="large"
            onClick={() => void openOutreachConfirm()}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              background: 'linear-gradient(120deg, #5b5ce2, #7c3aed 60%, #ec4899)',
            }}
          >
            Apply with Outreach
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => void openSmartApplyConfirm()}
            disabled={busy}
            startIcon={<OpenInNewRoundedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            Smart Apply
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => void onTailorResume()}
            disabled={busy}
            startIcon={<DescriptionOutlinedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            Tailor resume for this job
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => void onCoverLetter()}
            disabled={busy}
            startIcon={<AutoAwesomeRoundedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            Generate cover letter
          </Button>
          <Button
            size="large"
            startIcon={<BookmarkBorderIcon />}
            sx={{ borderRadius: 2.5 }}
            onClick={async () => {
              if (isSaved) {
                await jobRepository.unsave(job.id);
                setIsSaved(false);
                setSavedMsg('Removed from shortlist');
              } else {
                await jobRepository.save(job.id);
                setIsSaved(true);
                setSavedMsg('Saved to shortlist');
              }
            }}
          >
            {isSaved ? 'Unsave' : 'Save'}
          </Button>
          {isPostLike && (
            <Button component={RouterLink} to={`/posts/post-${job.id}`} size="large" sx={{ borderRadius: 2.5 }}>
              View as post
            </Button>
          )}
        </Stack>
      </Box>

      {letter && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Box
            className="aa-card p-4 md:p-5"
            sx={{
              background: 'linear-gradient(160deg, rgba(91,92,226,0.06), transparent 55%)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography fontWeight={900} fontSize={16}>
                  AI cover letter
                </Typography>
                <Typography color="text.secondary" fontSize={13}>
                  Edit freely, then copy into the application form or email.
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={() => void copyLetter()}
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Stack>
            <TextField
              multiline
              minRows={10}
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
            />
          </Box>
        </motion.div>
      )}

      {tailoredHtml && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Box className="aa-card p-4 md:p-5">
            <Typography fontWeight={900} fontSize={16} mb={0.5}>
              Tailored ATS resume variant
            </Typography>
            <Typography color="text.secondary" fontSize={13} mb={1.5}>
              Saved as a separate version for this job — your master resume is unchanged.
            </Typography>
            {!!tailorNotes.length && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mb={1.5}>
                {tailorNotes.map((n) => (
                  <Chip key={n} size="small" label={n} />
                ))}
              </Stack>
            )}
            <Box
              sx={{
                maxHeight: 420,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                bgcolor: 'background.paper',
              }}
              dangerouslySetInnerHTML={{ __html: tailoredHtml }}
            />
          </Box>
        </motion.div>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm Smart Apply (assistive only)</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We&apos;ll prepare an AI cover letter from your resume and track{' '}
            <strong>{job.title}</strong> at <strong>{job.company}</strong>. You submit on the
            official site — ApplyAI does <strong>not</strong> fill or submit third-party application
            forms (AD-002).
          </Typography>
          {duplicateWarn && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {duplicateWarn}
            </Alert>
          )}
          {duplicateWarn && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={acknowledgeDuplicate}
                  onChange={(_, v) => setAcknowledgeDuplicate(v)}
                />
              }
              label="I understand — apply anyway"
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={assistiveChecked}
                onChange={(_, v) => setAssistiveChecked(v)}
              />
            }
            label="I understand this is assistive only — I remain in control of the final submit."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void onSmartApply()}
            disabled={busy || !assistiveChecked || (Boolean(duplicateWarn) && !acknowledgeDuplicate)}
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            Confirm & track
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={outreachOpen}
        onClose={() => setOutreachOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Apply with Outreach (assistive)</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            We draft an AI cover letter, find a public HR email or phone in the post, then send in
            the <strong>background</strong> from your mailbox (SMTP) or WhatsApp Business API —
            WhatsApp and Gmail apps are <strong>not</strong> opened. No third-party form bots.
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Detected — Email: {contacts.email || 'none'} · Phone: {contacts.phone || 'none'}
          </Typography>
          <Typography fontSize={13} color="text.secondary" sx={{ mt: 1.25 }} paragraph>
            Configure Auto-send under AI Tools first (Gmail App Password + optional WhatsApp Cloud
            API). Per-platform toggles are honored.
          </Typography>
          {duplicateWarn && (
            <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
              {duplicateWarn}
            </Alert>
          )}
          {duplicateWarn && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={acknowledgeDuplicate}
                  onChange={(_, v) => setAcknowledgeDuplicate(v)}
                />
              }
              label="I understand — apply anyway"
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={assistiveChecked}
                onChange={(_, v) => setAssistiveChecked(v)}
              />
            }
            label="I confirm assistive-only outreach from my own accounts."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOutreachOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void onOutreachApply()}
            disabled={busy || !assistiveChecked || (Boolean(duplicateWarn) && !acknowledgeDuplicate)}
            sx={{ borderRadius: 2.5, fontWeight: 800 }}
          >
            {busy ? 'Working…' : 'Confirm outreach'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
