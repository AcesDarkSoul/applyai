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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Box
        className="aa-card aa-card-interactive p-4 h-full"
        sx={{
          minHeight: 120,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: -20,
            top: -20,
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 13 }}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: `${accent}18`,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${accent}28`,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: 30, letterSpacing: '-0.035em', lineHeight: 1.1 }}>
          {value}
        </Typography>
        {delta && (
          <Typography
            sx={{
              mt: 0.85,
              fontSize: 12,
              fontWeight: 700,
              color: positive ? '#16a34a' : 'text.secondary',
            }}
          >
            {delta}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}
