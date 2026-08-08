import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { profileRepository } from '../../shared/api/repositories';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeBuilderInput,
  UserProfile,
} from '../../shared/types';
import { useAuthStore } from '../auth/authStore';

const PRIMARY = '#5b5ce2';

function uid(): string {
  return crypto.randomUUID();
}

function emptyExperience(): ExperienceEntry {
  return {
    id: uid(),
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: [''],
  };
}

function emptyEducation(): EducationEntry {
  return {
    id: uid(),
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    details: '',
  };
}

function emptyProject(): ProjectEntry {
  return {
    id: uid(),
    name: '',
    url: '',
    tech: '',
    description: '',
    bullets: [''],
  };
}

function fromProfile(profile: UserProfile | null): ResumeBuilderInput {
  return {
    displayName: profile?.displayName || '',
    title: profile?.title || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || profile?.preferredLocations?.[0] || '',
    linkedinUrl: profile?.linkedinUrl || '',
    website: profile?.website || '',
    summary: profile?.summary || '',
    skills: profile?.skills || [],
    experienceYears: profile?.experienceYears,
    experience: profile?.experienceEntries?.length
      ? profile.experienceEntries.map((e) => ({
          id: e.id || uid(),
          company: e.company || '',
          title: e.title || '',
          location: e.location || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          current: e.current ?? false,
          bullets: e.bullets?.length ? e.bullets : [''],
        }))
      : [emptyExperience()],
    education: profile?.educationEntries?.length
      ? profile.educationEntries.map((e) => ({
          id: e.id || uid(),
          school: e.school || '',
          degree: e.degree || '',
          field: e.field || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          details: e.details || '',
        }))
      : profile?.education?.length
        ? profile.education.map((line) => ({
            id: uid(),
            school: line,
            degree: line,
            field: '',
            startDate: '',
            endDate: '',
            details: '',
          }))
        : [emptyEducation()],
    projects: profile?.projects?.length
      ? profile.projects.map((p) => ({
          id: p.id || uid(),
          name: p.name || '',
          url: p.url || '',
          tech: p.tech || '',
          description: p.description || '',
          bullets: p.bullets?.length ? p.bullets : [''],
        }))
      : [emptyProject()],
    certifications: profile?.certifications || [],
    languages: profile?.languages || [],
    achievements: profile?.achievements || [],
    template: 'modern',
  };
}

