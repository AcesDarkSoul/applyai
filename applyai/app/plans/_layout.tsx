import { Slot } from 'expo-router';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function PlansLayout() {
  const active = useSubscriptionStore((s) => s.active);
  // While gated (no plan yet), hide back so users cannot skip the paywall.
  return (
    <>
      <AppTopBar
        title="Choose your plan"
        subtitle={active ? 'Manage billing' : 'Unlock ApplyAI to continue'}
        showBack={active}
      />
      <Slot />
    </>
  );
}
