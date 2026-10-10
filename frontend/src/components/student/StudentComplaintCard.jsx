import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentComplaintCard({ complaintStats }) {
  const navigate = useNavigate();

  const {
    total = 0,
    pending = 0,
    resolved = 0,
  } = complaintStats || {};

  const statusLabel = pending > 0 ? `${pending} Pending` : 'All Resolved';
  const statusColor = pending > 0 ? '#D97706' : '#16A34A';
  const statusBg = pending > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(22, 163, 74, 0.1)';

  return (
    <Card
      onClick={() => navigate('/complaints')}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
          }}
        >
          <ClipboardList size={22} />
        </Box>
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            backgroundColor: statusBg,
            color: statusColor,
          }}
        />
      </Box>

      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
        MY COMPLAINTS
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
        {total} Total
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {pending} Pending • {resolved} Resolved
      </Typography>
    </Card>
  );
}
