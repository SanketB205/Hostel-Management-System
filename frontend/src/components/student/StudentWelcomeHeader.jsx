import React from 'react';
import { Box, Typography, Button, Stack, Chip } from '@mui/material';
import { CreditCard, ClipboardList, ArrowRight, Bed, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentWelcomeHeader({ student, balanceDue, onPayNow }) {
  const navigate = useNavigate();

  const studentName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student' : 'Student';
  
  // Format subtitle info gracefully without undefined, null, NaN
  const activeAllocation = (student?.allocations || []).find(a => a.status === 'active') || (student?.allocations || [])[0];
  const roomNumber = activeAllocation?.room?.number ? `Room ${activeAllocation.room.number}` : null;
  const course = student?.courseDetails?.name || student?.course || null;
  const year = student?.yearOfStudy || student?.year || null;

  const subtitleParts = [roomNumber, course, year].filter(Boolean);
  const subtitleText = subtitleParts.join(' • ');

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
        borderRadius: 4,
        p: { xs: 3, md: 4 },
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
      }}
    >
      {/* Abstract Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          right: 150,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.2)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: { xs: '100%', md: '65%' }, mb: { xs: 3, md: 0 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: -0.5, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Welcome back, {studentName} 👋
        </Typography>
        
        {subtitleText && (
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, fontSize: '1.05rem', fontWeight: 500 }}>
            {subtitleText}
          </Typography>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {balanceDue > 0 ? (
            <Button
              variant="contained"
              onClick={onPayNow}
              startIcon={<CreditCard size={18} />}
              sx={{
                backgroundColor: 'white',
                color: '#4F46E5',
                '&:hover': { backgroundColor: 'background.default' },
                fontWeight: 600,
                px: 3,
                py: 1,
              }}
            >
              Pay Balance Due
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/finances')}
              startIcon={<CreditCard size={18} />}
              sx={{
                backgroundColor: 'white',
                color: '#4F46E5',
                '&:hover': { backgroundColor: 'background.default' },
                fontWeight: 600,
                px: 3,
                py: 1,
              }}
            >
              View Finances
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => navigate('/complaints')}
            startIcon={<ClipboardList size={18} />}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            My Complaints
          </Button>
        </Stack>
      </Box>

      {/* Abstract Illustration */}
      <Box sx={{ position: 'relative', zIndex: 1, display: { xs: 'none', md: 'block' } }}>
        <svg width="200" height="140" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="40" width="80" height="120" rx="8" fill="white" fillOpacity="0.1" />
          <rect x="100" y="20" width="80" height="140" rx="8" fill="white" fillOpacity="0.2" />
          <rect x="180" y="60" width="40" height="100" rx="8" fill="white" fillOpacity="0.1" />
          <circle cx="140" cy="80" r="20" fill="white" fillOpacity="0.3" />
          <path d="M40 80H80" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 100H80" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 120H160" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </Box>
    </Box>
  );
}
