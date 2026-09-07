import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useEffect, useState } from 'react';
import { billingRepository, type PlanId } from '../../shared/api/repositories';

const ACCENT: Record<PlanId, string> = {
  starter: '#5b5ce2',
  pro: '#7c3aed',
  elite: '#0f766e',
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(script);
  });
}

export function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof billingRepository.catalog>> | null>(
    null,
  );
  const [sub, setSub] = useState<Awaited<ReturnType<typeof billingRepository.subscription>> | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([billingRepository.catalog(), billingRepository.subscription()]);
      setCatalog(c);
      setSub(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load plans');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function pay(planId: PlanId) {
    setBusy(planId);
    setError(null);
    try {
      if (!catalog?.razorpayConfigured && catalog?.demoActivateEnabled) {
        await billingRepository.demoActivate(planId);
        await refresh();
        return;
      }
      const order = await billingRepository.createOrder(planId);
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Razorpay checkout failed to load');
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'ApplyAI',
          description: `ApplyAI ${planId}`,
          theme: { color: '#5b5ce2' },
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            void billingRepository
              .verify({ planId, ...response })
              .then(() => resolve())
              .catch(reject);
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" sx={{ color: '#5b5ce2', fontWeight: 800 }}>
          ApplyAI membership
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          Choose a package
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
          Starter unlocks jobs, posts, and 8 auto-applies a day. Pro and Elite add AI letters, outreach, and
          higher daily quotas.
        </Typography>
        {sub?.active && sub.plan ? (
          <Chip
            sx={{ mt: 1.5, fontWeight: 800 }}
            color="success"
            label={`Current: ${sub.plan.name} · ${sub.dailyAutoApplyQuota} auto-apply / day`}
          />
        ) : null}
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {(catalog?.plans || []).map((plan) => {
          const current = sub?.plan?.id === plan.id && sub.active;
          return (
            <Paper
              key={plan.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: plan.popular ? '2px solid #7c3aed' : '1px solid',
                borderColor: plan.popular ? '#7c3aed' : 'divider',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 480,
              }}
            >
              {plan.popular ? (
                <Chip size="small" label="Most popular" sx={{ alignSelf: 'flex-start', mb: 1, fontWeight: 800 }} />
              ) : null}
              <Typography variant="h5" sx={{ fontWeight: 800, color: ACCENT[plan.id] }}>
                {plan.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {plan.tagline}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                ₹{plan.priceInr.toLocaleString('en-IN')}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {plan.periodLabel} · {plan.dailyAutoApplyQuota} auto-apply / day
              </Typography>
              <Stack spacing={1} sx={{ flex: 1, mb: 2 }}>
                {plan.includes.map((item) => (
                  <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleRoundedIcon sx={{ fontSize: 18, mt: 0.3, color: ACCENT[plan.id] }} />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                variant={plan.popular ? 'contained' : 'outlined'}
                disabled={Boolean(busy) || current}
                onClick={() => void pay(plan.id)}
                sx={{ fontWeight: 800, py: 1.2, borderRadius: 2 }}
              >
                {busy === plan.id
                  ? 'Working…'
                  : current
                    ? 'Current plan'
                    : catalog?.razorpayConfigured
                      ? `Pay ₹${plan.priceInr.toLocaleString('en-IN')}`
                      : `Activate ${plan.name} (demo)`}
              </Button>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}
