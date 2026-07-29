import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const ROOM_STATUS_DATA = [
  { name: 'Occupied', value: 240, color: '#F59E0B' },
  { name: 'Available', value: 12, color: '#22C55E' },
  { name: 'Maintenance', value: 8, color: '#EF4444' },
];

const TOTAL_ROOMS = ROOM_STATUS_DATA.reduce((acc, curr) => acc + curr.value, 0);

const MONTHLY_REPORTS_DATA = [
  { name: 'Jan', value: 120 },
  { name: 'Feb', value: 135 },
  { name: 'Mar', value: 110 },
  { name: 'Apr', value: 150 },
  { name: 'May', value: 180 },
  { name: 'Jun', value: 210 },
  { name: 'Jul', value: 190 },
  { name: 'Aug', value: 230 },
  { name: 'Sep', value: 250 },
  { name: 'Oct', value: 240 },
  { name: 'Nov', value: 260 },
  { name: 'Dec', value: 280 },
];

export default function Charts() {
  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, 
        gap: 3, 
        mb: 4 
      }}
    >
      {/* Donut Chart */}
      <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Room Status
        </Typography>
        <Box sx={{ position: 'relative', height: 250 }}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ROOM_STATUS_DATA}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {ROOM_STATUS_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Total */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
              {TOTAL_ROOMS}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Total
            </Typography>
          </Box>
        </Box>
        {/* Custom Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {ROOM_STATUS_DATA.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {item.name} ({Math.round((item.value / TOTAL_ROOMS) * 100)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* Area Chart */}
      <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Revenue Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#22C55E', fontWeight: 600, backgroundColor: 'rgba(34, 197, 94, 0.1)', px: 1.5, py: 0.5, borderRadius: 2 }}>
            +14% this year
          </Typography>
        </Box>
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={MONTHLY_REPORTS_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'text.secondary', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'text.secondary', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4F46E5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
}
