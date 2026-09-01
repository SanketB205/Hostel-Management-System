import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Alert
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
  ArrowUpRight, 
  ArrowDownRight 
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
import { students as studentsApi } from '../api';

const INSIGHT_ICONS = [ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, AlertTriangle];

export default function FinancesPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const formattedDate = selectedDate.format('YYYY-MM-DD');
        const res = await studentsApi.financeAnalytics(formattedDate);
        if (active) {
          setFinanceData(res.data);
        }
      } catch (err) {
        console.error('Failed to load finance analytics:', err);
        if (active) {
          setError(err.message || 'Failed to load finance analytics.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => { active = false; };
  }, [selectedDate]);

  const handleExportCSV = () => {
    if (!financeData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', financeData.stats.totalRevenue],
      ['Total Collected', financeData.stats.totalCollected],
      ['Total Pending', financeData.stats.totalPending],
      ['Collection Rate', `${financeData.stats.collectionRate}%`],
      [],
      ['Student Name', 'Room', 'Pending Amount', 'Due Date', 'Status'],
      ...(financeData.topPendingStudents || []).map(s => [
        `"${s.name}"`, `"${s.room}"`, s.amount, `"${s.dueDate}"`, `"${s.status}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finance_Report_${selectedDate.format('YYYY_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 450 }}>
        <CircularProgress size={48} sx={{ color: '#4F46E5' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => setSelectedDate(dayjs())}>Reload Current Month</Button>
      </Box>
    );
  }

  const {
    stats = { totalRevenue: 0, totalCollected: 0, totalPending: 0, collectionRate: 0 },
    annualTrendData = [],
    paymentDistributionData = [],
    collectionVsPendingData = [],
    courseCollectionData = [],
    blockOutstandingData = [],
    topPendingStudents = [],
    quickInsights = []
  } = financeData || {};

  const paidSlice = paymentDistributionData.find(p => p.name === 'Paid');
  const paidRatio = paidSlice ? paidSlice.percentage : stats.collectionRate;

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
              Track real-time revenue collection, outstanding dues, and hostel financial health.
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
              onClick={handleExportCSV}
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
              {formatCurrency(stats.totalRevenue)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Overall Assigned Fees
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
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#16A34A', fontSize: { xs: '26px', sm: '28px', md: '30px' } }}>
              {formatCurrency(stats.totalCollected)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Successfully Paid
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
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: stats.totalPending > 0 ? '#DC2626' : '#16A34A', fontSize: { xs: '26px', sm: '28px', md: '30px' } }}>
              {formatCurrency(stats.totalPending)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDown size={16} color={stats.totalPending > 0 ? '#DC2626' : '#16A34A'} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Outstanding Student Dues
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
              {stats.collectionRate}%
            </Typography>
            <Box sx={{ width: '100%', mt: 'auto' }}>
              <LinearProgress 
                variant="determinate" 
                value={stats.collectionRate} 
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
              Monthly Revenue Trend ({selectedDate.format('YYYY')})
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={annualTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(v) => `₹${v/1000}k`}
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
                    data={paymentDistributionData.filter(d => d.value > 0).length > 0 ? paymentDistributionData : [{ name: 'No Data', value: 1, color: '#E2E8F0', percentage: 0 }]}
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value, name) => [name === 'No Data' ? '—' : formatCurrency(value), name]}
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
                  {paidRatio}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Paid Ratio
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap', mt: 2 }}>
              {paymentDistributionData.map((item, idx) => (
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
              Collection vs Pending Fees ({selectedDate.format('YYYY')})
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={collectionVsPendingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(v) => `₹${v/1000}k`}
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
              {courseCollectionData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No student courses registered yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    layout="vertical"
                    data={courseCollectionData} 
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
              )}
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
              {blockOutstandingData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No block allocations registered yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    layout="vertical"
                    data={blockOutstandingData} 
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
              )}
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
                  {topPendingStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No students with pending fee dues found.
                      </TableCell>
                    </TableRow>
                  ) : topPendingStudents.map((row, idx) => (
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
            {quickInsights.map((insight, idx) => {
              const Icon = INSIGHT_ICONS[idx] || ArrowUpRight;
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
              gap: '16px', 
              width: '100%'
            }}
          >
            {[
              { title: 'Export CSV Report', icon: Download, color: 'success', onClick: handleExportCSV },
              { title: 'Print Dashboard Report', icon: Printer, color: 'secondary', onClick: handlePrint },
              { title: 'View Students with Dues', icon: FileText, color: 'error', onClick: () => window.location.href = '/students' },
              { title: 'Refresh Analytics', icon: FileText, color: 'primary', onClick: () => setSelectedDate(dayjs(selectedDate)) }
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <Button
                  key={i}
                  variant="outlined"
                  fullWidth
                  color={act.color}
                  onClick={act.onClick}
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
