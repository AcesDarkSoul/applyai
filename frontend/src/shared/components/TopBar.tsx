import {
  Avatar,
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Popper,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const PRIMARY = '#5b5ce2';

export type TopBarProps = {
  title: string;
  hint: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenNav?: () => void;
  showMenuButton?: boolean;
  displayName?: string;
};

export function TopBar({
  title,
  hint,
  isDark,
  onToggleTheme,
  onLogout,
  onOpenNav,
  showMenuButton = false,
  displayName = 'A',
}: TopBarProps) {
  const navigate = useNavigate();
  const isCompact = useMediaQuery('(max-width:900px)');
  const isNarrow = useMediaQuery('(max-width:600px)');
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement | null>(null);

  function submitSearch() {
    if (!q.trim()) return;
    navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
  }

  const searchField = (
    <TextField
      size="small"
      fullWidth
      autoFocus={isNarrow && searchOpen}
      placeholder="Search jobs, companies…"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submitSearch();
        if (e.key === 'Escape') setSearchOpen(false);
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 99,
          bgcolor: 'background.paper',
          height: 42,
          boxShadow: '0 2px 12px rgba(91,92,226,0.08)',
          transition: 'box-shadow 0.2s ease',
          '&:hover, &.Mui-focused': {
            boxShadow: '0 4px 18px rgba(91,92,226,0.16)',
          },
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ color: PRIMARY, fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: isNarrow ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        px: { xs: 1.25, sm: 2, md: 3 },
        pt: { xs: 'max(10px, env(safe-area-inset-top, 0px))', md: 1.5 },
        pb: { xs: 1.15, md: 1.5 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5, md: 2 },
          minHeight: { xs: 54, md: 64 },
          px: { xs: 1.15, sm: 1.75, md: 2.25 },
          py: { xs: 0.7, md: 1 },
          borderRadius: { xs: 3.25, md: 4 },
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(21,23,42,0.86)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(18px) saturate(1.2)',
          boxShadow: isDark
            ? '0 10px 32px rgba(0,0,0,0.28)'
            : '0 10px 28px rgba(91,92,226,0.1)',
        }}
      >
        {showMenuButton && (
          <IconButton
            onClick={onOpenNav}
            size="small"
            aria-label="Open navigation"
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'rgba(91,92,226,0.1)',
              color: PRIMARY,
              flexShrink: 0,
              '&:hover': { bgcolor: 'rgba(91,92,226,0.16)' },
            }}
          >
            <MenuRoundedIcon fontSize="small" />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            className="aa-page-title"
            noWrap
            sx={{
              fontSize: { xs: 17, sm: 20, md: 22 },
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {!isNarrow && (
            <Typography
              color="text.secondary"
              noWrap
              sx={{ fontSize: { sm: 12.5, md: 13.5 }, mt: 0.15, fontWeight: 600 }}
            >
              {hint}
            </Typography>
          )}
        </Box>

        {!isNarrow && (
          <Box sx={{ width: { sm: 200, md: 280, lg: 320 }, flexShrink: 1 }}>{searchField}</Box>
        )}

        <Box display="flex" alignItems="center" gap={0.75} flexShrink={0}>
          {isNarrow && (
            <IconButton
              onClick={() => setSearchOpen((v) => !v)}
              size="small"
              aria-label="Search"
              sx={{
                width: 40,
                height: 40,
                bgcolor: searchOpen ? PRIMARY : 'background.paper',
                color: searchOpen ? '#fff' : 'text.secondary',
                border: '1px solid',
                borderColor: searchOpen ? PRIMARY : 'divider',
                '&:hover': {
                  bgcolor: searchOpen ? PRIMARY : 'rgba(91,92,226,0.08)',
                },
              }}
            >
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          )}

          {!isCompact && (
            <IconButton
              onClick={onToggleTheme}
              size="small"
              aria-label="Toggle theme"
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          )}

          <IconButton
            ref={avatarRef}
            onClick={() => setMenuOpen((v) => !v)}
            size="small"
            aria-label="Account menu"
            sx={{ p: 0.25 }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 6px 16px rgba(91,92,226,0.3)',
              }}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      <AnimatePresence>
        {isNarrow && searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Box sx={{ mt: 1.25 }}>{searchField}</Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Popper
        open={menuOpen}
        anchorEl={avatarRef.current}
        placement="bottom-end"
        sx={{ zIndex: 40 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
      >
        <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
          <Paper
            elevation={0}
            sx={{
              minWidth: 200,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(91,92,226,0.18)',
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography fontWeight={800} fontSize={14} noWrap>
                {displayName || 'Account'}
              </Typography>
              <Typography color="text.secondary" fontSize={12}>
                Manage your workspace
              </Typography>
            </Box>
            <MenuItem
              component={RouterLink}
              to="/resume"
              onClick={() => setMenuOpen(false)}
              sx={{ py: 1.25, gap: 1.25, fontWeight: 650 }}
            >
              <PersonOutlineRoundedIcon fontSize="small" sx={{ color: PRIMARY }} />
              Resume Studio
            </MenuItem>
            {isCompact && (
              <MenuItem
                onClick={() => {
                  onToggleTheme();
                  setMenuOpen(false);
                }}
                sx={{ py: 1.25, gap: 1.25, fontWeight: 650 }}
              >
                {isDark ? (
                  <LightModeIcon fontSize="small" sx={{ color: PRIMARY }} />
                ) : (
                  <DarkModeIcon fontSize="small" sx={{ color: PRIMARY }} />
                )}
                {isDark ? 'Light mode' : 'Dark mode'}
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              sx={{ py: 1.25, gap: 1.25, fontWeight: 650, color: 'error.main' }}
            >
              <LogoutRoundedIcon fontSize="small" />
              Log out
            </MenuItem>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
