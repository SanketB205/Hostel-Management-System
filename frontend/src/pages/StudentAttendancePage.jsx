import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  ButtonGroup
} from '@mui/material';
import { students as studentsApi, bootstrap as bootstrapApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Plane, 
  Clock, 
  HelpCircle, 
  Download, 
  Printer, 
  FileText, 
  ExternalLink,
  RotateCcw,
  LogOut as OutingIcon
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

const STATUS_COLORS = {
  Present: { color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', dot: '🟢' },
  Outing: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', dot: '🟡' },
  Leave: { color: '#2563EB', bg: 'rgba(59, 130, 246, 0.1)', dot: '🔵' },
  Late: { color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)', dot: '🟠' },
  Absent: { color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', dot: '🔴' },
  Pending: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', dot: '❓' }
};

// Static fallbacks for Trends & Analytics initialized to zero/empty
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

const WEEKLY_TREND_TODAY = [
  { name: '08:00', Present: 0, Absent: 0, Leave: 0 },
  { name: '10:00', Present: 0, Absent: 0, Leave: 0 },
  { name: '12:00', Present: 0, Absent: 0, Leave: 0 },
  { name: '14:00', Present: 0, Absent: 0, Leave: 0 }
];

const COURSE_ATTENDANCE = [];

const YEAR_ATTENDANCE = [];

const BLOCK_ATTENDANCE = [];

const NEED_ATTENTION_STUDENTS = [];

const MONTHLY_RATE_DATA = [
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

const RECENT_ACTIVITIES = [];

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [trendRange, setTrendRange] = useState('30D');
  const [isDateMode, setIsDateMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Load real students and their attendance status for selected date and range
  useEffect(() => {
    let active = true;
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const [studentsRes, analyticsRes] = await Promise.all([
          studentsApi.list({ date: dateStr }),
          studentsApi.attendanceAnalytics(dateStr, trendRange)
        ]);
        if (active) {
          const studentList = studentsRes.data || [];
          setStudents(studentList);
          
          const attMap = {};
          studentList.forEach(s => {
            attMap[s.id] = s.status || 'Not Marked';
          });
          setAttendance(attMap);
          setAnalytics(analyticsRes.data || null);
        }
      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
        if (active) {
          setSnackbar({
            open: true,
            message: err.message || 'Failed to load attendance records from database.',
            severity: 'error'
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAttendanceData();
    return () => {
      active = false;
    };
  }, [selectedDate, trendRange]);

  // Dynamic calculations for all 8 stats cards
  const stats = useMemo(() => {
    if (analytics?.stats) {
      return analytics.stats;
    }
    let present = 0, absent = 0, leave = 0, outing = 0, late = 0, pending = 0;
    students.forEach(student => {
      const status = attendance[student.id];
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Leave') leave++;
      else if (status === 'Outing') outing++;
      else if (status === 'Late') late++;
      else pending++;
    });

    const total = students.length;
    const rate = total > 0 ? Math.round(((present + late + outing) / total) * 100) : 0;

    return {
      total,
      totalSlots: total,
      present,
      absent,
      rate,
      leave,
      outing,
      late,
      pending
    };
  }, [students, attendance, analytics]);

  // Doughnut Chart Data dynamically synced with active states
  const distributionData = useMemo(() => {
    return [
      { name: 'Present', value: stats.present, color: '#16A34A' },
      { name: 'Absent', value: stats.absent, color: '#DC2626' },
      { name: 'Leave', value: stats.leave, color: '#2563EB' },
      { name: 'Late', value: stats.late, color: '#EA580C' },
      { name: 'Outing', value: stats.outing, color: '#F59E0B' },
      { name: 'Not Marked', value: stats.pending, color: '#64748B' }
    ];
  }, [stats]);

  const trendData = useMemo(() => {
    if (analytics?.weeklyTrend) {
      return analytics.weeklyTrend[trendRange] || [];
    }
    if (trendRange === '30D') return WEEKLY_TREND_30D;
    if (trendRange === 'Today') return WEEKLY_TREND_TODAY;
    return WEEKLY_TREND_7D;
  }, [trendRange, analytics]);

  const courseAttendanceData = useMemo(() => {
    return analytics?.courseAttendance || COURSE_ATTENDANCE;
  }, [analytics]);

  const yearAttendanceData = useMemo(() => {
    return analytics?.yearAttendance || YEAR_ATTENDANCE;
  }, [analytics]);

  const blockAttendanceData = useMemo(() => {
    return analytics?.blockAttendance || BLOCK_ATTENDANCE;
  }, [analytics]);

  const needAttentionStudentsData = useMemo(() => {
    return analytics?.attentionStudents || NEED_ATTENTION_STUDENTS;
  }, [analytics]);

  const monthlyRateDataComputed = useMemo(() => {
    return analytics?.monthlyRates || MONTHLY_RATE_DATA;
  }, [analytics]);

  const recentActivitiesData = useMemo(() => {
    return analytics?.recentActivities || RECENT_ACTIVITIES;
  }, [analytics]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4, width: '100%', display: 'block' }}>
        
        {/* Custom Range Filter Button Group (capsule styled) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
          <ButtonGroup 
            variant="outlined" 
            sx={{ 
              borderRadius: '50px',
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              '& .MuiButton-root': {
                border: '1px solid #4F46E5 !important',
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 2.5, sm: 4 },
                py: 1,
                fontSize: '0.95rem',
                borderColor: '#4F46E5 !important',
                transition: 'all 0.2s',
              },
              '& .MuiButton-root:first-of-type': {
                borderTopLeftRadius: '50px',
                borderBottomLeftRadius: '50px',
              },
              '& .MuiButton-root:last-of-type': {
                borderTopRightRadius: '50px',
                borderBottomRightRadius: '50px',
              },
              '& .MuiButton-root:not(:first-of-type)': {
                marginLeft: '-1px !important',
              }
            }}
          >
            <Button
               onClick={() => { setTrendRange('Today'); setIsDateMode(false); setSelectedDate(dayjs()); }}
               sx={{
                 backgroundColor: trendRange === 'Today' ? '#4F46E5 !important' : 'transparent',
                 color: trendRange === 'Today' ? '#ffffff !important' : '#4F46E5',
               }}
             >
               Today
             </Button>
             <Button
               onClick={() => { setTrendRange('7D'); setIsDateMode(false); setSelectedDate(dayjs()); }}
               disabled={isDateMode}
               sx={{
                 backgroundColor: trendRange === '7D' ? '#4F46E5 !important' : 'transparent',
                 color: trendRange === '7D' ? '#ffffff !important' : '#4F46E5',
               }}
             >
               Last 7 Days
             </Button>
             <Button
               onClick={() => { setTrendRange('30D'); setIsDateMode(false); setSelectedDate(dayjs()); }}
               disabled={isDateMode}
               sx={{
                 backgroundColor: trendRange === '30D' ? '#4F46E5 !important' : 'transparent',
                 color: trendRange === '30D' ? '#ffffff !important' : '#4F46E5',
               }}
             >
               Last 30 Days
             </Button>
          </ButtonGroup>
        </Box>

        {/* PAGE HEADER */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: '32px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Student Attendance Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track, analyze, and monitor overall student attendance.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <DatePicker
               label="Select Date"
               value={selectedDate}
               onChange={(newDate) => {
                 if (newDate) {
                   setSelectedDate(newDate);
                   setTrendRange('Today');
                   setIsDateMode(true);
                 }
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
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {[
            { label: 'Total Students', value: stats.total, subtitle: 'Registered Students', icon: Users, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
            { label: 'Total Present', value: stats.present, subtitle: 'Students Marked Present', icon: CheckCircle2, color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Total Absent', value: stats.absent, subtitle: 'Students Marked Absent', icon: XCircle, color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)' },
            { label: 'Attendance Rate', value: `${stats.rate}%`, subtitle: 'Overall Attendance %', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
            { label: 'On Leave', value: stats.leave, subtitle: 'Approved Leave', icon: Plane, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
            { label: 'Outing', value: stats.outing, subtitle: 'Temporary Exit', icon: OutingIcon, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
            { label: 'Late Entry', value: stats.late, subtitle: 'Reported Late', icon: Clock, color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)' },
            { label: 'Not Marked', value: stats.pending, subtitle: 'Attendance Pending', icon: HelpCircle, color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={i}
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
                      borderRadius: 3, 
                      backgroundColor: stat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                      mr: 2
                    }}
                  >
                    <Icon size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: { xs: '28px', sm: '32px' } }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {stat.subtitle}
                </Typography>
              </Card>
            );
          })}
        </Box>

        {/* SECTION 2: Weekly Analytics (Charts Row) */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Left: Weekly Attendance Trend */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {trendRange === 'Today' ? 'Today Attendance Trend (%)' : trendRange === '7D' ? 'Weekly Attendance Trend (%)' : 'Last 30 Days Attendance Trend (%)'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
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

          {/* Right: Attendance Distribution (Doughnut Chart) */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Attendance Distribution
            </Typography>
            <Box sx={{ flex: 1, position: 'relative', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {distributionData.map((entry, index) => (
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
              <Box 
                sx={{ 
                  position: 'absolute', 
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                  {distributionData.reduce((sum, item) => sum + item.value, 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {trendRange === 'Today' ? 'Students Today' : trendRange === '7D' ? 'Total (7 Days)' : 'Total (30 Days)'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {distributionData.map((item, idx) => {
                const totalDistVal = distributionData.reduce((sum, item) => sum + item.value, 0);
                return (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {item.name}: {item.value} ({totalDistVal > 0 ? Math.round((item.value / totalDistVal) * 100) : 0}%)
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Box>

        {/* SECTION 3: Academic Analytics */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Left: Course-wise Attendance */}
          <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Course-wise Attendance
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', flex: 1 }}>
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
                  {courseAttendanceData.map((row, idx) => (
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
          </Card>

          {/* Right: Year-wise Attendance */}
          <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Year-wise Attendance
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', flex: 1 }}>
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
                  {yearAttendanceData.map((row, idx) => (
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
          </Card>
        </Box>

        {/* SECTION 4: Hostel Analytics */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Left: Hostel Block-wise Attendance */}
          <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Hostel Block-wise Attendance
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', flex: 1 }}>
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
                  {blockAttendanceData.map((row, idx) => (
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
          </Card>

          {/* Right: Students Requiring Attention */}
          <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Students Requiring Attention
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
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Issue</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Attendance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {needAttentionStudentsData.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>{row.issue}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: row.rate < 75 ? '#DC2626' : 'text.primary' }}>
                        {row.rate}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* SECTION 5: Monthly Analytics */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: '24px', 
            mb: '32px',
            width: '100%'
          }}
        >
          {/* Left: Monthly Attendance Rate */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Monthly Attendance Rate (%)
            </Typography>
            <Box sx={{ flex: 1, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyRateDataComputed} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* Right: Recent Attendance Activity */}
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Attendance Activity
            </Typography>
            
            {/* Timeline Layout */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, flex: 1, overflowY: 'auto', minHeight: 320, maxHeight: 320 }}>
              {recentActivitiesData.map((activity, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: idx !== recentActivitiesData.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 65 }}>
                      {activity.time}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {activity.name} marked {activity.status}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${STATUS_COLORS[activity.status]?.dot} ${activity.status}`} 
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
          </Card>
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
              { title: 'View Monthly Attendance', icon: FileText, color: 'info' }
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

        {/* Feedback Alert Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
