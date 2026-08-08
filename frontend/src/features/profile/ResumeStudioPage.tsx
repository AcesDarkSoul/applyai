import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function uid() {
  return crypto.randomUUID();
}

function emptyExp(): ExperienceEntry {
  return {
    id: uid(),
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    bullets: [''],
  };
}

function emptyEdu(): EducationEntry {
  return { id: uid(), school: '', degree: '', field: '', endDate: '' };
}

function emptyProject(): ProjectEntry {
  return { id: uid(), name: '', tech: '', description: '', bullets: [''] };
}

function profileToForm(profile: UserProfile | null): ResumeBuilderInput {
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
          bullets: e.bullets?.length ? e.bullets : [''],
        }))
      : [emptyExp()],
    education: profile?.educationEntries?.length
      ? profile.educationEntries.map((e) => ({
          id: e.id || uid(),
          school: e.school || e.degree || '',
          degree: e.degree || e.school || '',
          field: e.field || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
        }))
      : profile?.education?.length
        ? profile.education.map((line) => {
            const parts = line.split(/\s*—\s*|\s*,\s*/);
            const deg = parts[0] || line;
            const sch = parts.slice(1).join(', ') || parts[0] || line;
            return {
              id: uid(),
              degree: deg.trim(),
              school: sch.trim(),
              field: '',
            };
          })
        : [emptyEdu()],
    projects: profile?.projects?.length
      ? profile.projects.map((p) => ({
          id: p.id || uid(),
          name: p.name || '',
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

function printHtml(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function ResumeStudioPage() {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ResumeBuilderInput>(() => profileToForm(profile));
  const [skillsText, setSkillsText] = useState((profile?.skills || []).join(', '));
  const [certsText, setCertsText] = useState((profile?.certifications || []).join('\n'));
  const [langsText, setLangsText] = useState((profile?.languages || []).join(', '));
  const [achievementsText, setAchievementsText] = useState(
    (profile?.achievements || []).join('\n'),
  );

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number>(profile?.atsScore ?? 0);
  const [tips, setTips] = useState<string[]>([]);
  const [templateUsed, setTemplateUsed] = useState<string>('modern');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [targetJobDescription, setTargetJobDescription] = useState('');

  const syncFromProfile = useCallback((p: UserProfile | null) => {
    const next = profileToForm(p);
    setForm(next);
    setSkillsText((p?.skills || []).join(', '));
    setCertsText((p?.certifications || []).join('\n'));
    setLangsText((p?.languages || []).join(', '));
    setAchievementsText((p?.achievements || []).join('\n'));
    setAtsScore(p?.atsScore ?? 0);
  }, []);

  const profileUid = profile?.uid;
  const hydratedUidRef = useRef<string | null>(null);

  // Hydrate form once per login/user — do not overwrite local edits after save/refresh
  useEffect(() => {
    if (!profileUid || hydratedUidRef.current === profileUid) return;
    hydratedUidRef.current = profileUid;
    syncFromProfile(profile);
  }, [profileUid, profile, syncFromProfile]);

  // Load latest resume preview once per user; only fill form gaps from parsed data
  useEffect(() => {
    if (!profileUid) return;
    let cancelled = false;
    (async () => {
      try {
        const latest = await profileRepository.latestResume();
        if (cancelled) return;
        if (!latest) {
          setPreviewHtml(null);
          return;
        }
        setPreviewHtml(latest.htmlContent || null);
        if (latest.atsScore) setAtsScore(latest.atsScore);
        if (latest.template) setTemplateUsed(latest.template);

        const parsed = latest.parsed as Record<string, unknown> | undefined;
        if (!parsed) return;

        const experienceEntries = Array.isArray(parsed.experienceEntries)
          ? (parsed.experienceEntries as ExperienceEntry[])
          : undefined;
        const educationEntries = Array.isArray(parsed.educationEntries)
          ? (parsed.educationEntries as EducationEntry[])
          : undefined;
        const projects = Array.isArray(parsed.projects)
          ? (parsed.projects as ProjectEntry[])
          : undefined;

        // Prefer saved profile; only backfill sections that are still empty
        const needsExp = !profile?.experienceEntries?.length && Boolean(experienceEntries?.length);
        const needsEdu = !profile?.educationEntries?.length && Boolean(educationEntries?.length);
        const needsProjects = !profile?.projects?.length && Boolean(projects?.length);
        const needsBasics =
          (!profile?.displayName && typeof parsed.name === 'string' && parsed.name) ||
          (!profile?.summary && typeof parsed.summary === 'string' && parsed.summary) ||
          (!(profile?.skills?.length) && Array.isArray(parsed.skills) && parsed.skills.length > 0);

        if (!needsExp && !needsEdu && !needsProjects && !needsBasics) return;

        syncFromProfile({
          ...(profile || ({} as UserProfile)),
          displayName:
            profile?.displayName ||
            (typeof parsed.name === 'string' ? parsed.name : '') ||
            '',
          title: profile?.title || (typeof parsed.title === 'string' ? parsed.title : undefined),
          phone: profile?.phone || (typeof parsed.phone === 'string' ? parsed.phone : undefined),
          location:
            profile?.location ||
            (typeof parsed.location === 'string' ? parsed.location : undefined),
          linkedinUrl:
            profile?.linkedinUrl ||
            (typeof parsed.linkedin === 'string' ? parsed.linkedin : undefined),
          website:
            profile?.website ||
            (typeof parsed.website === 'string' ? parsed.website : undefined),
          summary:
            profile?.summary ||
            (typeof parsed.summary === 'string' ? parsed.summary : undefined),
          skills:
            profile?.skills?.length
              ? profile.skills
              : Array.isArray(parsed.skills)
                ? (parsed.skills as string[])
                : [],
          experienceYears:
            profile?.experienceYears ??
            (typeof parsed.experience === 'number' ? parsed.experience : undefined),
          experienceEntries: needsExp ? experienceEntries : profile?.experienceEntries,
          educationEntries: needsEdu ? educationEntries : profile?.educationEntries,
          projects: needsProjects ? projects : profile?.projects,
          certifications:
            profile?.certifications?.length
              ? profile.certifications
              : Array.isArray(parsed.certifications)
                ? (parsed.certifications as string[])
                : profile?.certifications,
          languages:
            profile?.languages?.length
              ? profile.languages
              : Array.isArray(parsed.languages)
                ? (parsed.languages as string[])
                : profile?.languages,
          achievements:
            profile?.achievements?.length
              ? profile.achievements
              : Array.isArray(parsed.achievements)
                ? (parsed.achievements as string[])
                : profile?.achievements,
        } as UserProfile);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load saved resume');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only re-fetch when the signed-in user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid re-hydrating after edits
  }, [profileUid, syncFromProfile]);

  const split = (text: string, sep: RegExp = /[,;\n]/) =>
    text
      .split(sep)
      .map((s) => s.trim())
      .filter(Boolean);

  const payloadFromForm = (): ResumeBuilderInput => ({
    ...form,
    skills: split(skillsText),
    certifications: split(certsText, /\n/),
    languages: split(langsText),
    achievements: split(achievementsText, /\n/),
    experience: form.experience
      .filter((e) => e.company.trim() || e.title.trim() || e.bullets.some((b) => b.trim()))
      .map((e) => ({
        id: e.id || uid(),
        company: e.company.trim(),
        title: e.title.trim(),
        location: (e.location || '').trim(),
        startDate: (e.startDate || '').trim(),
        endDate: (e.endDate || '').trim(),
        bullets: e.bullets.map((b) => b.trim()).filter(Boolean),
      })),
    education: form.education
      .filter((e) => e.school.trim() || e.degree.trim() || (e.field || '').trim())
      .map((e) => ({
        id: e.id || uid(),
        school: e.school.trim(),
        degree: e.degree.trim(),
        field: (e.field || '').trim(),
        endDate: (e.endDate || '').trim(),
      })),
    projects: form.projects
      .filter((p) => p.name.trim() || (p.description || '').trim())
      .map((p) => ({
        id: p.id || uid(),
        name: p.name.trim(),
        tech: (p.tech || '').trim(),
        description: (p.description || '').trim(),
        bullets: (p.bullets || []).map((b) => b.trim()).filter(Boolean),
      })),
  });

  const completeness = profile?.profileCompleteness ?? 0;

  const checklist = useMemo(
    () => [
      { ok: Boolean(form.displayName), label: 'Full name' },
      { ok: Boolean(form.title), label: 'Target title' },
      { ok: Boolean(form.phone), label: 'Phone' },
      { ok: Boolean(form.summary?.length && form.summary.length > 60), label: 'Strong summary' },
      { ok: split(skillsText).length >= 5, label: '5+ skills' },
      {
        ok: form.experience.some((e) => e.company && e.bullets.some((b) => b.trim())),
        label: 'Experience bullets',
      },
      { ok: form.education.some((e) => e.school || e.degree), label: 'Education' },
      { ok: form.projects.some((p) => p.name.trim()), label: 'Projects' },
      { ok: Boolean(previewHtml), label: 'Generated resume' },
    ],
    [form, skillsText, previewHtml],
  );

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    setPreviewHtml(null);
    setTips([]);
    setTargetJobTitle('');
    setTargetJobDescription('');
    try {
      const result = await profileRepository.uploadResume(file);
      // Uploaded resume is source of truth — hydrate form from parsed profile immediately
      syncFromProfile(result.profile);
      setAtsScore(result.profile.atsScore ?? result.parsed.atsScore ?? 0);
      await refreshProfile();
      const roles = result.profile.experienceEntries?.length || 0;
      const projects = result.profile.projects?.length || 0;
      setMessage(
        `Imported “${file.name}” — ${roles} role(s), ${projects} project(s) (${
          result.parsed.parseMethod
        }, ATS ${result.profile.atsScore ?? result.parsed.atsScore ?? '—'}).`,
      );

      // Auto-generate ATS resume from uploaded structured data
      try {
        const fromUpload = profileToForm(result.profile);
        const optimized = await profileRepository.optimizeResume({
          ...fromUpload,
          skills: result.profile.skills || [],
          certifications: result.profile.certifications || [],
          languages: result.profile.languages || [],
          achievements: result.profile.achievements || [],
          experience: fromUpload.experience.filter(
            (e) => e.company.trim() || e.title.trim() || e.bullets.some((b) => b.trim()),
          ),
          education: fromUpload.education.filter((e) => e.school.trim() || e.degree.trim()),
          projects: fromUpload.projects.filter((p) => p.name.trim()),
          jobTitle: undefined,
          jobDescription: undefined,
        });
        syncFromProfile(optimized.profile);
        setPreviewHtml(optimized.resume.htmlContent || null);
        setAtsScore(optimized.resume.atsScore ?? optimized.profile.atsScore ?? 0);
        setTips(optimized.tips || []);
        setTemplateUsed(optimized.template || optimized.resume.template || 'modern');
        await refreshProfile();
        setMessage(
          `Imported “${file.name}” and generated ATS resume (score ${
            optimized.resume.atsScore ?? '—'
          })${targetJobTitle.trim() ? ` tailored for “${targetJobTitle.trim()}”` : ''}.`,
        );
      } catch (optErr) {
        setMessage(
          `Imported “${file.name}” — ${roles} role(s), ${projects} project(s). Generate an ATS resume to refresh the preview.`,
        );
        setError(
          optErr instanceof Error
            ? `Preview not generated yet: ${optErr.message}`
            : 'Preview not generated yet — fill missing fields and generate.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const p = payloadFromForm();
      const saved = await profileRepository.update({
        displayName: p.displayName,
        title: p.title,
        phone: p.phone,
        linkedinUrl: p.linkedinUrl,
        website: p.website,
        location: p.location,
        summary: p.summary,
        skills: p.skills,
        experienceYears: p.experienceYears,
        education: p.education.map((e) =>
          [e.degree, e.field, e.school].filter(Boolean).join(' — '),
        ),
        preferredLocations: p.location ? [p.location] : [],
        experienceEntries: p.experience,
        educationEntries: p.education,
        projects: p.projects,
        certifications: p.certifications,
        languages: p.languages,
        achievements: p.achievements,
      });
      syncFromProfile(saved);
      await refreshProfile();
      setMessage('Profile saved. Generate an ATS resume to refresh the preview.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateBestAts() {
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      // Persist current edits first so optimize uses latest data
      const p = payloadFromForm();
      if (!p.displayName.trim()) {
        throw new Error('Enter your full name before generating a resume.');
      }
      await profileRepository.update({
        displayName: p.displayName,
        title: p.title,
        phone: p.phone,
        linkedinUrl: p.linkedinUrl,
        website: p.website,
        location: p.location,
        summary: p.summary,
        skills: p.skills,
        experienceYears: p.experienceYears,
        education: p.education.map((e) =>
          [e.degree, e.field, e.school].filter(Boolean).join(' — '),
        ),
        preferredLocations: p.location ? [p.location] : [],
        experienceEntries: p.experience,
        educationEntries: p.education,
        projects: p.projects,
        certifications: p.certifications,
        languages: p.languages,
        achievements: p.achievements,
      });

      const result = await profileRepository.optimizeResume({
        ...p,
        jobTitle: targetJobTitle.trim() || undefined,
        jobDescription: targetJobDescription.trim() || undefined,
      });
      syncFromProfile(result.profile);
      setPreviewHtml(result.resume.htmlContent || null);
      setAtsScore(result.resume.atsScore ?? result.profile.atsScore ?? 0);
      setTips(result.tips || []);
      setTemplateUsed(result.template || result.resume.template || 'modern');
      await refreshProfile();
      setMessage(
        `Best ATS resume ready — score ${result.resume.atsScore ?? '—'} · template ${
          result.template || result.resume.template || 'modern'
        }${targetJobTitle.trim() ? ` · tailored for “${targetJobTitle.trim()}”` : ''}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleUpload(file);
  }

  return (
    <Stack spacing={2.5} maxWidth={1280}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.16), rgba(15,23,42,0.04) 55%, rgba(236,72,153,0.08))',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            gap={2}
            alignItems={{ md: 'center' }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Box className="aa-pulse-dot" />
                <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
                  Source of truth for matching
                </Typography>
              </Stack>
              <Typography fontWeight={900} fontSize={{ xs: 24, md: 28 }} letterSpacing="-0.03em">
                Resume Studio
              </Typography>
              <Typography color="text.secondary" fontSize={14.5} mt={0.75} maxWidth={560}>
                Upload your resume — we prioritize that file as the source of truth, show every
                section on screen, then optionally tailor skills and bullets to a job description.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`ATS ${atsScore || '—'}`}
                sx={{ fontWeight: 800, bgcolor: PRIMARY, color: '#fff' }}
              />
              <Chip label={`Profile ${completeness}%`} variant="outlined" sx={{ fontWeight: 700 }} />
              {profile?.resumeFileName && (
                <Chip label={profile.resumeFileName} variant="outlined" size="small" />
              )}
            </Stack>
          </Stack>
          <Box mt={2.25}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, atsScore || completeness)}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: 'rgba(91,92,226,0.12)',
                '& .MuiLinearProgress-bar': { bgcolor: PRIMARY, borderRadius: 99 },
              }}
            />
          </Box>
        </Box>
      </motion.div>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.05fr 0.95fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* LEFT: Upload + Edit */}
        <Stack spacing={2}>
          <Box
            className="aa-card p-5"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragOver ? PRIMARY : 'divider',
              bgcolor: dragOver ? 'rgba(91,92,226,0.06)' : 'background.paper',
              transition: '0.15s ease',
            }}
          >
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography fontWeight={800}>1. Upload resume</Typography>
              <Typography color="text.secondary" fontSize={13}>
                PDF, DOCX, TXT, or MD (max 8MB). Your uploaded content replaces older profile roles
                and projects, then we draft an ATS resume from it.
              </Typography>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept=".pdf,.docx,.txt,.md,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
              <Button
                variant="contained"
                startIcon={<CloudUploadRoundedIcon />}
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? 'Parsing & updating profile…' : 'Choose file or drop here'}
              </Button>
            </Stack>
          </Box>

          <Box className="aa-card p-5">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={800}>2. Edit profile</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    syncFromProfile(null);
                    setTargetJobTitle('');
                    setTargetJobDescription('');
                    setPreviewHtml(null);
                    setMessage('Form reset to default empty state.');
                  }}
                >
                  Reset form
                </Button>
                <Button
                  size="small"
                  startIcon={<SaveRoundedIcon />}
                  disabled={saving}
                  onClick={() => void handleSaveProfile()}
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </Stack>
            </Stack>
            <Stack spacing={1.75}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
                  placeholder="Full Stack Engineer"
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="LinkedIn"
                  fullWidth
                  value={form.linkedinUrl || ''}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                />
                <TextField
                  label="Website"
                  fullWidth
                  value={form.website || ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
                <TextField
                  label="Years exp"
                  type="number"
                  fullWidth
                  value={form.experienceYears ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      experienceYears: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </Stack>
              <TextField
                label="Professional summary"
                multiline
                minRows={3}
                value={form.summary || ''}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
              <TextField
                label="Skills (comma separated)"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                helperText="ATS keywords matter — include tools and domains from target jobs"
              />
              <TextField
                label="Target job title (optional)"
                fullWidth
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer"
                helperText="Used when generating — keeps your uploaded experience, prioritizes matching skills"
              />
              <TextField
                label="Target job description (optional)"
                fullWidth
                multiline
                minRows={3}
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Paste responsibilities from the job posting…"
                helperText="We reorder skills and bullets toward these responsibilities — we do not invent new jobs"
              />
            </Stack>
          </Box>

          <Box className="aa-card p-5">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography fontWeight={800}>Experience</Typography>
              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setForm({ ...form, experience: [...form.experience, emptyExp()] })}
              >
                Add
              </Button>
            </Stack>
            <Stack spacing={2} divider={<Divider />}>
              {form.experience.map((exp, idx) => (
                <Stack key={exp.id} spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700} fontSize={13}>
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
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      label="Title"
                      fullWidth
                      size="small"
                      value={exp.title}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experience: form.experience.map((x) =>
                            x.id === exp.id ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Company"
                      fullWidth
                      size="small"
                      value={exp.company}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experience: form.experience.map((x) =>
                            x.id === exp.id ? { ...x, company: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Location"
                      fullWidth
                      size="small"
                      value={exp.location || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experience: form.experience.map((x) =>
                            x.id === exp.id ? { ...x, location: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      label="Start"
                      fullWidth
                      size="small"
                      placeholder="Jan 2022"
                      value={exp.startDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experience: form.experience.map((x) =>
                            x.id === exp.id ? { ...x, startDate: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="End"
                      fullWidth
                      size="small"
                      placeholder="Present"
                      value={exp.endDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          experience: form.experience.map((x) =>
                            x.id === exp.id ? { ...x, endDate: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Stack>
                  <TextField
                    label="Impact bullets (one per line)"
                    multiline
                    minRows={2}
                    size="small"
                    value={exp.bullets.join('\n')}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        experience: form.experience.map((x) =>
                          x.id === exp.id ? { ...x, bullets: e.target.value.split('\n') } : x,
                        ),
                      })
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box className="aa-card p-5">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography fontWeight={800}>Education & extras</Typography>
              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setForm({ ...form, education: [...form.education, emptyEdu()] })}
              >
                Add school
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {form.education.map((ed) => (
                <Stack key={ed.id} spacing={1.25}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      label="Degree"
                      fullWidth
                      size="small"
                      value={ed.degree}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          education: form.education.map((x) =>
                            x.id === ed.id ? { ...x, degree: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Field"
                      fullWidth
                      size="small"
                      value={ed.field || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          education: form.education.map((x) =>
                            x.id === ed.id ? { ...x, field: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="School"
                      fullWidth
                      size="small"
                      value={ed.school}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          education: form.education.map((x) =>
                            x.id === ed.id ? { ...x, school: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="flex-end">
                    <IconButton
                      size="small"
                      disabled={form.education.length <= 1}
                      onClick={() =>
                        setForm({
                          ...form,
                          education: form.education.filter((x) => x.id !== ed.id),
                        })
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
              <TextField
                label="Certifications (one per line)"
                multiline
                minRows={2}
                size="small"
                value={certsText}
                onChange={(e) => setCertsText(e.target.value)}
              />
              <TextField
                label="Languages"
                size="small"
                value={langsText}
                onChange={(e) => setLangsText(e.target.value)}
              />
              <TextField
                label="Achievements (one per line)"
                multiline
                minRows={2}
                size="small"
                value={achievementsText}
                onChange={(e) => setAchievementsText(e.target.value)}
              />
            </Stack>
          </Box>

          <Box className="aa-card p-5">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography fontWeight={800}>Projects</Typography>
              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setForm({ ...form, projects: [...form.projects, emptyProject()] })}
              >
                Add
              </Button>
            </Stack>
            <Stack spacing={2} divider={<Divider />}>
              {form.projects.map((proj, idx) => (
                <Stack key={proj.id} spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700} fontSize={13}>
                      Project {idx + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={form.projects.length <= 1}
                      onClick={() =>
                        setForm({
                          ...form,
                          projects: form.projects.filter((p) => p.id !== proj.id),
                        })
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      label="Name"
                      fullWidth
                      size="small"
                      value={proj.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          projects: form.projects.map((p) =>
                            p.id === proj.id ? { ...p, name: e.target.value } : p,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Tech stack"
                      fullWidth
                      size="small"
                      value={proj.tech || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          projects: form.projects.map((p) =>
                            p.id === proj.id ? { ...p, tech: e.target.value } : p,
                          ),
                        })
                      }
                    />
                  </Stack>
                  <TextField
                    label="Description"
                    multiline
                    minRows={2}
                    size="small"
                    value={proj.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projects: form.projects.map((p) =>
                          p.id === proj.id ? { ...p, description: e.target.value } : p,
                        ),
                      })
                    }
                  />
                  <TextField
                    label="Bullets (one per line)"
                    multiline
                    minRows={2}
                    size="small"
                    value={(proj.bullets || []).join('\n')}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projects: form.projects.map((p) =>
                          p.id === proj.id ? { ...p, bullets: e.target.value.split('\n') } : p,
                        ),
                      })
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeRoundedIcon />}
            disabled={generating || uploading}
            onClick={() => void handleGenerateBestAts()}
            sx={{ py: 1.4, fontWeight: 800 }}
          >
            {generating
              ? 'Optimizing for ATS…'
              : targetJobTitle.trim()
                ? '3. Generate ATS resume for this job'
                : '3. Generate best ATS resume'}
          </Button>
        </Stack>

        {/* RIGHT: Preview + checklist */}
        <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
          <Box className="aa-card p-4">
            <Typography fontWeight={800} mb={1.25}>
              Studio checklist
            </Typography>
            <Stack spacing={0.75}>
              {checklist.map((c) => (
                <Stack key={c.label} direction="row" spacing={1} alignItems="center">
                  <CheckCircleOutlineRoundedIcon
                    sx={{ fontSize: 18, color: c.ok ? '#10b981' : 'text.disabled' }}
                  />
                  <Typography fontSize={13} color={c.ok ? 'text.primary' : 'text.secondary'}>
                    {c.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {tips.length > 0 && (
              <Box mt={2}>
                <Typography fontWeight={700} fontSize={13} mb={0.75}>
                  ATS tips
                </Typography>
                <Stack spacing={0.5}>
                  {tips.map((t) => (
                    <Typography key={t} fontSize={12.5} color="text.secondary">
                      • {t}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          <Box className="aa-card overflow-hidden">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              px={2}
              py={1.5}
              borderBottom="1px solid"
              borderColor="divider"
            >
              <Box>
                <Typography fontWeight={800}>Live preview</Typography>
                <Typography fontSize={12} color="text.secondary">
                  Template: {templateUsed}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  disabled={!previewHtml}
                  title="Download"
                  onClick={() =>
                    previewHtml &&
                    downloadHtml(
                      previewHtml,
                      `${(form.displayName || 'resume').toLowerCase().replace(/\s+/g, '-')}-ats.html`,
                    )
                  }
                >
                  <DownloadRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={!previewHtml}
                  title="Print / Save as PDF"
                  onClick={() => previewHtml && printHtml(previewHtml)}
                >
                  <PrintRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            {previewHtml ? (
              <Box
                component="iframe"
                title="Resume preview"
                srcDoc={previewHtml}
                sx={{
                  width: '100%',
                  minHeight: { xs: 520, lg: 720 },
                  border: 0,
                  bgcolor: '#f8fafc',
                }}
              />
            ) : (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary" fontSize={14}>
                  Upload a resume or fill your profile, then click{' '}
                  <strong>Generate best ATS resume</strong> to see the preview here.
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
