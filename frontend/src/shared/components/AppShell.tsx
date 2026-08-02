import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { useThemeMode } from '../hooks/useThemeMode';
import { PageTransition } from './PageTransition';

const nav = [
  { to: '/', label: 'Overview', icon: <DashboardIcon />, color: '#0f8f68' },
  { to: '/jobs', label: "Today's Jobs", icon: <WorkIcon />, color: '#2aa8c4' },
  { to: '/saved', label: 'Saved', icon: <BookmarkIcon />, color: '#f0b429' },
  { to: '/applications', label: 'Applications', icon: <AssignmentIcon />, color: '#e85d4c' },
  { to: '/profile', label: 'Profile', icon: <PersonIcon />, color: '#e85d4c' },
];

export function AppShell() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const profile = useAuthStore((s) => s.profile);
  const { mode, toggle } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);

  const drawer = (
    <Box
      className="h-full p-3 flex flex-col"
      sx={{
        width: 272,
        background: mode === 'dark'
          ? 'linear-gradient(180deg, #0f2420, #102820)'
          : 'linear-gradient(180deg, #ffffff, #f3fbf7)',
      }}
    >
      <Box className="px-2 py-4 mb-2">
        <Typography
          variant="h4"
          className="aa-shimmer-text"
          sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}
        >
          ApplyAI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI Job Agent
        </Typography>
      </Box>
      <List sx={{ flex: 1 }}>
        {nav.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setOpen(false)}
              className={selected ? 'aa-nav-active' : undefined}
              sx={{
                mb: 0.8,
                borderRadius: 2.5,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateX(4px)' },
              }}
            >
              <ListItemIcon sx={{ color: item.color, minWidth: 42 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 800 : 600 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box className="aa-surface rounded-2xl p-3 m-1">
        <StackRow profileName={profile?.displayName || 'Candidate'} email={profile?.email} />
      </Box>
    </Box>
  );

  return (
    <Box className="min-h-screen flex">
      {!isMobile && (
        <Drawer
          variant="permanent"
          open
          sx={{
            [`& .MuiDrawer-paper`]: {
              position: 'relative',
              border: 'none',
              boxShadow: 'var(--shadow-soft)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
      <Box className="flex-1 min-w-0">
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--surface-border)',
          }}
        >
          <Toolbar className="gap-2">
            {isMobile && (
              <IconButton onClick={() => setOpen(true)} edge="start">
                <MenuIcon />
              </IconButton>
            )}
            <Box className="flex-1">
              <Typography variant="h6" sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
                {profile?.displayName ? `Hey, ${profile.displayName}` : 'AI Job Agent'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Find roles · Match smart · Apply safely
              </Typography>
            </Box>
            <IconButton onClick={toggle} aria-label="Toggle theme" className="aa-surface">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <Button
              onClick={logout}
              variant="outlined"
              size="small"
              startIcon={<LogoutRoundedIcon />}
              sx={{ borderWidth: 2 }}
            >
              Log out
            </Button>
          </Toolbar>
        </AppBar>
        <Box className="p-4 md:p-8 max-w-6xl mx-auto">
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
    </Box>
  );
}

function StackRow({ profileName, email }: { profileName: string; email?: string }) {
  return (
    <Box display="flex" gap={1.5} alignItems="center">
      <Avatar
        sx={{
          bgcolor: '#0f8f68',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #0f8f68, #2aa8c4)',
        }}
      >
        {profileName.slice(0, 1).toUpperCase()}
      </Avatar>
      <Box overflow="hidden">
        <Typography fontWeight={700} noWrap>
          {profileName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {email || 'demo user'}
        </Typography>
      </Box>
    </Box>
  );
}
