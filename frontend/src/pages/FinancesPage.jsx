import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Button,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Download, 
  Printer, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

// Mock Data
const ANNUAL_TREND_DATA = [
  { name: 'Jan', revenue: 1800000 },
  { name: 'Feb', revenue: 1950000 },
  { name: 'Mar', revenue: 2100000 },
  { name: 'Apr', revenue: 2050000 },
  { name: 'May', revenue: 2200000 },
  { name: 'Jun', revenue: 2350000 },
  { name: 'Jul', revenue: 2485000 }
];

const PAYMENT_DISTRIBUTION_DATA = [
  { name: 'Paid', value: 1825000, percentage: 74, color: '#16A34A' },
  { name: 'Partial', value: 370000, percentage: 15, color: '#F59E0B' },
  { name: 'Pending', value: 290000, percentage: 11, color: '#DC2626' }
];

const COLLECTION_VS_PENDING_DATA = [
  { name: 'Jan', Collected: 1500000, Pending: 300000 },
  { name: 'Feb', Collected: 1700000, Pending: 250000 },
  { name: 'Mar', Collected: 1800000, Pending: 300000 },
  { name: 'Apr', Collected: 1650000, Pending: 350000 },
  { name: 'May', Collected: 1500000, Pending: 700000 },
  { name: 'Jun', Collected: 1900000, Pending: 450000 },
  { name: 'Jul', Collected: 1825000, Pending: 475000 }
];

const COURSE_COLLECTION_DATA = [
  { course: 'CSE', Collected: 750000, Revenue: 1000000 },
  { course: 'ECE', Collected: 480000, Revenue: 600000 },
  { course: 'ME', Collected: 310000, Revenue: 450000 },
  { course: 'CE', Collected: 180000, Revenue: 250000 },
  { course: 'BBA', Collected: 105000, Revenue: 185000 }
];

const BLOCK_OUTSTANDING_DATA = [
  { block: 'Block A', Paid: 65, Partial: 20, Pending: 15 },
  { block: 'Block B', Paid: 55, Partial: 25, Pending: 20 },
  { block: 'Block C', Paid: 45, Partial: 20, Pending: 35 },
  { block: 'Block D', Paid: 70, Partial: 15, Pending: 15 }
];

const TOP_PENDING_STUDENTS = [
  { name: 'Rohit Sharma', room: 'C-204', amount: 45000, dueDate: '2026-07-20', status: 'Pending' },
  { name: 'Priya Verma', room: 'B-102', amount: 38000, dueDate: '2026-07-15', status: 'Partial' },
  { name: 'Amit Singh', room: 'A-108', amount: 35000, dueDate: '2026-07-18', status: 'Pending' },
  { name: 'Kunal Sen', room: 'C-302', amount: 32000, dueDate: '2026-07-25', status: 'Pending' },
  { name: 'Neha Gupta', room: 'A-212', amount: 28000, dueDate: '2026-07-22', status: 'Partial' }
];

