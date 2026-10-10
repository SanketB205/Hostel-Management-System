import React from 'react';
import { Card, Box, Typography, Button, Stack } from '@mui/material';
import { CreditCard, CalendarCheck, ClipboardList, Bed, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INDIGO = '#4F46E5';

export default function StudentQuickActions({ onPayNow, onOpenRoomDetails, balanceDue = 0 }) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Pay Fees',
      icon: CreditCard,
      color: '#4F46E5',
      bgColor: 'rgba(79, 70, 229, 0.1)',
      onClick: balanceDue > 0 ? onPayNow : () => navigate('/finances'),
      primary: balanceDue > 0,
    },
    {
      title: 'View Attendance',
      icon: CalendarCheck,
      color: '#16A34A',
      bgColor: 'rgba(22, 163, 74, 0.1)',
      onClick: () => navigate('/attendance/student'),
    },
    {
      title: 'My Complaints',
      icon: ClipboardList,
      color: '#D97706',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      onClick: () => navigate('/complaints'),
    },
    {
      title: 'Room Details',
      icon: Bed,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      onClick: onOpenRoomDetails || (() => {}),
    },
  ];

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: INDIGO,
          }}
        >
          <Sparkles size={18} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quickly navigate to frequent student actions
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Button
              key={idx}
              variant={act.primary ? 'contained' : 'outlined'}
              onClick={act.onClick}
              startIcon={<Icon size={18} />}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                justifyContent: 'center',
                backgroundColor: act.primary ? INDIGO : 'background.paper',
                borderColor: act.primary ? undefined : 'divider',
                color: act.primary ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: act.primary ? '#4338CA' : act.bgColor,
                  borderColor: act.primary ? undefined : act.color,
                },
              }}
            >
              {act.title}
            </Button>
          );
        })}
      </Box>
    </Card>
  );
}
