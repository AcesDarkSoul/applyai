import { create } from 'zustand';
import {
  billingRepository,
  type ApiSubscription,
  type BillingCatalog,
  type PlanId,
} from '@/lib/api/repositories';

interface SubscriptionState {
  hydrated: boolean;
  loading: boolean;
  active: boolean;
  subscription: ApiSubscription | null;
  planId: PlanId | null;
  dailyAutoApplyQuota: number;
  razorpayConfigured: boolean;
  billingEnforced: boolean;
  catalog: BillingCatalog | null;
  error: string | null;
  hydrate: () => Promise<void>;
  reset: () => void;
}

const initial = {
  hydrated: false,
  loading: false,
  active: false,
  subscription: null as ApiSubscription | null,
  planId: null as PlanId | null,
  dailyAutoApplyQuota: 8,
  razorpayConfigured: false,
  billingEnforced: true,
  catalog: null as BillingCatalog | null,
  error: null as string | null,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  ...initial,
  reset: () => set({ ...initial }),
  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const data = await billingRepository.subscription();
      set({
        hydrated: true,
        loading: false,
        active: data.active,
        subscription: data.subscription,
        planId: data.plan?.id ?? data.subscription?.planId ?? null,
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
          active: false,
          catalog,
          razorpayConfigured: catalog.razorpayConfigured,
          billingEnforced: catalog.billingEnforced,
          error: e instanceof Error ? e.message : 'Could not load subscription',
        });
      } catch (catalogErr) {
        set({
          hydrated: true,
          loading: false,
          active: false,
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
