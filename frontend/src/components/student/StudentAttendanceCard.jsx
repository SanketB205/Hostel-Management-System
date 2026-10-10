import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentAttendanceCard({ attendanceStats }) {
  const navigate = useNavigate();

  const {
    percentage = 0,
    presentCount = 0,
    absentCount = 0,
    leaveCount = 0,
    totalDays = 0,
  } = attendanceStats || {};

  const isGood = percentage >= 75;
  const statusColor = totalDays === 0 ? '#64748B' : isGood ? '#16A34A' : '#DC2626';
  const statusBg = totalDays === 0 ? 'rgba(100, 116, 139, 0.1)' : isGood ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)';

  return (
    <Card
      onClick={() => navigate('/attendance/student')}
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
          borderColor: 'rgba(22, 163, 74, 0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16A34A',
          }}
        >
          <CalendarCheck size={22} />
        </Box>
        <Chip
          label={totalDays === 0 ? 'No Data' : isGood ? 'Good' : 'Low'}
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
        ATTENDANCE
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
        {totalDays > 0 ? `${percentage}%` : '—'}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {totalDays > 0 ? `${presentCount} / ${totalDays} days` : 'No records yet'}
      </Typography>
    </Card>
  );
}