function downloadHtml(html: string, fileName: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

interface ResumeBuilderPanelProps {
  onBuilt?: () => void;
}

export function ResumeBuilderPanel({ onBuilt }: ResumeBuilderPanelProps) {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [form, setForm] = useState<ResumeBuilderInput>(() => fromProfile(profile));
  const [skillsText, setSkillsText] = useState((profile?.skills || []).join(', '));
  const [certsText, setCertsText] = useState((profile?.certifications || []).join('\n'));
  const [langsText, setLangsText] = useState((profile?.languages || []).join(', '));
  const [achievementsText, setAchievementsText] = useState(
    (profile?.achievements || []).join('\n'),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(profile?.atsScore ?? null);

  useEffect(() => {
    if (!profile) return;
    setForm(fromProfile(profile));
    setSkillsText((profile.skills || []).join(', '));
    setCertsText((profile.certifications || []).join('\n'));
    setLangsText((profile.languages || []).join(', '));
    setAchievementsText((profile.achievements || []).join('\n'));
    setAtsScore(profile.atsScore ?? null);
  }, [profile]);

  const splitList = (text: string, sep = /[,;\n]/) =>
    text
      .split(sep)
      .map((s) => s.trim())
      .filter(Boolean);

  const canBuild = useMemo(() => {
    return (
      form.displayName.trim().length > 0 &&
      (skillsText.trim().length > 0 ||
        (form.summary || '').trim().length > 0 ||
        form.experience.some((e) => e.company || e.title))
    );
  }, [form, skillsText]);

  async function onBuild() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: ResumeBuilderInput = {
        ...form,
        skills: splitList(skillsText),
        certifications: splitList(certsText, /\n/),
        languages: splitList(langsText),
        achievements: splitList(achievementsText, /\n/),
        experience: form.experience
          .filter((e) => e.company.trim() || e.title.trim())
          .map((e) => ({
            ...e,
            bullets: e.bullets.map((b) => b.trim()).filter(Boolean),
          })),
        education: form.education.filter((e) => e.school.trim() || e.degree.trim()),
        projects: form.projects
          .filter((p) => p.name.trim())
          .map((p) => ({
            ...p,
            bullets: (p.bullets || []).map((b) => b.trim()).filter(Boolean),
          })),
      };
      const result = await profileRepository.buildResume(payload);
      await refreshProfile();
      setPreviewHtml(result.resume.htmlContent || null);
      setAtsScore(result.resume.atsScore ?? result.profile.atsScore ?? null);
      setMessage(
        `Advanced resume “${result.resume.fileName}” saved. ATS score ${result.resume.atsScore ?? '—'}.`,
      );
      onBuilt?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build resume');
    } finally {
      setSaving(false);
    }
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setForm((f) => ({
      ...f,
      experience: f.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    setForm((f) => ({
      ...f,
      education: f.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function updateProject(id: string, patch: Partial<ProjectEntry>) {
    setForm((f) => ({
      ...f,
      projects: f.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  return (
    <Stack spacing={2.5}>
      <Box
        className="aa-card p-5"
        sx={{
          background: 'linear-gradient(120deg, rgba(91,92,226,0.1), rgba(15,23,42,0.04))',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <AutoAwesomeRoundedIcon sx={{ color: PRIMARY }} />
          <Typography fontWeight={800} fontSize={18}>
            Advanced Resume Builder
          </Typography>
          {atsScore != null && <Chip size="small" label={`ATS ${atsScore}`} color="primary" />}
        </Stack>
        <Typography color="text.secondary" fontSize={13.5}>
          Fill your details once — we generate a polished multi-section resume and store it with your
          profile.
        </Typography>
      </Box>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box className="aa-card p-5">
        <Typography fontWeight={800} mb={2}>
          Contact & headline
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Full name"
              required
              fullWidth
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <TextField
              label="Target title"
              fullWidth
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Senior Full Stack Engineer"
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Email"
              fullWidth
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              label="Location"
              fullWidth
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="LinkedIn"
              fullWidth
              value={form.linkedinUrl || ''}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            />
            <TextField
              label="Website / portfolio"
              fullWidth
              value={form.website || ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <TextField
              select
              label="Template"
              fullWidth
              value={form.template || 'modern'}
              onChange={(e) =>
                setForm({
                  ...form,
                  template: e.target.value as ResumeBuilderInput['template'],
                })
              }
            >
              <MenuItem value="modern">Modern</MenuItem>
              <MenuItem value="classic">Classic</MenuItem>
              <MenuItem value="executive">Executive</MenuItem>
            </TextField>
          </Stack>
          <TextField
            label="Professional summary"
            multiline
            minRows={3}
            value={form.summary || ''}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            helperText="2–4 sentences that highlight impact and domain strength"
          />
          <TextField
            label="Skills (comma separated)"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            helperText="Example: TypeScript, React, Node.js, Firebase, System Design"
          />
          <TextField
            label="Years of experience"
            type="number"
            value={form.experienceYears ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                experienceYears: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            sx={{ maxWidth: 220 }}
          />
        </Stack>
      </Box>

      <Box className="aa-card p-5">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={800}>Experience</Typography>
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ ...form, experience: [...form.experience, emptyExperience()] })}
          >
            Add role
          </Button>
        </Stack>
        <Stack spacing={2.5} divider={<Divider flexItem />}>
          {form.experience.map((exp, idx) => (
            <Stack key={exp.id} spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700} fontSize={14}>
                  Role {idx + 1}
                </Typography>
                <IconButton
                  size="small"
                  disabled={form.experience.length <= 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      experience: form.experience.filter((e) => e.id !== exp.id),
                    })
                  }
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  label="Job title"
                  fullWidth
                  value={exp.title}
                  onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                />
                <TextField
                  label="Company"
                  fullWidth
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  label="Location"
                  fullWidth
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                />
                <TextField
                  label="Start"
                  fullWidth
                  placeholder="Jan 2022"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                />
                <TextField
                  label="End"
                  fullWidth
                  placeholder="Present"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                />
              </Stack>
              <TextField
                label="Impact bullets (one per line)"
                multiline
                minRows={3}
                value={exp.bullets.join('\n')}
                onChange={(e) =>
                  updateExperience(exp.id, {
                    bullets: e.target.value.split('\n'),
                  })
                }
                helperText="Use action + metric when possible"
              />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box className="aa-card p-5">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={800}>Education</Typography>
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ ...form, education: [...form.education, emptyEducation()] })}
          >
            Add school
          </Button>
        </Stack>
        <Stack spacing={2}>
          {form.education.map((ed) => (
            <Stack key={ed.id} spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  label="Degree"
                  fullWidth
                  value={ed.degree}
                  onChange={(e) => updateEducation(ed.id, { degree: e.target.value })}
                />
                <TextField
                  label="Field"
                  fullWidth
                  value={ed.field || ''}
                  onChange={(e) => updateEducation(ed.id, { field: e.target.value })}
                />
                <TextField
                  label="School"
                  fullWidth
                  value={ed.school}
                  onChange={(e) => updateEducation(ed.id, { school: e.target.value })}
                />
              </Stack>
              <Stack direction="row" justifyContent="flex-end">
                <IconButton
                  size="small"
                  disabled={form.education.length <= 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      education: form.education.filter((e) => e.id !== ed.id),
                    })
                  }
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box className="aa-card p-5">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={800}>Projects</Typography>
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => setForm({ ...form, projects: [...form.projects, emptyProject()] })}
          >
            Add project
          </Button>
        </Stack>
        <Stack spacing={2}>
          {form.projects.map((p) => (
            <Stack key={p.id} spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  label="Project name"
                  fullWidth
                  value={p.name}
                  onChange={(e) => updateProject(p.id, { name: e.target.value })}
                />
                <TextField
                  label="Tech stack"
                  fullWidth
                  value={p.tech || ''}
                  onChange={(e) => updateProject(p.id, { tech: e.target.value })}
                />
              </Stack>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={p.description}
                onChange={(e) => updateProject(p.id, { description: e.target.value })}
              />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box className="aa-card p-5">
        <Typography fontWeight={800} mb={2}>
          Extra sections
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Certifications (one per line)"
            multiline
            minRows={2}
            value={certsText}
            onChange={(e) => setCertsText(e.target.value)}
          />
          <TextField
            label="Languages (comma separated)"
            value={langsText}
            onChange={(e) => setLangsText(e.target.value)}
          />
          <TextField
            label="Achievements (one per line)"
            multiline
            minRows={2}
            value={achievementsText}
            onChange={(e) => setAchievementsText(e.target.value)}
          />
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          disabled={!canBuild || saving}
          startIcon={<AutoAwesomeRoundedIcon />}
          onClick={() => void onBuild()}
        >
          {saving ? 'Building & saving…' : 'Build advanced resume'}
        </Button>
        {previewHtml && (
          <Button
            variant="outlined"
            size="large"
            startIcon={<DownloadRoundedIcon />}
            onClick={() =>
              downloadHtml(
                previewHtml,
                `${(form.displayName || 'resume').toLowerCase().replace(/\s+/g, '-')}-advanced.html`,
              )
            }
          >
            Download HTML
          </Button>
        )}
      </Stack>

      {previewHtml && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Box className="aa-card p-2 overflow-hidden">
            <Typography fontWeight={800} px={2} pt={1.5} pb={1}>
              Preview
            </Typography>
            <Box
              component="iframe"
              title="Resume preview"
              srcDoc={previewHtml}
              sx={{
                width: '100%',
                minHeight: 640,
                border: 0,
                borderRadius: 2,
                bgcolor: '#fff',
              }}
            />
          </Box>
        </motion.div>
      )}
    </Stack>
  );
}
