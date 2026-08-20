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
  catalog: BillingCatalog | null;
  hydrate: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  hydrated: false,
  loading: false,
  active: false,
  subscription: null,
  planId: null,
  dailyAutoApplyQuota: 8,
  razorpayConfigured: false,
  catalog: null,
  hydrate: async () => {
    set({ loading: true });
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
        catalog: data.catalog,
      });
    } catch {
      try {
        const catalog = await billingRepository.catalog();
        set({
          hydrated: true,
          loading: false,
          catalog,
          razorpayConfigured: catalog.razorpayConfigured,
        });
      } catch {
        set({ hydrated: true, loading: false });
      }
    }
  },
}));
