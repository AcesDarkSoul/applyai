import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { profileRepository, complianceRepository } from '../../shared/api/repositories';
import type { AuditLogEntry, SmartApplyPlatformPrefs } from '../../shared/types';
import { useAuthStore } from '../auth/authStore';

const PRIMARY = '#5b5ce2';

const tools: Array<{
  title: string;
  body: string;
  scoreLabel?: string;
  cta: string;
  to: string;
  icon: ReactNode;
  accent: string;
}> = [
  {
    title: 'Resume Builder',
    body: 'Upload a file or build an advanced multi-section resume from your profile form.',
    scoreLabel: 'ATS Score',
    cta: 'Open Resume Studio',
    to: '/resume',
    icon: <DescriptionOutlinedIcon />,
    accent: PRIMARY,
  },
  {
    title: 'Cover Letter Studio',
    body: 'Generate a tailored cover letter from any job detail page — sent in background when HR email exists.',
    cta: 'Open Jobs',
    to: '/jobs',
    icon: <MailOutlineRoundedIcon />,
    accent: '#14b8a6',
  },
  {
    title: 'Background Auto Outreach',
    body: 'Emails HR from YOUR mailbox (SMTP) and WhatsApps from YOUR Business API — no apps opened.',
    cta: 'Find Jobs',
    to: '/jobs',
    icon: <BoltRoundedIcon />,
    accent: '#ec4899',
  },
];

