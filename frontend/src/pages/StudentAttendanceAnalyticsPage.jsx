import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  ButtonGroup,
  IconButton,
  Tooltip as MuiTooltip
} from '@mui/material';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Plane, 
  Clock, 
  HelpCircle, 
  Calendar as CalendarIcon, 
  Download, 
  Printer, 
  FileText, 
  Eye,
  TrendingDown,
  ExternalLink
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
  Tooltip as ChartTooltip
} from 'recharts';

// Custom status dots/colors
const STATUS_COLORS = {
  Present: { color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', dot: '🟢' },
  Absent: { color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', dot: '🔴' },
  Leave: { color: '#2563EB', bg: 'rgba(59, 130, 246, 0.1)', dot: '🔵' },
  Late: { color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)', dot: '🟠' },
  Pending: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', dot: '❓' }
};

// Mock data for Line Chart (Trend) initialized to zero/empty
const WEEKLY_TREND_7D = [
  { name: 'Mon', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Tue', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Wed', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Thu', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Fri', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Sat', Present: 0, Absent: 0, Leave: 0 },
  { name: 'Sun', Present: 0, Absent: 0, Leave: 0 }
];

const WEEKLY_TREND_30D = [
  { name: 'W1', Present: 0, Absent: 0, Leave: 0 },
  { name: 'W2', Present: 0, Absent: 0, Leave: 0 },
  { name: 'W3', Present: 0, Absent: 0, Leave: 0 },
  { name: 'W4', Present: 0, Absent: 0, Leave: 0 }
];

const WEEKLY_TREND_MONTH = [
  { name: '1-5', Present: 0, Absent: 0, Leave: 0 },
  { name: '6-10', Present: 0, Absent: 0, Leave: 0 },
  { name: '11-15', Present: 0, Absent: 0, Leave: 0 },
  { name: '16-20', Present: 0, Absent: 0, Leave: 0 },
  { name: '21-25', Present: 0, Absent: 0, Leave: 0 },
  { name: '26-30', Present: 0, Absent: 0, Leave: 0 }
];

// Mock data for Doughnut Chart (Distribution)
const DISTRIBUTION_DATA = [
  { name: 'Present', value: 0, color: '#16A34A' },
  { name: 'Absent', value: 0, color: '#DC2626' },
  { name: 'Leave', value: 0, color: '#2563EB' },
  { name: 'Late', value: 0, color: '#EA580C' },
  { name: 'Not Marked', value: 0, color: '#64748B' }
];

const TOTAL_DISTRIBUTION = DISTRIBUTION_DATA.reduce((acc, c) => acc + c.value, 0);

// Course-wise Attendance Mock Data
const COURSE_ATTENDANCE = [];

// Year-wise Attendance Mock Data
const YEAR_ATTENDANCE = [];

// Block-wise Attendance Mock Data
const BLOCK_ATTENDANCE = [];

// Students Requiring Attention Mock Data
const NEED_ATTENTION_STUDENTS = [];

// Monthly Attendance Rate (Bar Chart)
const MONTHLY_RATE_THIS_YEAR = [
  { name: 'Jan', rate: 0 },
  { name: 'Feb', rate: 0 },
  { name: 'Mar', rate: 0 },
  { name: 'Apr', rate: 0 },
  { name: 'May', rate: 0 },
  { name: 'Jun', rate: 0 },
  { name: 'Jul', rate: 0 },
  { name: 'Aug', rate: 0 },
  { name: 'Sep', rate: 0 },
  { name: 'Oct', rate: 0 },
  { name: 'Nov', rate: 0 },
  { name: 'Dec', rate: 0 }
];

const MONTHLY_RATE_LAST_YEAR = [
  { name: 'Jan', rate: 0 },
  { name: 'Feb', rate: 0 },
  { name: 'Mar', rate: 0 },
  { name: 'Apr', rate: 0 },
  { name: 'May', rate: 0 },
  { name: 'Jun', rate: 0 },
  { name: 'Jul', rate: 0 },
  { name: 'Aug', rate: 0 },
  { name: 'Sep', rate: 0 },
  { name: 'Oct', rate: 0 },
  { name: 'Nov', rate: 0 },
  { name: 'Dec', rate: 0 }
];

// Recent Activity Mock Data
const RECENT_ACTIVITIES = [];

export default function StudentAttendanceAnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [trendRange, setTrendRange] = useState('7D');
  const [yearFilter, setYearFilter] = useState('ThisYear');

  const trendData = useMemo(() => {
    if (trendRange === '30D') return WEEKLY_TREND_30D;
    if (trendRange === 'Month') return WEEKLY_TREND_MONTH;
    return WEEKLY_TREND_7D;
  }, [trendRange]);

  const monthlyBarData = useMemo(() => {
    return yearFilter === 'LastYear' ? MONTHLY_RATE_LAST_YEAR : MONTHLY_RATE_THIS_YEAR;
  }, [yearFilter]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4 }}>
        
        {/* Page Header */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Student Attendance Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track and analyze overall student attendance.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <DatePicker
              label="Select Date"
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

        {/* SECTION 1: Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Students', value: '285', subtitle: 'Registered Students', icon: Users, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
            { label: 'Present Today', value: '245', subtitle: 'Students Marked Present', icon: CheckCircle2, color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Absent Today', value: '15', subtitle: 'Students Marked Absent', icon: XCircle, color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)' },
            { label: 'Attendance Rate', value: '86%', subtitle: 'Overall Attendance', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
            { label: 'On Leave', value: '12', subtitle: 'Approved Leave', icon: Plane, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
            { label: 'Late Entry', value: '8', subtitle: 'Marked Late', icon: Clock, color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)' },
            { label: 'Not Marked', value: '5', subtitle: 'Attendance Pending', icon: HelpCircle, color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={1.71} key={i}>
                <Card sx={{ borderRadius: 4, height: '100%' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ p: 1.2, borderRadius: 2.5, backgroundColor: stat.bg, color: stat.color, display: 'flex' }}>
                        <Icon size={20} />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* SECTION 2: Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Weekly Attendance Trend */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Weekly Attendance Trend (%)
                </Typography>
                <ButtonGroup size="small" aria-label="Small button group">
                  <Button 
                    variant={trendRange === '7D' ? 'contained' : 'outlined'} 
                    onClick={() => setTrendRange('7D')}
                    sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: trendRange === '7D' ? '#4F46E5' : 'transparent' }}
                  >
                    Last 7 Days
                  </Button>
                  <Button 
                    variant={trendRange === '30D' ? 'contained' : 'outlined'} 
                    onClick={() => setTrendRange('30D')}
                    sx={{ textTransform: 'none', backgroundColor: trendRange === '30D' ? '#4F46E5' : 'transparent' }}
                  >
                    Last 30 Days
                  </Button>
                  <Button 
                    variant={trendRange === 'Month' ? 'contained' : 'outlined'} 
                    onClick={() => setTrendRange('Month')}
                    sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: trendRange === 'Month' ? '#4F46E5' : 'transparent' }}
                  >
                    This Month
                  </Button>
                </ButtonGroup>
              </Box>
              <Box sx={{ flex: 1, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[50, 100]} />
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Line type="monotone" dataKey="Present" stroke="#16A34A" strokeWidth={3} activeDot={{ r: 6 }} name="Present" />
                    <Line type="monotone" dataKey="Absent" stroke="#DC2626" strokeWidth={2} name="Absent" />
                    <Line type="monotone" dataKey="Leave" stroke="#2563EB" strokeWidth={2} name="On Leave" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Attendance Distribution (Donut Chart) */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Attendance Distribution
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DISTRIBUTION_DATA}
                      innerRadius={80}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {DISTRIBUTION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Content */}
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
                    {TOTAL_DISTRIBUTION}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Students Today
                  </Typography>
                </Box>
              </Box>
              {/* Custom Legend */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                {DISTRIBUTION_DATA.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {item.name}: {item.value} ({Math.round((item.value / TOTAL_DISTRIBUTION) * 100)}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* SECTION 3: Academic Analytics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Course-wise Attendance */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Course-wise Attendance
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Present</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Absent</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>Attendance %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {COURSE_ATTENDANCE.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 500 }}>{row.course}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#16A34A', fontWeight: 600 }}>{row.present}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>{row.absent}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="body2" sx={{ minWidth: 35, fontWeight: 600 }}>
                                {row.rate}%
                              </Typography>
                              <Box sx={{ width: '100%' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={row.rate} 
                                  color={row.rate >= 80 ? 'success' : row.rate >= 70 ? 'warning' : 'error'}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Year-wise Attendance */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Year-wise Attendance
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Present</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Absent</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>Attendance %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {YEAR_ATTENDANCE.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 500 }}>{row.year}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#16A34A', fontWeight: 600 }}>{row.present}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>{row.absent}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="body2" sx={{ minWidth: 35, fontWeight: 600 }}>
                                {row.rate}%
                              </Typography>
                              <Box sx={{ width: '100%' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={row.rate} 
                                  color={row.rate >= 80 ? 'success' : row.rate >= 70 ? 'warning' : 'error'}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SECTION 4: Hostel Analytics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Hostel Block-wise Attendance */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Hostel Block-wise Attendance
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Block</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Present</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Absent</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>Attendance %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {BLOCK_ATTENDANCE.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 500 }}>{row.block}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#16A34A', fontWeight: 600 }}>{row.present}</TableCell>
                          <TableCell sx={{ textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>{row.absent}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="body2" sx={{ minWidth: 35, fontWeight: 600 }}>
                                {row.rate}%
                              </Typography>
                              <Box sx={{ width: '100%' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={row.rate} 
                                  color={row.rate >= 80 ? 'success' : row.rate >= 70 ? 'warning' : 'error'}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Students Requiring Attention */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Students Requiring Attention
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Issue</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Att. %</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {NEED_ATTENTION_STUDENTS.map((row, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>{row.issue}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: row.rate < 75 ? '#DC2626' : 'text.primary' }}>
                            {row.rate}%
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip 
                              label={`${STATUS_COLORS[row.status]?.dot} ${row.status}`} 
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                backgroundColor: STATUS_COLORS[row.status]?.bg,
                                color: STATUS_COLORS[row.status]?.color
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <MuiTooltip title="View Student">
                              <IconButton size="small" sx={{ color: '#4F46E5', '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.1)' } }}>
                                <Eye size={16} />
                              </IconButton>
                            </MuiTooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SECTION 5: Monthly Analytics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Monthly Attendance Rate (Bar Chart) */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Monthly Attendance Rate (%)
                </Typography>
                <ButtonGroup size="small" aria-label="Small button group">
                  <Button 
                    variant={yearFilter === 'ThisYear' ? 'contained' : 'outlined'} 
                    onClick={() => setYearFilter('ThisYear')}
                    sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: yearFilter === 'ThisYear' ? '#4F46E5' : 'transparent' }}
                  >
                    This Year
                  </Button>
                  <Button 
                    variant={yearFilter === 'LastYear' ? 'contained' : 'outlined'} 
                    onClick={() => setYearFilter('LastYear')}
                    sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: yearFilter === 'LastYear' ? '#4F46E5' : 'transparent' }}
                  >
                    Last Year
                  </Button>
                </ButtonGroup>
              </Box>
              <Box sx={{ flex: 1, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[60, 100]} />
                    <ChartTooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Bar dataKey="rate" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Recent Attendance Activity */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Attendance Activity
                  </Typography>
                  <Button 
                    variant="text" 
                    size="small" 
                    endIcon={<ExternalLink size={14} />}
                    sx={{ textTransform: 'none', color: '#4F46E5', fontWeight: 600 }}
                  >
                    View All
                  </Button>
                </Box>
                
                {/* Timeline Layout */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                  {RECENT_ACTIVITIES.map((activity, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: idx !== RECENT_ACTIVITIES.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 65 }}>
                          {activity.time}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {activity.name}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${STATUS_COLORS[activity.status]?.dot} Marked ${activity.status}`} 
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          backgroundColor: STATUS_COLORS[activity.status]?.bg,
                          color: STATUS_COLORS[activity.status]?.color
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* SECTION 6: Quick Actions */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { title: 'View Detailed Report', icon: FileText, color: 'primary' },
                { title: 'Export Excel', icon: Download, color: 'success' },
                { title: 'Export PDF', icon: Download, color: 'error' },
                { title: 'Print Report', icon: Printer, color: 'secondary' },
                { title: 'Monthly Attendance Report', icon: FileText, color: 'info' }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <Grid item xs={12} sm={6} md={2.4} key={i}>
                    <Button
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
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

      </Box>
    </LocalizationProvider>
  );
}
