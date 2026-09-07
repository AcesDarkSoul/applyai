import { PLANS } from '@/constants/plans';
import {
    billingRepository,
    type ApiSubscription,
    type BillingCatalog,
    type PlanId,
} from '@/lib/api/repositories';
import { planIdFromFlags } from '@/lib/firebase/appSettings';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { create } from 'zustand';

interface SubscriptionState {
  hydrated: boolean;
  loading: boolean;
  active: boolean;
  subscription: ApiSubscription | null;
  planId: PlanId | null;
  plans: { starter: boolean; pro: boolean; elite: boolean };
  dailyAutoApplyQuota: number;
  razorpayConfigured: boolean;
  billingEnforced: boolean;
  catalog: BillingCatalog | null;
  error: string | null;
  hydrate: () => Promise<void>;
  watchUserPlans: (userKey: string | null) => void;
  reset: () => void;
}

const initialPlans = { starter: false, pro: false, elite: false };

const initial = {
  hydrated: false,
  loading: false,
  active: false,
  subscription: null as ApiSubscription | null,
  planId: null as PlanId | null,
  plans: { ...initialPlans },
  dailyAutoApplyQuota: 8,
  razorpayConfigured: false,
  billingEnforced: true,
  catalog: null as BillingCatalog | null,
  error: null as string | null,
};

let plansUnsub: Unsubscribe | null = null;

function applyFlagUnlock(
  set: (partial: Partial<SubscriptionState>) => void,
  get: () => SubscriptionState,
  flags: { starter?: boolean; pro?: boolean; elite?: boolean } | undefined,
) {
  const planId = planIdFromFlags(flags);
  const nextPlans = {
    starter: Boolean(flags?.starter),
    pro: Boolean(flags?.pro),
    elite: Boolean(flags?.elite),
  };

  if (!planId) {
    const sub = get().subscription;
    const subActive = sub?.status === 'active' || sub?.status === 'past_due';
    set({
      plans: nextPlans,
      ...(subActive
        ? {}
        : {
            active: false,
            planId: null,
          }),
    });
    return;
  }

  const current = get();
  set({
    active: true,
    planId,
    plans: nextPlans,
    dailyAutoApplyQuota: PLANS[planId].dailyAutoApplyQuota || current.dailyAutoApplyQuota,
  });
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initial,
  reset: () => {
    plansUnsub?.();
    plansUnsub = null;
    set({ ...initial, plans: { ...initialPlans } });
  },
  watchUserPlans: (userKey) => {
    plansUnsub?.();
    plansUnsub = null;
    if (!userKey) return;

    // Prefer email doc id; callers should pass email when available.
    plansUnsub = onSnapshot(
      doc(db, 'users', userKey.includes('@') ? userKey.trim().toLowerCase() : userKey),
      (snap) => {
        if (!snap.exists()) return;
        applyFlagUnlock(set, get, snap.data()?.plans);
      },
      (err) => {
        console.warn('watchUserPlans failed:', err);
      },
    );
  },
  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const data = await billingRepository.subscription();
      const flagPlanId = planIdFromFlags(data.plans);
      set({
        hydrated: true,
        loading: false,
        active: data.active || Boolean(flagPlanId),
        subscription: data.subscription,
        planId: data.plan?.id ?? data.subscription?.planId ?? flagPlanId ?? null,
        plans: {
          starter: Boolean(data.plans?.starter),
          pro: Boolean(data.plans?.pro),
          elite: Boolean(data.plans?.elite),
        },
        dailyAutoApplyQuota: data.dailyAutoApplyQuota || 8,
        razorpayConfigured: data.razorpayConfigured,
        billingEnforced: data.catalog?.billingEnforced ?? true,
        catalog: data.catalog,
        error: null,
      });
    } catch (e) {
      try {
        const catalog = await billingRepository.catalog();
        set({
          hydrated: true,
          loading: false,
          active: get().active,
          catalog,
          razorpayConfigured: catalog.razorpayConfigured,
          billingEnforced: catalog.billingEnforced,
          error: e instanceof Error ? e.message : 'Could not load subscription',
        });
      } catch (catalogErr) {
        set({
          hydrated: true,
          loading: false,
          active: get().active,
          error:
            catalogErr instanceof Error
              ? catalogErr.message
              : e instanceof Error
                ? e.message
                : 'Could not reach billing API',
        });
      }
    }
  },
}));
