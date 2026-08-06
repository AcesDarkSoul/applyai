import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { profileRepository } from '../../shared/api/repositories';
import { useAuthStore } from '../auth/authStore';

const PRIMARY = '#5b5ce2';

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [summary, setSummary] = useState(profile?.summary || '');
  const [expectedSalary, setExpectedSalary] = useState(profile?.expectedSalary || '');
  const [education, setEducation] = useState((profile?.education || []).join('\n'));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseMeta, setParseMeta] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setTitle(profile.title || '');
    setPhone(profile.phone || '');
    setSkills((profile.skills || []).join(', '));
    setSummary(profile.summary || '');
    setExpectedSalary(profile.expectedSalary || '');
    setEducation((profile.education || []).join('\n'));
  }, [profile]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await profileRepository.uploadResume(file);
      await refreshProfile();
      const p = result.parsed;
      setParseMeta(
        `Parsed via ${p.parseMethod} · ${p.textChars} chars · ATS ${result.profile.atsScore ?? p.atsScore}%`,
      );
      setMessage(
        `Resume “${file.name}” imported. Profile updated with name, skills, title, and summary.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await profileRepository.update({
        displayName,
        title,
        phone,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        summary,
        expectedSalary,
        education: education
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refreshProfile();
      setMessage('Profile saved — match scores and outreach will use these details.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3} maxWidth={820}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-card p-5 md:p-6"
          sx={{
            background: 'linear-gradient(120deg, rgba(91,92,226,0.1), rgba(236,72,153,0.06))',
          }}
        >
          <Typography fontWeight={800} fontSize={22} letterSpacing="-0.02em" gutterBottom>
            Profile & Resume
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Upload any PDF, DOCX, or TXT resume — we extract details and build a strong profile for
            matching, email, and WhatsApp outreach.
          </Typography>
        </Box>
      </motion.div>

      <Box className="aa-card p-5">
        <Stack spacing={2}>
          <Typography fontWeight={800}>Upload resume</Typography>
          <Typography color="text.secondary" fontSize={13}>
            Supported: PDF, DOCX, TXT, MD (max 8MB). LinkedIn job emails/phones are used later when
            you Apply with Outreach.
          </Typography>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".pdf,.docx,.txt,.md,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadRoundedIcon />}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            sx={{ alignSelf: 'flex-start' }}
          >
            {uploading ? 'Parsing resume…' : 'Choose resume file'}
          </Button>
          {profile?.resumeFileName && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={profile.resumeFileName} size="small" />
              {profile.resumeParsedAt && (
                <Chip
                  label={`Parsed ${new Date(profile.resumeParsedAt).toLocaleString()}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          )}
          {parseMeta && (
            <Typography fontSize={12} color="text.secondary">
              {parseMeta}
            </Typography>
          )}
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.75}>
              <Typography fontSize={12} fontWeight={700} color="text.secondary">
                Profile strength
              </Typography>
              <Typography fontSize={12} fontWeight={800} sx={{ color: PRIMARY }}>
                {profile?.profileCompleteness ?? 0}% · ATS {profile?.atsScore ?? '—'}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={profile?.profileCompleteness ?? 0}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: 'rgba(91,92,226,0.12)',
                '& .MuiLinearProgress-bar': { bgcolor: PRIMARY, borderRadius: 99 },
              }}
            />
          </Box>
        </Stack>
      </Box>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box className="aa-card p-5">
        <Stack spacing={2.5}>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Target title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Full Stack Developer"
          />
          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91…"
          />
          <TextField
            label="Skills (comma separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            helperText="Example: TypeScript, React, Node.js"
          />
          <TextField
            label="Education (one per line)"
            multiline
            minRows={2}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />
          <TextField
            label="Expected salary"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(e.target.value)}
          />
          <TextField
            label="Professional summary"
            multiline
            minRows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <Button
            variant="contained"
            size="large"
            onClick={() => void onSave()}
            disabled={saving}
            startIcon={<SaveRoundedIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
