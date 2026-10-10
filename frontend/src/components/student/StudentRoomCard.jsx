import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { Bed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentRoomCard({ allocation, onClick }) {
  const room = allocation?.room;
  const block = room?.floor?.block;
  
  const roomNumber = room?.number || 'Not Allocated';
  const blockName = block?.name ? `Block ${block.name}` : (room ? 'Block —' : '—');
  const bedInfo = allocation?.bedNumber ? `Bed ${allocation.bedNumber}` : (room ? 'Standard Bed' : 'No Bed');
  const isAllocated = Boolean(room?.number);

  const statusLabel = isAllocated ? (room?.status || 'Occupied') : 'Unassigned';
  const statusColor = isAllocated ? '#16A34A' : '#64748B';
  const statusBg = isAllocated ? 'rgba(22, 163, 74, 0.1)' : 'rgba(100, 116, 139, 0.1)';

  return (
    <Card
      onClick={onClick}
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
          borderColor: 'rgba(79, 70, 229, 0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5',
          }}
        >
          <Bed size={22} />
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
        MY ROOM
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
        {roomNumber}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {blockName} {isAllocated && bedInfo ? `• ${bedInfo}` : ''}
      </Typography>
    </Card>
  );
}
