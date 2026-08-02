import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';

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
    return (
      <Box className="min-h-screen grid place-items-center">
        <CircularProgress />
      </Box>
    );
  }

  return <Outlet />;
}
