import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { profileRepository } from '../../shared/api/repositories';
import { useAuthStore } from '../auth/authStore';

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [summary, setSummary] = useState(profile?.summary || '');
  const [expectedSalary, setExpectedSalary] = useState(profile?.expectedSalary || '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || '');
    setSkills((profile.skills || []).join(', '));
    setSummary(profile.summary || '');
    setExpectedSalary(profile.expectedSalary || '');
  }, [profile]);

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await profileRepository.update({
        displayName,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        summary,
        expectedSalary,
      });
      await refreshProfile();
      setMessage('Profile saved — match scores will reflect your updates.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3} maxWidth={760}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          className="aa-surface rounded-[28px] p-6 md:p-8"
          sx={{
            background:
              'linear-gradient(120deg, rgba(232,93,76,0.14), rgba(15,143,104,0.12), rgba(42,168,196,0.12))',
          }}
        >
          <Typography variant="h3" className="aa-page-title" gutterBottom>
            Profile & Resume
          </Typography>
          <Typography color="text.secondary">
            Keep this page honest and complete — AI matching and cover letters use it.
          </Typography>
        </Box>
      </motion.div>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box className="aa-surface rounded-[28px] p-6">
        <Stack spacing={2.5}>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Skills (comma separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            helperText="Example: TypeScript, React, Node.js"
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
