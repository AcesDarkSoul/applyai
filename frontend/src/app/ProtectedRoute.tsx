import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { SplashScreen } from '../shared/components/SplashScreen';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const loading = useAuthStore((s) => s.loading);
  const hydrate = useAuthStore((s) => s.hydrate);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!token) return <Navigate to="/login" replace />;

  if (loading || !profile) {
    return <SplashScreen show caption="Loading your workspace…" />;
  }

  return <Outlet />;
}
