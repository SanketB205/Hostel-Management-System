import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { Bell, Megaphone, AlertCircle, Info } from 'lucide-react';

export default function HostelUpdatesCard({ updates = [], dynamicNotices = [] }) {
  // Combine potential real backend updates with contextual system notices (like fee due or low attendance)
  const allNotices = [...updates, ...dynamicNotices];
  const hasUpdates = allNotices.length > 0;
  const latestNotice = hasUpdates ? allNotices[0] : null;

  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B5CF6',
          }}
        >
          <Megaphone size={22} />
        </Box>
        <Chip
          label={hasUpdates ? `${allNotices.length} New` : 'Notice Board'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            backgroundColor: hasUpdates ? 'rgba(139, 92, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
            color: hasUpdates ? '#8B5CF6' : '#64748B',
          }}
        />
      </Box>

      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
        HOSTEL UPDATES
      </Typography>

      {hasUpdates && latestNotice ? (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: '1.05rem', lineHeight: 1.3 }}>
            {latestNotice.title || 'Notice'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {latestNotice.description || latestNotice.subtitle || latestNotice.message || 'Hostel announcement'}
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
            All Caught Up
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            No new hostel updates
          </Typography>
        </>
      )}
    </Card>
  );
}
