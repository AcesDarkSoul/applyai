import { Box, Typography } from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { AnimatePresence, motion } from 'framer-motion';

const PRIMARY = '#5b5ce2';

type SplashScreenProps = {
  show: boolean;
  /** Optional subtitle under the brand */
  caption?: string;
};

export function SplashScreen({ show, caption = 'Find. Match. Tailor. Apply.' }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {show ? (
        <Box
          component={motion.div}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            background: `radial-gradient(1200px 600px at 50% 20%, rgba(91,92,226,0.28), transparent 55%),
              linear-gradient(160deg, #0f1020 0%, #1a1b3a 45%, #5b5ce2 140%)`,
            color: '#fff',
            px: 3,
          }}
        >
          <Box textAlign="center">
            <Box
              component={motion.div}
              initial={{ scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              sx={{
                width: { xs: 72, sm: 84 },
                height: { xs: 72, sm: 84 },
                borderRadius: 3.5,
                mx: 'auto',
                mb: 2.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              }}
            >
              <SmartToyRoundedIcon sx={{ fontSize: { xs: 36, sm: 42 } }} />
            </Box>

            <Typography
              component={motion.h1}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12 }}
              fontWeight={800}
              sx={{ fontSize: { xs: 28, sm: 34 }, letterSpacing: '-0.04em' }}
            >
              ApplyAI
            </Typography>

            <Typography
              component={motion.p}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.22 }}
              sx={{ mt: 1, color: 'rgba(255,255,255,0.78)', fontSize: { xs: 14, sm: 15 } }}
            >
              {caption}
            </Typography>

            <Box
              component={motion.div}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.9, ease: 'easeInOut' }}
              sx={{
                mt: 3.5,
                mx: 'auto',
                height: 3,
                width: 96,
                borderRadius: 99,
                transformOrigin: 'left center',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2), #fff, rgba(255,255,255,0.2))',
              }}
            />
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
}
