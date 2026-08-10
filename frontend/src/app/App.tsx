import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { ApplicationsPage } from '../features/applications/ApplicationsPage';
import { AiToolsPage } from '../features/ai/AiToolsPage';
import { AnalyticsPage } from '../features/ai/AnalyticsPage';
import { JobDetailPage } from '../features/jobs/JobDetailPage';
import { JobsPage } from '../features/jobs/JobsPage';
import { SavedJobsPage } from '../features/jobs/SavedJobsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { PostDetailPage } from '../features/posts/PostDetailPage';
import { PostsPage } from '../features/posts/PostsPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ResumeStudioPage } from '../features/profile/ResumeStudioPage';
import { AppShell } from '../shared/components/AppShell';
import { SplashScreen } from '../shared/components/SplashScreen';
import { trackScreen } from '../shared/firebase/analytics';
import { useThemeMode } from '../shared/hooks/useThemeMode';
import { buildTheme } from '../shared/theme/theme';
import { ProtectedRoute } from './ProtectedRoute';

const SPLASH_MS = 1800;

function AnalyticsScreenTracker() {
  const location = useLocation();
  useEffect(() => {
    void trackScreen(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  const mode = useThemeMode((s) => s.mode);
  const theme = buildTheme(mode);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduced ? 400 : SPLASH_MS;
    const t = window.setTimeout(() => setShowSplash(false), ms);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SplashScreen show={showSplash} />
      {!showSplash && (
        <BrowserRouter>
          <AnalyticsScreenTracker />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="posts/:id" element={<PostDetailPage />} />
                <Route path="saved" element={<SavedJobsPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="ai-tools" element={<AiToolsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="resume" element={<ResumeStudioPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}
