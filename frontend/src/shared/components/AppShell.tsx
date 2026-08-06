import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { useThemeMode } from '../hooks/useThemeMode';
import { PageTransition } from './PageTransition';

const PRIMARY = '#5b5ce2';

const nav = [
  { to: '/', label: 'Dashboard', icon: <DashboardRoundedIcon />, match: (p: string) => p === '/' },
  {
    to: '/jobs',
    label: 'Find Jobs',
    icon: <WorkOutlineRoundedIcon />,
    match: (p: string) => p.startsWith('/jobs') || p === '/saved',
  },
  {
    to: '/applications',
    label: 'Applications',
    icon: <AssignmentOutlinedIcon />,
    match: (p: string) => p.startsWith('/applications'),
  },
  {
    to: '/ai-tools',
    label: 'AI Tools',
    icon: <AutoAwesomeRoundedIcon />,
    match: (p: string) => p.startsWith('/ai-tools'),
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: <InsightsRoundedIcon />,
    match: (p: string) => p.startsWith('/analytics'),
  },
];

const mobileNav = [
  { to: '/', label: 'Home', icon: <HomeRoundedIcon /> },
  { to: '/jobs', label: 'Jobs', icon: <WorkOutlineRoundedIcon /> },
  { to: '/applications', label: 'Apps', icon: <AssignmentOutlinedIcon /> },
  { to: '/ai-tools', label: 'AI Tools', icon: <AutoAwesomeRoundedIcon /> },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const { mode, toggle } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const pageTitle = useMemo(() => {
    const hit = nav.find((n) => n.match(location.pathname));
    return hit?.label || 'Dashboard';
  }, [location.pathname]);

  const drawer = (
    <Box
      className="h-full flex flex-col"
      sx={{
        width: 260,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: PRIMARY,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <SmartToyRoundedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
          ApplyAI
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {nav.map((item) => {
          const selected = item.match(location.pathname);
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setOpen(false)}
              className={selected ? 'aa-nav-active' : undefined}
              sx={{
                mb: 0.6,
                borderRadius: 2.5,
                py: 1.15,
                color: selected ? '#fff' : 'text.secondary',
                '&:hover': {
                  bgcolor: selected ? PRIMARY : 'rgba(91,92,226,0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: selected ? '#fff' : PRIMARY }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: 14.5 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            borderRadius: 3,
            p: 2,
            background: 'linear-gradient(160deg, #5b5ce2 0%, #7c7ef0 100%)',
            color: '#fff',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <SmartToyRoundedIcon sx={{ fontSize: 20 }} />
            <Typography fontWeight={700} fontSize={13}>
              AI Assistant
            </Typography>
          </Box>
          <Typography fontSize={12.5} sx={{ opacity: 0.92, mb: 1.5, lineHeight: 1.45 }}>
            I found new jobs that match your profile.
          </Typography>
          <Button
            fullWidth
            size="small"
            component={RouterLink}
            to="/jobs"
            onClick={() => setOpen(false)}
            sx={{
              bgcolor: '#fff',
              color: PRIMARY,
              fontWeight: 800,
              borderRadius: 2,
              '&:hover': { bgcolor: '#f0f1ff' },
            }}
          >
            View Jobs
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box className="min-h-screen flex" sx={{ bgcolor: 'background.default' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: 260,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 260,
              position: 'relative',
              border: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box className="flex-1 min-w-0 flex flex-col" sx={{ pb: isMobile ? '72px' : 0 }}>
        <Box
          sx={{
            px: { xs: 2, md: 3.5 },
            pt: { xs: 2, md: 2.5 },
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box className="flex-1 min-w-[180px]">
            <Typography variant="h4" className="aa-page-title" sx={{ fontSize: { xs: 26, md: 30 } }}>
              {pageTitle}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Welcome back, {profile?.displayName || 'there'}! Let&apos;s get you that dream job.
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search jobs, companies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && q.trim()) {
                navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
              }
            }}
            sx={{
              width: { xs: '100%', sm: 280 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 99,
                bgcolor: 'background.paper',
                boxShadow: 'var(--shadow-card)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={toggle} size="small" sx={{ bgcolor: 'background.paper' }}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
            <IconButton onClick={logout} size="small" sx={{ bgcolor: 'background.paper' }} title="Log out">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
            <Avatar
              component={RouterLink}
              to="/profile"
              sx={{
                width: 36,
                height: 36,
                bgcolor: PRIMARY,
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              {(profile?.displayName || 'A').slice(0, 1).toUpperCase()}
            </Avatar>
          </Box>
        </Box>

        <Box className="px-4 md:px-8 pb-8 flex-1 max-w-[1200px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </Box>
      </Box>

      <Drawer open={open} onClose={() => setOpen(false)}>
        {drawer}
      </Drawer>

      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-around',
            py: 0.75,
            px: 1,
            boxShadow: '0 -8px 24px rgba(91,92,226,0.08)',
          }}
        >
          {mobileNav.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <Box
                key={item.to}
                component={RouterLink}
                to={item.to}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.25,
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 2,
                  color: active ? PRIMARY : 'text.secondary',
                  minWidth: 64,
                }}
              >
                {item.icon}
                <Typography fontSize={11} fontWeight={active ? 800 : 600}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
