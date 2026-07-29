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
  Chip,
  LinearProgress,
  ButtonGroup,
  Snackbar,
  Alert
} from '@mui/material';
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

// Mock Static Data for Trends & Analytics
const WEEKLY_TREND_7D = [
  { name: 'Mon', Present: 92, Absent: 5, Leave: 3 },
  { name: 'Tue', Present: 95, Absent: 3, Leave: 2 },
  { name: 'Wed', Present: 94, Absent: 4, Leave: 2 },
  { name: 'Thu', Present: 91, Absent: 6, Leave: 3 },
  { name: 'Fri', Present: 89, Absent: 8, Leave: 3 },
  { name: 'Sat', Present: 85, Absent: 12, Leave: 3 },
  { name: 'Sun', Present: 88, Absent: 9, Leave: 3 }
];

const WEEKLY_TREND_30D = [
  { name: 'W1', Present: 91, Absent: 6, Leave: 3 },
  { name: 'W2', Present: 93, Absent: 4, Leave: 3 },
  { name: 'W3', Present: 92, Absent: 5, Leave: 3 },
  { name: 'W4', Present: 94, Absent: 3, Leave: 3 }
];

const WEEKLY_TREND_TODAY = [
  { name: '08:00', Present: 85, Absent: 10, Leave: 5 },
  { name: '10:00', Present: 90, Absent: 7, Leave: 3 },
  { name: '12:00', Present: 92, Absent: 5, Leave: 3 },
  { name: '14:00', Present: 94, Absent: 3, Leave: 3 }
];

const COURSE_ATTENDANCE = [
  { course: 'Computer Science (CSE)', present: 112, absent: 8, rate: 93 },
  { course: 'Electronics (ECE)', present: 54, absent: 6, rate: 90 },
  { course: 'Mechanical (ME)', present: 42, absent: 8, rate: 84 },
  { course: 'Civil (CE)', present: 22, absent: 6, rate: 78 },
  { course: 'Business (BBA)', present: 15, absent: 7, rate: 68 }
];

const YEAR_ATTENDANCE = [
  { year: '1st Year', present: 68, absent: 12, rate: 85 },
  { year: '2nd Year', present: 72, absent: 8, rate: 90 },
  { year: '3rd Year', present: 64, absent: 6, rate: 91 },
  { year: '4th Year', present: 41, absent: 9, rate: 82 }
];

const BLOCK_ATTENDANCE = [
  { block: 'Block A', present: 95, absent: 5, rate: 95 },
  { block: 'Block B', present: 88, absent: 12, rate: 88 },
  { block: 'Block C', present: 62, absent: 18, rate: 77 }
];

const NEED_ATTENTION_STUDENTS = [
  { name: 'Rohit Sharma', issue: 'Attendance Below 75%', rate: 68 },
  { name: 'Priya Verma', issue: '3 Consecutive Absences', rate: 72 },
  { name: 'Amit Singh', issue: 'Frequent Late Entry', rate: 74 },
  { name: 'Kunal Sen', issue: 'Long Pending Leave', rate: 64 }
];

const MONTHLY_RATE_DATA = [
  { name: 'Jan', rate: 92 },
  { name: 'Feb', rate: 94 },
  { name: 'Mar', rate: 91 },
  { name: 'Apr', rate: 93 },
  { name: 'May', rate: 95 },
  { name: 'Jun', rate: 89 },
  { name: 'Jul', rate: 87 },
  { name: 'Aug', rate: 90 },
  { name: 'Sep', rate: 92 },
  { name: 'Oct', rate: 94 },
  { name: 'Nov', rate: 93 },
  { name: 'Dec', rate: 95 }
];

const RECENT_ACTIVITIES = [
  { time: '09:05 AM', name: 'Sanket Bhujbal', status: 'Present' },
  { time: '09:12 AM', name: 'Emily Doe', status: 'Late' },
  { time: '09:18 AM', name: 'Rahul Sharma', status: 'Absent' },
  { time: '09:40 AM', name: 'Priya Patel', status: 'Outing' },
  { time: '10:02 AM', name: 'Amit Desai', status: 'Present' },
  { time: '10:15 AM', name: 'Kavya Joshi', status: 'Leave' },
  { time: '10:30 AM', name: 'Rohan Mehta', status: 'Present' },
  { time: '11:00 AM', name: 'Neha Verma', status: 'Present' },
  { time: '11:15 AM', name: 'Vihaan Gupta', status: 'Late' },
  { time: '11:45 AM', name: 'Aditi Singh', status: 'Absent' }
];

