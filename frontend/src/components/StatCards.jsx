import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Skeleton, Tooltip } from '@mui/material';
import { Users, Bed, CheckCircle, Clock, UserCheck, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hostel as hostelApi } from '../api';

const STAT_CONFIG = [
  {
    key: 'totalStudents',
    title: 'Total Students',
    path: '/students',
    icon: Users,
    color: '#4F46E5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
    isPositive: true,
    tooltip: 'View all registered students',
  },
  {
    key: 'occupiedRooms',
    title: 'Occupied Rooms',
    path: '/rooms?status=Occupied',
    icon: Bed,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    isPositive: true,
    tooltip: 'View occupied rooms',
  },
  {
    key: 'availableRooms',
    title: 'Available Rooms',
    path: '/rooms?status=Available',
    icon: CheckCircle,
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    isPositive: true,
    tooltip: 'View available rooms',
  },
  {
    key: 'pendingComplaints',
    title: 'Pending Complaints',
    path: '/complaints?status=Pending',
    icon: Clock,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    isPositive: false,
    tooltip: 'Review pending complaints',
  },
  {
    key: 'totalStaff',
    title: 'Total Staff',
    path: '/staff',
    icon: UserCheck,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    isPositive: true,
    adminOnly: true,
    tooltip: 'Manage hostel staff',
  },
];

export default function StatCards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    hostelApi.getDashboardStats()
      .then(res => setStats(res.data?.stats || res.data || {}))
      .catch(err => console.error('StatCards: failed to load stats', err))
      .finally(() => setLoading(false));
  }, [user]);

  const displayConfig = STAT_CONFIG.filter(s => !s.adminOnly || isAdmin);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(2, 1fr)',
          lg: isAdmin ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      {displayConfig.map((cfg) => {
        const Icon = cfg.icon;
        const value = loading ? null : (stats?.[cfg.key] ?? 0);

        let title = cfg.title;
        let tooltip = cfg.tooltip;
        let subtitle = null;

        if (cfg.key === 'pendingComplaints') {
          if (isAdmin) {
            tooltip = 'Review all pending complaints (Students & Rector)';
            subtitle = 'Students & Rector';
          } else {
            tooltip = 'Review pending student complaints';
            subtitle = 'Students only';
          }
        }

        return (
          <Tooltip key={cfg.key} title={tooltip} arrow placement="top">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(cfg.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(cfg.path);
                }
              }}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px -4px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  borderColor: cfg.color,
                  '& .stat-arrow': {
                    opacity: 1,
                    transform: 'translate(2px, -2px)',
                  },
                },
                '&:focus-visible': {
                  outline: `2px solid ${cfg.color}`,
                  outlineOffset: '2px',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    backgroundColor: cfg.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cfg.color,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <Icon size={24} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: cfg.isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: cfg.isPositive ? '#16A34A' : '#DC2626',
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {cfg.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    Live
                  </Box>
                  <Box
                    className="stat-arrow"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: cfg.color,
                      opacity: 0.4,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ArrowUpRight size={18} />
                  </Box>
                </Box>
              </Box>

              {loading ? (
                <Skeleton variant="text" width={80} height={48} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                  {value}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Card>
          </Tooltip>
        );
      })}
    </Box>
  );
}
