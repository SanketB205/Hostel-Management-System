import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { ClipboardList, Clock, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ComplaintStats({ complaints }) {
  const statsData = [
    {
      id: 'total',
      title: 'Total Complaints',
      icon: ClipboardList,
      count: complaints.length,
      subtitle: 'All Complaints',
      color: '#6366F1', // Indigo
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      id: 'pending',
      title: 'Pending',
      icon: Clock,
      count: complaints.filter(c => c.status === 'Pending').length,
      subtitle: 'Awaiting Action',
      color: '#F59E0B', // Amber
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: RefreshCw,
      count: complaints.filter(c => c.status === 'In Progress').length,
      subtitle: 'Being Handled',
      color: '#3B82F6', // Blue
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      id: 'resolved',
      title: 'Resolved',
      icon: CheckCircle2,
      count: complaints.filter(c => c.status === 'Resolved').length,
      subtitle: 'Successfully Resolved',
      color: '#10B981', // Emerald
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      id: 'high_priority',
      title: 'High Priority',
      icon: AlertTriangle,
      count: complaints.filter(c => c.priority === 'High').length,
      subtitle: 'Urgent Cases',
      color: '#EF4444', // Red
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
