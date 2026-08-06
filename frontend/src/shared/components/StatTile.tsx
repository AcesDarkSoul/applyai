import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: number | string;
  delta?: string;
  accent: string;
  icon?: ReactNode;
  delay?: number;
}

export function StatTile({ label, value, delta, accent, icon, delay = 0 }: StatTileProps) {
  const positive = delta?.trim().startsWith('+') || delta?.trim().startsWith('↑');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
    >
      <Box className="aa-card p-4 h-full" sx={{ minHeight: 112 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography
            sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 13 }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: `${accent}18`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {value}
        </Typography>
        {delta && (
          <Typography
            sx={{
              mt: 0.75,
              fontSize: 12,
              fontWeight: 600,
              color: positive ? '#22c55e' : 'text.secondary',
            }}
          >
            {delta}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}
