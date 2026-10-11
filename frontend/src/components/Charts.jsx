import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Skeleton } from '@mui/material';
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { hostel as hostelApi } from '../api';

export default function Charts() {
  const [roomStatusData, setRoomStatusData]   = useState([]);
  const [revenueData,    setRevenueData]       = useState([]);
  const [loading,        setLoading]           = useState(true);

  useEffect(() => {
    hostelApi.getDashboardStats()
      .then(res => {
        const d = res.data || {};
        setRoomStatusData(d.roomStatusChart || []);
        setRevenueData(d.revenueChart || []);
      })
      .catch(err => console.error('Charts: failed to load stats', err))
      .finally(() => setLoading(false));
  }, []);

  const totalRooms = roomStatusData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3, mb: 4 }}>

      {/* ── Donut Chart — Room Status ───────────────────────────────── */}
      <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Room Status</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={180} height={180} />
            <Skeleton variant="text" width={200} />
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative', height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roomStatusData}
                    innerRadius={70} outerRadius={90}
                    paddingAngle={5} dataKey="value" stroke="none"
                  >
                    {roomStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centre label */}
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', textAlign: 'center',
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                  {totalRooms}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Total
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {roomStatusData.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {item.name} ({totalRooms ? Math.round((item.value / totalRooms) * 100) : 0}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Card>

      {/* ── Area Chart — Revenue Overview ──────────────────────────── */}
      <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Revenue Overview</Typography>
          <Typography variant="body2" sx={{
            color: '#22C55E', fontWeight: 600,
            backgroundColor: 'rgba(34,197,94,0.1)',
            px: 1.5, py: 0.5, borderRadius: 2,
          }}>
            This Year
          </Typography>
        </Box>

        {loading ? (
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        ) : (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area
                  type="monotone" dataKey="value"
                  stroke="#4F46E5" strokeWidth={3}
                  fillOpacity={1} fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Card>

    </Box>
  );
}