const QUICK_INSIGHTS = [
  { title: 'Highest Revenue Month', value: 'July (₹24.85L)', desc: 'Peak admission period', icon: ArrowUpRight, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
  { title: 'Lowest Collection Month', value: 'May (68%)', desc: 'Pre-exam vacation term', icon: ArrowDownRight, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
  { title: 'Most Pending Block', value: 'Block C (₹1.80L)', desc: 'Requires proactive follow-up', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { title: 'Best Paying Department', value: 'Computer Science (CSE)', desc: '92% overall collection rate', icon: CheckCircle, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
  { title: 'Highest Pending Department', value: 'Business (BBA)', desc: '38% student fees outstanding', icon: AlertTriangle, color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' }
];

export default function FinancesPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4, width: '100%', display: 'block' }}>
        
        {/* PAGE HEADER */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: '32px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Finance Reports Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track revenue collection, outstanding dues, and financial health metrics.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <DatePicker
              label="Select Month/Year"
              value={selectedDate}
              onChange={(newDate) => {
                if (newDate) setSelectedDate(newDate);
              }}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  sx: { backgroundColor: 'background.paper', borderRadius: 2 } 
                } 
              }}
            />
            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              sx={{ 
                backgroundColor: '#4F46E5', 
                '&:hover': { backgroundColor: '#4338CA' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1
              }}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* SECTION 1: KPI Summary Cards */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Card 1: Total Revenue */}
          <Card 
            sx={{ 
              p: 3,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: '16px',
              boxShadow: (theme) => theme.palette.mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.palette.mode === 'light' 
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  mr: 2
                }}
              >
                <DollarSign size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: { xs: '26px', sm: '28px', md: '30px' } }}>
              {formatCurrency(2485000)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Overall Hostel Revenue
            </Typography>
          </Card>

          {/* Card 2: Total Collected */}
          <Card 
            sx={{ 
              p: 3,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: '16px',
              boxShadow: (theme) => theme.palette.mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.palette.mode === 'light' 
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A',
                  mr: 2
                }}
              >
                <CheckCircle size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
                Total Collected
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: { xs: '26px', sm: '28px', md: '30px' } }}>
              {formatCurrency(1825000)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Successfully Collected
            </Typography>
          </Card>

          {/* Card 3: Total Pending Fees */}
          <Card 
            sx={{ 
              p: 3,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: '16px',
              boxShadow: (theme) => theme.palette.mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.palette.mode === 'light' 
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  mr: 2
                }}
              >
                <AlertTriangle size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
                Total Pending Fees
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#D97706', fontSize: { xs: '26px', sm: '28px', md: '30px' } }}>
              {formatCurrency(475000)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDown size={16} color="#DC2626" />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Outstanding Student Fees (↓ 3.2% since last month)
              </Typography>
            </Box>
          </Card>

          {/* Card 4: Collection Rate */}
          <Card 
            sx={{ 
              p: 3,
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              borderRadius: '16px',
              boxShadow: (theme) => theme.palette.mode === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: (theme) => theme.palette.mode === 'light' 
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8B5CF6',
                  mr: 2
                }}
              >
                <TrendingUp size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
                Collection Rate
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', fontSize: { xs: '28px', sm: '32px' } }}>
              74%
            </Typography>
            <Box sx={{ width: '100%', mt: 'auto' }}>
              <LinearProgress 
                variant="determinate" 
                value={74} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8B5CF6'
                  }
                }} 
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontWeight: 500 }}>
                Overall Collection Efficiency
              </Typography>
            </Box>
          </Card>
        </Box>

        {/* SECTION 2: Charts Row 1 */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Monthly Revenue Trend */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Monthly Revenue Trend
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={ANNUAL_TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(v) => `₹${v/100000}L`}
                  />
                  <ChartTooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} activeDot={{ r: 6 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Payment Distribution */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Payment Distribution
            </Typography>
            <Box sx={{ flex: 1, position: 'relative', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={PAYMENT_DISTRIBUTION_DATA}
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {PAYMENT_DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                  74%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Paid Ratio
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap', mt: 2 }}>
              {PAYMENT_DISTRIBUTION_DATA.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {item.name}: {item.percentage}% ({formatCurrency(item.value)})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>

        {/* SECTION 3: Charts Row 2 */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Collection vs Pending Fees */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Collection vs Pending Fees
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={COLLECTION_VS_PENDING_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(v) => `₹${v/100000}L`}
                  />
                  <ChartTooltip 
                    formatter={(value) => [formatCurrency(value), '']}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Collected" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Fee Collection by Course */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Fee Collection by Course
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  layout="vertical"
                  data={COURSE_COLLECTION_DATA} 
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(v) => `₹${v/1000}K`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="course" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <ChartTooltip 
                    formatter={(value) => [formatCurrency(value), '']}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Collected" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="Revenue" fill="#E2E8F0" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* SECTION 4: Charts Row 3 */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Outstanding Fees by Hostel Block */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Outstanding Fees by Hostel Block (%)
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  layout="vertical"
                  data={BLOCK_OUTSTANDING_DATA} 
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category"
                    dataKey="block" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <ChartTooltip 
                    formatter={(value) => [`${value}%`, '']}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }} 
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Paid" stackId="a" fill="#16A34A" />
                  <Bar dataKey="Partial" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="Pending" stackId="a" fill="#DC2626" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Top Pending Students */}
          <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Top Pending Students
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Pending Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TOP_PENDING_STUDENTS.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.room}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {dayjs(row.dueDate).format('DD MMM YYYY')}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={row.status}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: row.status === 'Pending' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: row.status === 'Pending' ? '#DC2626' : '#D97706'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* SECTION 5: Quick Insights Panel */}
        <Box sx={{ mb: '32px' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Quick Insights Panel
          </Typography>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)' }, 
              gap: '24px', 
              width: '100%'
            }}
          >
            {QUICK_INSIGHTS.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <Card 
                  key={idx}
                  sx={{ 
                    p: 2.5,
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '12px',
                    boxShadow: (theme) => theme.palette.mode === 'light' 
                      ? '0 2px 4px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        backgroundColor: insight.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: insight.color,
                        mr: 1.5
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.1 }}>
                      {insight.title}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: '1rem' }}>
                    {insight.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {insight.desc}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* SECTION 6: Quick Actions */}
        <Card sx={{ p: 3, borderRadius: '16px' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Quick Actions
          </Typography>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, 
              gap: '16px',
              width: '100%'
            }}
          >
            {[
              { title: 'View Detailed Report', icon: FileText, color: 'primary' },
              { title: 'Export Excel', icon: Download, color: 'success' },
              { title: 'Export PDF', icon: Download, color: 'error' },
              { title: 'Print Report', icon: Printer, color: 'secondary' },
              { title: 'View Transactions', icon: FileText, color: 'info' }
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <Button
                  key={i}
                  variant="outlined"
                  fullWidth
                  color={act.color}
                  startIcon={<Icon size={18} />}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 3, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {act.title}
                </Button>
              );
            })}
          </Box>
        </Card>

      </Box>
    </LocalizationProvider>
  );
}
