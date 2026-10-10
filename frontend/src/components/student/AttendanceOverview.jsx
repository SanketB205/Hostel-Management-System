import React from 'react';
import { Card, Box, Typography, Button, LinearProgress, Chip, Stack } from '@mui/material';
import { CalendarCheck, ArrowRight, CheckCircle2, XCircle, Clock, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceOverview({ attendanceStats, todayStatus }) {
  const navigate = useNavigate();

  const {
    percentage = 0,
    presentCount = 0,
    absentCount = 0,
    leaveCount = 0,
    lateCount = 0,
    outingCount = 0,
    totalDays = 0,
  } = attendanceStats || {};

  const isGood = percentage >= 75;

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <CalendarCheck size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Attendance Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Academic term attendance status
            </Typography>
          </Box>
        </Box>
        {todayStatus && todayStatus !== 'Not Marked' && (
          <Chip
            label={`Today: ${todayStatus}`}
            size="small"
            sx={{
              fontWeight: 600,
              backgroundColor:
                todayStatus === 'Present'
                  ? 'rgba(22, 163, 74, 0.1)'
                  : todayStatus === 'Absent'
                  ? 'rgba(220, 38, 38, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              color:
                todayStatus === 'Present'
                  ? '#16A34A'
                  : todayStatus === 'Absent'
                  ? '#DC2626'
                  : '#D97706',
            }}
          />
        )}
      </Box>

      {/* Main Metric & Progress */}
      <Box sx={{ mb: 3, p: 2.5, borderRadius: 3, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Overall Attendance
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: totalDays === 0 ? 'text.secondary' : isGood ? '#16A34A' : '#DC2626', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
              {totalDays > 0 ? `${percentage}%` : '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Chip
              label={totalDays === 0 ? 'No Records' : isGood ? 'Criteria Met (≥ 75%)' : 'Attention Needed (< 75%)'}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: totalDays === 0 ? 'rgba(100, 116, 139, 0.1)' : isGood ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: totalDays === 0 ? '#64748B' : isGood ? '#16A34A' : '#DC2626',
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {totalDays > 0 ? `${presentCount} of ${totalDays} days recorded` : '0 attendance days recorded'}
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={totalDays > 0 ? Math.min(percentage, 100) : 0}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundColor: isGood ? '#16A34A' : '#DC2626',
            },
          }}
        />
      </Box>

      {/* Breakdown Badges */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(22, 163, 74, 0.06)', border: '1px solid rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle2 size={20} color="#16A34A" />
          <Box>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, display: 'block' }}>
              Present
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {presentCount}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <XCircle size={20} color="#DC2626" />
          <Box>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600, display: 'block' }}>
              Absent
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {absentCount}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Plane size={20} color="#2563EB" />
          <Box>
            <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600, display: 'block' }}>
              Leave
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {leaveCount}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer Action */}
      <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          onClick={() => navigate('/attendance/student')}
          endIcon={<ArrowRight size={16} />}
          sx={{
            color: '#16A34A',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(22, 163, 74, 0.08)' },
          }}
        >
          View Attendance Details
        </Button>
      </Box>
    </Card>
  );
}
