import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { CheckCircle2, Navigation, CalendarOff, Clock, UserX } from 'lucide-react';

export default function StudentStats({ students }) {
  const statsData = [
    {
      id: 'present',
      title: 'Present',
      icon: CheckCircle2,
      count: students.filter(s => s.status === 'Present').length,
      subtitle: 'Students Inside Hostel',
      color: '#22C55E',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
    {
      id: 'outing',
      title: 'Outing',
      icon: Navigation,
      count: students.filter(s => s.status === 'Outing').length,
      subtitle: 'Temporary Exit',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      id: 'leave',
      title: 'Leave',
      icon: CalendarOff,
      count: students.filter(s => s.status === 'Leave').length,
      subtitle: 'On Approved Leave',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      id: 'late',
      title: 'Late',
      icon: Clock,
      count: students.filter(s => s.status === 'Late').length,
      subtitle: 'Returned Late',
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      id: 'absent',
      title: 'Absent',
      icon: UserX,
      count: students.filter(s => s.status === 'Absent').length,
      subtitle: 'Unaccounted Students',
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    }
  ];

  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}
    >
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.id}
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3, 
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  mr: 2
                }}
              >
                <Icon size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {stat.title}
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: { xs: '28px', sm: '32px' } }}>
              {stat.count}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {stat.subtitle}
            </Typography>
          </Card>
        );
      })}
    </Box>
  );
}
