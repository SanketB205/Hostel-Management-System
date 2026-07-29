import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { Users, CheckCircle2, CalendarOff, UserCheck, Activity } from 'lucide-react';

export default function StaffStats({ staff }) {
  const totalStaff = staff.length;
  const presentToday = 18; 
  const attendanceRate = '96%';

  const statsData = [
    {
      id: 'total',
      title: 'Total Staff',
      icon: Users,
      count: totalStaff,
      subtitle: 'Registered Staff',
      color: '#3B82F6', // Blue
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      id: 'present',
      title: 'Present Today',
      icon: UserCheck,
      count: presentToday,
      subtitle: 'Checked In Today',
      color: '#8B5CF6', // Purple
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      id: 'attendance',
      title: 'Attendance Rate',
      icon: Activity,
      count: attendanceRate,
      subtitle: 'Monthly Average',
      color: '#EC4899', // Pink
      bgColor: 'rgba(236, 72, 153, 0.1)',
    }
  ];

  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
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
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
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