export default function StudentAttendancePage() {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [trendRange, setTrendRange] = useState('7D');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load students from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hostel_students');
      if (saved) {
        setStudents(JSON.parse(saved));
      } else {
        const defaultStudents = [
          { id: 'STU-1000', name: 'Sanket Bhujbal', regNo: 'CSE23001', room: 'A-101', course: 'CSE', year: '3rd' },
          { id: 'STU-1001', name: 'Aarav Sharma', regNo: 'ECE23002', room: 'B-202', course: 'ECE', year: '2nd' },
          { id: 'STU-1002', name: 'Neha Gupta', regNo: 'ME23003', room: 'C-303', course: 'ME', year: '1st' },
          { id: 'STU-1003', name: 'Amit Singh', regNo: 'CE23004', room: 'A-102', course: 'CE', year: '1st' },
          { id: 'STU-1004', name: 'Priya Verma', regNo: 'BBA23005', room: 'B-204', course: 'BBA', year: '2nd' },
          { id: 'STU-1005', name: 'Kunal Sen', regNo: 'CSE23006', room: 'C-102', course: 'CSE', year: '4th' }
        ];
        setStudents(defaultStudents);
        localStorage.setItem('hostel_students', JSON.stringify(defaultStudents));
      }
    } catch (e) {
      console.error('Failed to load students', e);
    }
  }, []);

  // Load attendance records for selected date
  useEffect(() => {
    if (students.length === 0) return;
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    try {
      const savedAttendance = localStorage.getItem('hostel_student_attendance_records');
      const allRecords = savedAttendance ? JSON.parse(savedAttendance) : {};
      
      if (allRecords[dateStr]) {
        setAttendance(allRecords[dateStr]);
      } else {
        const newDayAttendance = {};
        students.forEach(student => {
          const currentStatus = student.status || 'Present';
          newDayAttendance[student.id] = ['Present', 'Absent', 'Late', 'Leave', 'Outing'].includes(currentStatus) 
            ? currentStatus 
            : 'Present';
        });
        setAttendance(newDayAttendance);
      }
    } catch (e) {
      console.error('Failed to load attendance records', e);
    }
  }, [selectedDate, students]);

  // Dynamic calculations for all 8 stats cards
  const stats = useMemo(() => {
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
      present,
      absent,
      rate,
      leave,
      outing,
      late,
      pending
    };
  }, [students, attendance]);

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
    if (trendRange === '30D') return WEEKLY_TREND_30D;
    if (trendRange === 'Today') return WEEKLY_TREND_TODAY;
    return WEEKLY_TREND_7D;
  }, [trendRange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4, width: '100%', display: 'block' }}>
        
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
            { label: 'Present Today', value: stats.present, subtitle: 'Students Marked Present', icon: CheckCircle2, color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Absent Today', value: stats.absent, subtitle: 'Students Marked Absent', icon: XCircle, color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)' },
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
                Weekly Attendance Trend (%)
              </Typography>
              <ButtonGroup size="small">
                <Button 
                  variant={trendRange === 'Today' ? 'contained' : 'outlined'} 
                  onClick={() => setTrendRange('Today')}
                  sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: trendRange === 'Today' ? '#4F46E5' : 'transparent' }}
                >
                  Today
                </Button>
                <Button 
                  variant={trendRange === '7D' ? 'contained' : 'outlined'} 
                  onClick={() => setTrendRange('7D')}
                  sx={{ textTransform: 'none', backgroundColor: trendRange === '7D' ? '#4F46E5' : 'transparent' }}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant={trendRange === '30D' ? 'contained' : 'outlined'} 
                  onClick={() => setTrendRange('30D')}
                  sx={{ textTransform: 'none', borderRadius: 2, backgroundColor: trendRange === '30D' ? '#4F46E5' : 'transparent' }}
                >
                  Last 30 Days
                </Button>
              </ButtonGroup>
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
                  {stats.total}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Students Today
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {distributionData.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {item.name}: {item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                  </Typography>
                </Box>
              ))}
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
                  {NEED_ATTENTION_STUDENTS.map((row, idx) => (
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
                <BarChart data={MONTHLY_RATE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              {RECENT_ACTIVITIES.map((activity, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: idx !== RECENT_ACTIVITIES.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
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