export function AiToolsPage() {
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const ats = profile?.atsScore ?? 98;

  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [dailyAutoApplyEnabled, setDailyAutoApplyEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState('8');
  const [dailyMinScore, setDailyMinScore] = useState('55');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [saving, setSaving] = useState(false);
  const [runningDaily, setRunningDaily] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<SmartApplyPlatformPrefs>({
    linkedin: true,
    indeed: true,
    naukri: true,
    googlejobs: true,
    other: true,
  });
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [savingCompliance, setSavingCompliance] = useState(false);

  useEffect(() => {
    const o = profile?.outreach;
    if (!o) {
      setSmtpUser(profile?.email || '');
      setDailyAutoApplyEnabled(true);
      return;
    }
    setAutoSendEnabled(Boolean(o.autoSendEnabled));
    setDailyAutoApplyEnabled(o.dailyAutoApplyEnabled !== false);
    setDailyLimit(String(o.dailyAutoApplyLimit ?? 8));
    setDailyMinScore(String(o.dailyMinScore ?? 55));
    setSmtpHost(o.smtpHost || 'smtp.gmail.com');
    setSmtpPort(String(o.smtpPort || 587));
    setSmtpUser(o.smtpUser || profile?.email || '');
    setSmtpPass(o.smtpPass || '');
    setWaPhoneId(o.whatsappPhoneNumberId || '');
    setWaToken(o.whatsappAccessToken || '');
    setTwilioSid(o.twilioAccountSid || '');
    setTwilioToken(o.twilioAuthToken || '');
    setTwilioFrom(o.twilioWhatsappFrom || '');
  }, [profile]);

  useEffect(() => {
    void (async () => {
      try {
        const { automationRepository } = await import('../../shared/api/repositories');
        const s = await automationRepository.dailyStatus();
        setStatusText(
          s.enabled
            ? `Scheduler ON · ${s.cron} (${s.timezone})${
                s.lastFinishedAt ? ` · last run ${new Date(s.lastFinishedAt).toLocaleString()}` : ''
              }${s.running ? ' · running now…' : ''}`
            : 'Scheduler OFF in backend env (DAILY_AUTOMATION_ENABLED=false)',
        );
      } catch {
        setStatusText(null);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await complianceRepository.settings();
        setPlatforms(settings.smartApplyPlatforms);
        setConsentAt(settings.smartApplyConsentAt);
        setAudit(await complianceRepository.auditLog(25));
      } catch {
        // optional until backend is up
      }
    })();
  }, []);

  async function saveOutreach() {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await profileRepository.update({
        outreach: {
          autoSendEnabled,
          dailyAutoApplyEnabled,
          dailyAutoApplyLimit: Math.min(20, Math.max(1, Number(dailyLimit) || 8)),
          dailyMinScore: Math.min(100, Math.max(0, Number(dailyMinScore) || 55)),
          smtpHost: smtpHost.trim() || undefined,
          smtpPort: Number(smtpPort) || 587,
          smtpSecure: false,
          smtpUser: smtpUser.trim() || undefined,
          smtpPass: smtpPass || undefined,
          whatsappPhoneNumberId: waPhoneId.trim() || undefined,
          whatsappAccessToken: waToken.trim() || undefined,
          twilioAccountSid: twilioSid.trim() || undefined,
          twilioAuthToken: twilioToken.trim() || undefined,
          twilioWhatsappFrom: twilioFrom.trim() || undefined,
        },
      });
      await refreshProfile();
      setMsg(
        `Saved. Daily auto-apply ${dailyAutoApplyEnabled ? 'ON' : 'OFF'}; background email/WhatsApp ${
          autoSendEnabled ? 'ON' : 'OFF (dry-run)'
        }.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save outreach settings');
    } finally {
      setSaving(false);
    }
  }

  async function runDailyNow() {
    setRunningDaily(true);
    setError(null);
    setMsg(null);
    try {
      const { automationRepository } = await import('../../shared/api/repositories');
      const s = await automationRepository.runDailyNow();
      const applied = (s.lastUsers || []).reduce((n, u) => n + u.applied, 0);
      setMsg(
        `Daily run finished. Jobs fetched: ${s.lastFetch?.ingested ?? 0}. Auto-applied: ${applied}.`,
      );
      setStatusText(
        `Scheduler ${s.enabled ? 'ON' : 'OFF'} · last run ${
          s.lastFinishedAt ? new Date(s.lastFinishedAt).toLocaleString() : 'just now'
        }`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daily automation failed');
    } finally {
      setRunningDaily(false);
    }
  }
  return (
    <Stack spacing={3}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          className="aa-card aa-hero-mesh p-5 md:p-7"
          sx={{
            background:
              'linear-gradient(125deg, rgba(91,92,226,0.16), rgba(15,23,42,0.02) 50%, rgba(236,72,153,0.08))',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
            <AutoAwesomeRoundedIcon sx={{ color: PRIMARY }} />
            <Typography fontSize={12.5} fontWeight={700} color="text.secondary">
              Background outreach from your accounts
            </Typography>
          </Stack>
          <Typography fontWeight={900} fontSize={{ xs: 24, md: 30 }} letterSpacing="-0.03em">
            AI Tools
          </Typography>
          <Typography color="text.secondary" maxWidth={620} mt={0.75} fontSize={14.5}>
            Configure your mailbox and WhatsApp Business API so ApplyAI can message HR contacts in
            job posts automatically — without opening Gmail or WhatsApp on your device.
          </Typography>
        </Box>
      </motion.div>

      <Box className="aa-card p-5 md:p-6">
        <Typography fontWeight={900} fontSize={18} mb={0.5}>
          Smart Apply compliance (AD-002)
        </Typography>
        <Typography color="text.secondary" fontSize={13.5} mb={1.5} maxWidth={720}>
          Assistive only — ApplyAI prepares materials and tracks roles; it does not submit
          third-party application forms for you. Toggle platforms and review the audit log.
        </Typography>
        <Alert severity={consentAt ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 2.5 }}>
          {consentAt
            ? `Assistive-only consent recorded ${new Date(consentAt).toLocaleString()}`
            : 'Confirm assistive-only consent before batch Smart Apply / auto-apply.'}
        </Alert>
        <Button
          variant="outlined"
          disabled={savingCompliance}
          sx={{ mb: 2, fontWeight: 800, borderRadius: 2 }}
          onClick={async () => {
            setSavingCompliance(true);
            try {
              const res = await complianceRepository.confirmConsent();
              setConsentAt(res.smartApplyConsentAt || new Date().toISOString());
              setAudit(await complianceRepository.auditLog(25));
              setMsg('Assistive-only consent saved to audit log');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Consent failed');
            } finally {
              setSavingCompliance(false);
            }
          }}
        >
          Confirm assistive-only Smart Apply
        </Button>
        <Typography fontWeight={800} fontSize={14} mb={1}>
          Per-platform enable
        </Typography>
        <Stack spacing={0.25} mb={2}>
          {(
            [
              ['linkedin', 'LinkedIn'],
              ['indeed', 'Indeed'],
              ['naukri', 'Naukri'],
              ['googlejobs', 'Google Jobs'],
              ['other', 'Other boards'],
            ] as const
          ).map(([key, label]) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={platforms[key] !== false}
                  onChange={async (_, checked) => {
                    const next = { ...platforms, [key]: checked };
                    setPlatforms(next);
                    setSavingCompliance(true);
                    try {
                      await complianceRepository.updatePlatforms(next);
                      setAudit(await complianceRepository.auditLog(25));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Platform update failed');
                    } finally {
                      setSavingCompliance(false);
                    }
                  }}
                />
              }
              label={label}
            />
          ))}
        </Stack>
        <Typography fontWeight={800} fontSize={14} mb={1}>
          Audit log
        </Typography>
        {!audit.length && (
          <Typography color="text.secondary" fontSize={13}>
            No Smart Apply actions logged yet.
          </Typography>
        )}
        <Stack spacing={1} sx={{ maxHeight: 260, overflow: 'auto' }}>
          {audit.map((e) => (
            <Box key={e.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'rgba(91,92,226,0.06)' }}>
              <Typography fontWeight={700} fontSize={13}>
                {e.action} · {new Date(e.createdAt).toLocaleString()}
              </Typography>
              <Typography fontSize={12.5} color="text.secondary">
                {e.summary}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box className="aa-card p-5 md:p-6">
        <Typography fontWeight={900} fontSize={18} mb={0.5}>
          Daily job fetch + auto-apply
        </Typography>
        <Typography color="text.secondary" fontSize={13.5} mb={1.5} maxWidth={720}>
          Every day the API refreshes live jobs, then auto-applies to your best matches with an AI
          cover letter (and background email/WhatsApp when contacts + SMTP/WA are configured).
        </Typography>
        {statusText && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2.5 }}>
            {statusText}
          </Alert>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={dailyAutoApplyEnabled}
              onChange={(e) => setDailyAutoApplyEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography fontWeight={700} fontSize={14}>
              Include me in the daily auto-apply run
            </Typography>
          }
          sx={{ mb: 1.5, display: 'block' }}
        />
        <Box className="grid gap-2 md:grid-cols-2 mb-2">
          <TextField
            label="Daily apply limit"
            size="small"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
          />
          <TextField
            label="Min match score"
            size="small"
            value={dailyMinScore}
            onChange={(e) => setDailyMinScore(e.target.value)}
          />
        </Box>
        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" mb={1}>
          <Button variant="outlined" onClick={() => void saveOutreach()} disabled={saving}>
            Save daily settings
          </Button>
          <Button
            variant="contained"
            onClick={() => void runDailyNow()}
            disabled={runningDaily}
            startIcon={<BoltRoundedIcon />}
          >
            {runningDaily ? 'Running…' : 'Run daily job fetch + apply now'}
          </Button>
        </Stack>
      </Box>

      <Box className="aa-card p-5 md:p-6">
        <Typography fontWeight={900} fontSize={18} mb={0.5}>
          Auto email & WhatsApp (background)
        </Typography>
        <Typography color="text.secondary" fontSize={13.5} mb={2} maxWidth={720}>
          Emails are sent <strong>from your address</strong> via SMTP (Gmail App Password). WhatsApp
          uses <strong>your WhatsApp Business Cloud API / Twilio number</strong> — Meta does not
          allow silent sends from the personal WhatsApp phone app.
        </Typography>

        {msg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
            {msg}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={autoSendEnabled}
              onChange={(e) => setAutoSendEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography fontWeight={700} fontSize={14}>
              Enable auto-send in background (overrides dry-run)
            </Typography>
          }
          sx={{ mb: 2 }}
        />

        <Typography fontWeight={800} fontSize={14} mb={1.25} color="text.secondary">
          Your email (SMTP)
        </Typography>
        <Box className="grid gap-2 md:grid-cols-2 mb-3">
          <TextField
            label="SMTP host"
            size="small"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.gmail.com"
          />
          <TextField
            label="Port"
            size="small"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
          />
          <TextField
            label="Your email (From)"
            size="small"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="you@gmail.com"
          />
          <TextField
            label="App password"
            size="small"
            type="password"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            helperText="Gmail: Google Account → App passwords"
          />
        </Box>

        <Typography fontWeight={800} fontSize={14} mb={1.25} color="text.secondary">
          Your WhatsApp Business (Meta Cloud API)
        </Typography>
        <Box className="grid gap-2 md:grid-cols-2 mb-3">
          <TextField
            label="Phone number ID"
            size="small"
            value={waPhoneId}
            onChange={(e) => setWaPhoneId(e.target.value)}
          />
          <TextField
            label="Access token"
            size="small"
            type="password"
            value={waToken}
            onChange={(e) => setWaToken(e.target.value)}
          />
        </Box>

        <Typography fontWeight={800} fontSize={14} mb={1.25} color="text.secondary">
          Or Twilio WhatsApp (optional)
        </Typography>
        <Box className="grid gap-2 md:grid-cols-3 mb-3">
          <TextField
            label="Account SID"
            size="small"
            value={twilioSid}
            onChange={(e) => setTwilioSid(e.target.value)}
          />
          <TextField
            label="Auth token"
            size="small"
            type="password"
            value={twilioToken}
            onChange={(e) => setTwilioToken(e.target.value)}
          />
          <TextField
            label="From (whatsapp:+…)"
            size="small"
            value={twilioFrom}
            onChange={(e) => setTwilioFrom(e.target.value)}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => void saveOutreach()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save outreach settings'}
        </Button>
      </Box>

      <Box className="grid gap-3 md:grid-cols-3">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Box className="aa-card aa-card-interactive p-5 h-full flex flex-col">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  bgcolor: `${tool.accent}18`,
                  color: tool.accent,
                  display: 'grid',
                  placeItems: 'center',
                  mb: 2,
                  border: `1px solid ${tool.accent}28`,
                }}
              >
                {tool.icon}
              </Box>
              <Typography fontWeight={800} mb={0.5} fontSize={17}>
                {tool.title}
              </Typography>
              <Typography color="text.secondary" fontSize={13.5} mb={2} sx={{ flex: 1, lineHeight: 1.55 }}>
                {tool.body}
              </Typography>
              {tool.title === 'Resume Builder' && (
                <Box mb={2}>
                  <Stack direction="row" justifyContent="space-between" mb={0.75}>
                    <Typography fontSize={12} fontWeight={700} color="text.secondary">
                      {tool.scoreLabel}
                    </Typography>
                    <Typography fontSize={12} fontWeight={800} sx={{ color: PRIMARY }}>
                      {ats}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Number(ats) || 0)}
                    sx={{
                      height: 8,
                      borderRadius: 99,
                      bgcolor: 'rgba(91,92,226,0.12)',
                      '& .MuiLinearProgress-bar': { bgcolor: PRIMARY, borderRadius: 99 },
                    }}
                  />
                </Box>
              )}
              <Button
                component={RouterLink}
                to={tool.to}
                variant="contained"
                fullWidth
                startIcon={tool.title === 'Resume Builder' ? <DownloadRoundedIcon /> : undefined}
                endIcon={tool.title !== 'Resume Builder' ? <ArrowForwardRoundedIcon /> : undefined}
              >
                {tool.cta}
              </Button>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Stack>
  );
}
