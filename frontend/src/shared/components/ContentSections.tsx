import { Box, Stack, Typography } from '@mui/material';
import type { ContentSection } from '../lib/contentParse';

const PRIMARY = '#5b5ce2';

export function ContentSections({ sections }: { sections: ContentSection[] }) {
  if (!sections.length) {
    return (
      <Typography color="text.secondary" fontSize={14}>
        No detailed content available for this listing.
      </Typography>
    );
  }

  return (
    <Stack spacing={2.5}>
      {sections.map((section) => (
        <Box key={`${section.heading}-${section.content.slice(0, 24)}`}>
          <Typography
            fontWeight={800}
            fontSize={15}
            sx={{
              mb: 1,
              color: PRIMARY,
              letterSpacing: '-0.01em',
            }}
          >
            {section.heading}
          </Typography>
          <Typography
            whiteSpace="pre-wrap"
            color="text.secondary"
            fontSize={14.5}
            lineHeight={1.75}
            sx={{
              bgcolor: 'rgba(91,92,226,0.03)',
              borderRadius: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {section.content}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
