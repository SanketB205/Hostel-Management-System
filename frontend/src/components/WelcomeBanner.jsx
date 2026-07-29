import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeBanner() {
  const { user } = useAuth();
  const email = user?.email || 'admin@example.com';
  const name = email.split('@')[0];
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
        borderRadius: 4,
        p: 4,
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
          zIndex: 0 
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
          zIndex: 0 
        }} 
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: { xs: '100%', md: '60%' }, mb: { xs: 3, md: 0 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: -0.5 }}>
          Welcome back, {capitalizedName}
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, fontSize: '1.1rem' }}>
          Here's what's happening with your hostel today. You have 5 pending complaints and 12 rooms available.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button 
            variant="contained" 
            sx={{ 
              backgroundColor: 'white', 
              color: '#4F46E5',
              '&:hover': { backgroundColor: 'background.default' },
              fontWeight: 600,
              px: 3,
            }}
          >
            Review Complaints
          </Button>
          <Button 
            variant="outlined" 
            endIcon={<ArrowRight size={18} />}
            sx={{ 
              borderColor: 'rgba(255,255,255,0.5)', 
              color: 'white',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
              fontWeight: 600
            }}
          >
            View Room Status
          </Button>
        </Stack>
      </Box>

      {/* Abstract SVG Illustration */}
      <Box sx={{ position: 'relative', zIndex: 1, display: { xs: 'none', md: 'block' } }}>
        <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="40" width="80" height="120" rx="8" fill="white" fillOpacity="0.1" />
          <rect x="100" y="20" width="80" height="140" rx="8" fill="white" fillOpacity="0.2" />
          <rect x="180" y="60" width="40" height="100" rx="8" fill="white" fillOpacity="0.1" />
          <circle cx="140" cy="80" r="20" fill="white" fillOpacity="0.3" />
          <path d="M40 80H80" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round"/>
          <path d="M40 100H80" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round"/>
          <path d="M120 120H160" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </Box>
    </Box>
  );
}
