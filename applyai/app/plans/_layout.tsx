import { Slot } from 'expo-router';
import { AppTopBar } from '@/components/layout/AppTopBar';

export default function PlansLayout() {
  return (
    <>
      <AppTopBar title="Plans" subtitle="Unlock ApplyAI" showBack />
      <Slot />
    </>
  );
}

