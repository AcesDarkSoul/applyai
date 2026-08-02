import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: number | string;
  accent: string;
  icon?: ReactNode;
  delay?: number;
}

export function StatTile({ label, value, accent, icon, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03 }}
    >
      <Box
        className="aa-surface rounded-3xl p-5 h-full relative overflow-hidden"
        sx={{ minHeight: 132 }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            right: -24,
            top: -24,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}33, transparent 70%)`,
          }}
        />
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontWeight: 700 }}
          >
            {label}
          </Typography>
          <Box sx={{ color: accent, opacity: 0.9 }}>{icon}</Box>
        </Box>
        <Typography variant="h3" sx={{ color: accent, fontWeight: 700 }}>
          {value}
        </Typography>
      </Box>
    </motion.div>
  );
}
