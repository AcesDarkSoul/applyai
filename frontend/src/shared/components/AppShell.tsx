import {
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { useThemeMode } from '../hooks/useThemeMode';
import { PageTransition } from './PageTransition';
import { TopBar } from './TopBar';

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
    to: '/resume',
    label: 'Resume Studio',
    icon: <DescriptionOutlinedIcon />,
    match: (p: string) => p.startsWith('/resume') || p.startsWith('/profile'),
  },
  {
    to: '/posts',
    label: 'Hiring Posts',
    icon: <ArticleOutlinedIcon />,
    match: (p: string) => p.startsWith('/posts'),
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
  { to: '/resume', label: 'Resume', icon: <DescriptionOutlinedIcon /> },
  { to: '/applications', label: 'Apps', icon: <AssignmentOutlinedIcon /> },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const { mode, toggle } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const hit = nav.find((n) => n.match(location.pathname));
    return hit?.label || 'Dashboard';
  }, [location.pathname]);

  const pageHint = useMemo(() => {
    if (location.pathname.startsWith('/jobs')) return 'Roles ranked to your resume';
    if (location.pathname.startsWith('/resume')) return 'Build, parse, and polish your CV';
    if (location.pathname.startsWith('/posts')) return 'Full hiring posts with contacts';
    if (location.pathname.startsWith('/applications')) return 'Track every outreach';
    if (location.pathname.startsWith('/ai-tools')) return 'Assistants that keep you in control';
    if (location.pathname.startsWith('/analytics')) return 'See what is converting';
    return `Welcome back, ${profile?.displayName || 'there'}`;
  }, [location.pathname, profile?.displayName]);

  const drawer = (
    <Box
      className="h-full flex flex-col"
      sx={{
        width: 268,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundImage:
          mode === 'dark'
            ? 'linear-gradient(180deg, rgba(91,92,226,0.08) 0%, transparent 28%)'
            : 'linear-gradient(180deg, rgba(91,92,226,0.06) 0%, transparent 32%)',
      }}
    >
      <Box className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <Box
          component={motion.div}
          whileHover={{ rotate: -6, scale: 1.04 }}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            boxShadow: '0 10px 24px rgba(91,92,226,0.35)',
          }}
        >
          <SmartToyRoundedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            ApplyAI
          </Typography>
          <Typography fontSize={11} fontWeight={700} color="text.secondary" letterSpacing="0.04em">
            JOB WORKSPACE
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 2, flex: 1 }} className="aa-scroll-thin">
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
                mb: 0.55,
                borderRadius: 2.5,
                py: 1.1,
                color: selected ? '#fff' : 'text.secondary',
                transition: 'transform 0.18s ease, background 0.18s ease',
                '&:hover': {
                  bgcolor: selected ? PRIMARY : 'rgba(91,92,226,0.08)',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: selected ? '#fff' : PRIMARY }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 800 : 650, fontSize: 14.5 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, pb: 2.5 }}>
        <Box
          sx={{
            borderRadius: 3.5,
            p: 2.25,
            background: 'linear-gradient(155deg, #5b5ce2 0%, #6d6ff0 55%, #8b5cf6 120%)',
            color: '#fff',
            boxShadow: '0 16px 32px rgba(91,92,226,0.28)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: -24,
              bottom: -28,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.12)',
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1} position="relative" zIndex={1}>
            <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
            <Typography fontWeight={800} fontSize={13.5}>
              Match boost
            </Typography>
          </Box>
          <Typography
            fontSize={12.5}
            sx={{ opacity: 0.94, mb: 1.75, lineHeight: 1.5, position: 'relative', zIndex: 1 }}
          >
            Fresh roles lined up from your resume skills and title.
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
              position: 'relative',
              zIndex: 1,
              '&:hover': { bgcolor: '#f0f1ff' },
            }}
          >
            Browse matches
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box className="min-h-screen flex" sx={{ bgcolor: 'transparent' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: 268,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 268,
              position: 'relative',
              border: 'none',
              boxShadow: 'none',
              bgcolor: 'transparent',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        className="flex-1 min-w-0 flex flex-col"
        sx={{ pb: isMobile ? 'calc(84px + env(safe-area-inset-bottom, 0px))' : 0 }}
      >
        <TopBar
          title={pageTitle}
          hint={pageHint}
          isDark={mode === 'dark'}
          onToggleTheme={toggle}
          onLogout={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          showMenuButton={isMobile}
          onOpenNav={() => setOpen(true)}
          displayName={profile?.displayName || 'A'}
        />

        <Box
          className="flex-1 w-full mx-auto"
          sx={{
            px: { xs: 1.75, sm: 2.5, md: 3.5, lg: 4 },
            pb: { xs: 3, md: 4 },
            pt: { xs: 1, md: 1.5 },
            maxWidth: 1200,
          }}
        >
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </Box>
      </Box>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: { xs: '0 20px 20px 0', sm: 0 },
          },
        }}
      >
        {drawer}
      </Drawer>

      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            zIndex: 1200,
            bgcolor: mode === 'dark' ? 'rgba(21,23,42,0.94)' : 'rgba(255,255,255,0.94)',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            py: 0.65,
            px: 0.5,
            borderRadius: 4.5,
            boxShadow: mode === 'dark'
              ? '0 14px 40px rgba(0,0,0,0.4)'
              : '0 14px 40px rgba(91,92,226,0.18)',
            backdropFilter: 'blur(18px) saturate(1.15)',
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
                  gap: 0.35,
                  py: 0.75,
                  px: 1.5,
                  borderRadius: 3,
                  color: active ? PRIMARY : 'text.secondary',
                  bgcolor: active ? 'rgba(91,92,226,0.12)' : 'transparent',
                  minWidth: 64,
                  minHeight: 52,
                  justifyContent: 'center',
                  transition: 'background 0.18s ease, transform 0.18s ease, color 0.18s ease',
                  transform: active ? 'translateY(-2px)' : 'none',
                  position: 'relative',
                  '&::after': active
                    ? {
                        content: '""',
                        position: 'absolute',
                        top: 6,
                        width: 18,
                        height: 3,
                        borderRadius: 99,
                        bgcolor: PRIMARY,
                      }
                    : undefined,
                }}
              >
                {item.icon}
                <Typography fontSize={11} fontWeight={active ? 800 : 600} letterSpacing="-0.01em">
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
