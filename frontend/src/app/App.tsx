import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { ApplicationsPage } from '../features/applications/ApplicationsPage';
import { AiToolsPage } from '../features/ai/AiToolsPage';
import { AnalyticsPage } from '../features/ai/AnalyticsPage';
import { JobDetailPage } from '../features/jobs/JobDetailPage';
import { JobsPage } from '../features/jobs/JobsPage';
import { SavedJobsPage } from '../features/jobs/SavedJobsPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AppShell } from '../shared/components/AppShell';
import { useThemeMode } from '../shared/hooks/useThemeMode';
import { buildTheme } from '../shared/theme/theme';
import { ProtectedRoute } from './ProtectedRoute';

export default function App() {
  const mode = useThemeMode((s) => s.mode);
  const theme = buildTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:id" element={<JobDetailPage />} />
              <Route path="saved" element={<SavedJobsPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="ai-tools" element={<AiToolsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
