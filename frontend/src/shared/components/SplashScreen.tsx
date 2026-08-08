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
            background: `radial-gradient(1000px 520px at 50% 15%, rgba(91,92,226,0.35), transparent 55%),
              radial-gradient(700px 400px at 85% 80%, rgba(236,72,153,0.18), transparent 50%),
              linear-gradient(160deg, #0b0c18 0%, #15172a 42%, #2a2d6b 130%)`,
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
                width: { xs: 76, sm: 88 },
                height: { xs: 76, sm: 88 },
                borderRadius: 4,
                mx: 'auto',
                mb: 2.75,
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(145deg, ${PRIMARY}, #8183f0)`,
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 24px 56px rgba(91,92,226,0.45)',
              }}
            >
              <SmartToyRoundedIcon sx={{ fontSize: { xs: 38, sm: 44 } }} />
            </Box>

            <Typography
              component={motion.h1}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12 }}
              fontWeight={900}
              sx={{ fontSize: { xs: 30, sm: 38 }, letterSpacing: '-0.045em' }}
            >
              ApplyAI
            </Typography>

            <Typography
              component={motion.p}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.22 }}
              sx={{ mt: 1, color: 'rgba(255,255,255,0.78)', fontSize: { xs: 14, sm: 15.5 } }}
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
                width: 104,
                borderRadius: 99,
                transformOrigin: 'left center',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.15), #fff, rgba(255,255,255,0.15))',
              }}
            />
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
}
