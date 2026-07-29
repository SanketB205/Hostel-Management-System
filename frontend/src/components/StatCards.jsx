import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import { Users, Bed, CheckCircle, Clock, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

const STATS = [
  {
    title: 'Total Students',
    value: '820',
    trend: '+12%',
    isPositive: true,
    icon: Users,
    color: '#4F46E5', // Indigo
    bgColor: 'rgba(79, 70, 229, 0.1)',
  },
  {
    title: 'Occupied Rooms',
    value: '240',
    trend: '+5%',
    isPositive: true,
    icon: Bed,
    color: '#F59E0B', // Warning/Orange
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    title: 'Available Rooms',
    value: '12',
    trend: '-2%',
    isPositive: false,
    icon: CheckCircle,
    color: '#22C55E', // Success/Green
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  {
    title: 'Pending Complaints',
    value: '5',
    trend: '-18%',
    isPositive: true, // fewer complaints is good
    icon: Clock,
    color: '#EF4444', // Danger/Red
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    title: 'Total Staff',
    value: '45',
    trend: '0%',
    isPositive: true,
    icon: UserCheck,
    color: '#8B5CF6', // Accent/Purple
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
];

export default function StatCards() {
  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}
    >
      {STATS.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={idx}
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                borderColor: 'rgba(79, 70, 229, 0.2)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3, 
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color
                }}
              >
                <Icon size={24} />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  backgroundColor: stat.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: stat.isPositive ? '#16A34A' : '#DC2626',
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {stat.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.trend}
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {stat.title}
            </Typography>
          </Card>
        );
      })}
    </Box>
  );
}
