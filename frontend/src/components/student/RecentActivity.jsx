import React from 'react';
import { Card, Box, Typography, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  IndianRupee,
  Clock,
  HelpCircle,
} from 'lucide-react';

export default function RecentActivity({ activities = [] }) {
  const getIcon = (type, status) => {
    switch (type) {
      case 'payment':
        return <CheckCircle2 size={18} color="#16A34A" />;
      case 'attendance':
        if (status === 'Present') return <CalendarCheck size={18} color="#16A34A" />;
        if (status === 'Absent') return <AlertTriangle size={18} color="#DC2626" />;
        if (status === 'Leave') return <Clock size={18} color="#2563EB" />;
        return <CalendarCheck size={18} color="#D97706" />;
      case 'complaint':
        if (status === 'Resolved') return <CheckCircle2 size={18} color="#16A34A" />;
        if (status === 'Rejected') return <AlertTriangle size={18} color="#DC2626" />;
        return <ClipboardList size={18} color="#D97706" />;
      case 'warning':
        return <AlertTriangle size={18} color="#D97706" />;
      default:
        return <Activity size={18} color="#4F46E5" />;
    }
  };

  const getBgColor = (type, status) => {
    switch (type) {
      case 'payment':
        return 'rgba(22, 163, 74, 0.1)';
      case 'attendance':
        if (status === 'Present') return 'rgba(22, 163, 74, 0.1)';
        if (status === 'Absent') return 'rgba(220, 38, 38, 0.1)';
        if (status === 'Leave') return 'rgba(37, 99, 235, 0.1)';
        return 'rgba(245, 158, 11, 0.1)';
      case 'complaint':
        if (status === 'Resolved') return 'rgba(22, 163, 74, 0.1)';
        return 'rgba(245, 158, 11, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      default:
        return 'rgba(79, 70, 229, 0.1)';
    }
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5',
          }}
        >
          <Activity size={20} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your latest hostel events and updates
          </Typography>
        </Box>
      </Box>

      {/* Activity List */}
      {activities.length === 0 ? (
        <Box
          sx={{
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            No recent activity
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, '& > *:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
          {activities.slice(0, 6).map((item, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                py: 1.75,
                px: 1,
                borderRadius: 2,
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: 'background.default' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: getBgColor(item.type, item.status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getIcon(item.type, item.status)}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {item.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                    {item.time || item.date}
                    {item.subtitle && ` • ${item.subtitle}`}
                  </Typography>
                }
              />
              {item.status && (
                <Chip
                  label={item.status}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                    backgroundColor: getBgColor(item.type, item.status),
                    color:
                      item.status === 'Success' || item.status === 'Resolved' || item.status === 'Present'
                        ? '#16A34A'
                        : item.status === 'Absent' || item.status === 'Rejected'
                        ? '#DC2626'
                        : '#D97706',
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}
