import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Plane,
  Clock,
  LogOut as OutingIcon,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeft,
  ClipboardList,
  Sparkles,
  User,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { students as studentsApi } from '../api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Cell,
} from 'recharts';

const INDIGO = '#4F46E5';
const INDIGO_HOVER = '#4338CA';

const STATUS_CONFIG = {
  Present: { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)', icon: CheckCircle2, label: 'Present', dot: '🟢' },
  Absent:  { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', icon: XCircle,      label: 'Absent',  dot: '🔴' },
  Leave:   { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)',  icon: Plane,        label: 'Leave',   dot: '🔵' },
  Outing:  { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: OutingIcon,   label: 'Outing',  dot: '🟡' },
  Late:    { color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)',  icon: Clock,        label: 'Late',    dot: '🟠' },
};

export default function StudentPersonalAttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id, studentId } = useParams();
  const [searchParams] = useSearchParams();

  const isStaff = user?.role === 'admin' || user?.role === 'rector';
  const queryStudentId = searchParams.get('studentId');
  const targetStudentId = isStaff
    ? (id || studentId || queryStudentId || user?.studentId)
    : user?.studentId;

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar month state (default to current year and month)
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const fetchAttendance = useCallback(async () => {
    if (!targetStudentId) {
      setLoading(false);
      setError('Student profile not found.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await studentsApi.getById(targetStudentId);
      if (res?.data) {
        setStudentData(res.data);
      } else {
        throw new Error('Could not retrieve student attendance records.');
      }
    } catch (err) {
      console.error('Failed to load student attendance:', err);
      setError(err.message || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [targetStudentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Calculated Attendance Statistics ──────────────────────────────────────
  const stats = useMemo(() => {
    const attendances = studentData?.attendances || [];
    if (attendances.length === 0) {
      return {
        percentage: 0,
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        lateCount: 0,
        outingCount: 0,
        totalDays: 0,
        hasRecords: false,
      };
    }

    const presentCount = attendances.filter(a => ['Present', 'Late', 'Outing'].includes(a.status)).length;
    const strictPresent = attendances.filter(a => a.status === 'Present').length;
    const absentCount = attendances.filter(a => a.status === 'Absent').length;
    const leaveCount = attendances.filter(a => a.status === 'Leave').length;
    const lateCount = attendances.filter(a => a.status === 'Late').length;
    const outingCount = attendances.filter(a => a.status === 'Outing').length;
    const validAttendances = attendances.filter(a => a.status && a.status !== 'Not Marked');
    const totalDays = validAttendances.length || attendances.length;
    const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

    return {
      percentage,
      presentCount,
      strictPresent,
      absentCount,
      leaveCount,
      lateCount,
      outingCount,
      totalDays,
      hasRecords: totalDays > 0,
    };
  }, [studentData]);

  // ── Monthly Attendance Data for Current Year ──────────────────────────────
  const monthlyAttendanceData = useMemo(() => {
    const attendances = studentData?.attendances || [];
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthNames.map((name, idx) => {
      const monthStr = String(idx + 1).padStart(2, '0');
      const monthPrefix = `${currentYear}-${monthStr}`;

      const recordsInMonth = attendances.filter(a =>
        a.attendanceDate && a.attendanceDate.startsWith(monthPrefix) && a.status !== 'Not Marked'
      );

      if (recordsInMonth.length === 0) {
        return { name, rate: 0, total: 0, present: 0 };
      }

      const presentInMonth = recordsInMonth.filter(a => ['Present', 'Late', 'Outing'].includes(a.status)).length;
      const rate = Math.round((presentInMonth / recordsInMonth.length) * 100);

      return {
        name,
        rate,
        total: recordsInMonth.length,
        present: presentInMonth,
      };
    });
  }, [studentData]);

  // ── Recent Attendance Records (Sorted newest first) ───────────────────────
  const recentRecords = useMemo(() => {
    const attendances = studentData?.attendances || [];
    return [...attendances]
      .filter(a => a.status && a.status !== 'Not Marked')
      .sort((a, b) => {
        const dateA = new Date(a.attendanceDate || a.createdAt || 0);
        const dateB = new Date(b.attendanceDate || b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 7);
  }, [studentData]);

  // ── Attendance Map by Date String (YYYY-MM-DD) for Calendar ──────────────
  const attendanceDateMap = useMemo(() => {
    const map = {};
    (studentData?.attendances || []).forEach(a => {
      if (a.attendanceDate && a.status && a.status !== 'Not Marked') {
        map[a.attendanceDate] = a.status;
      }
    });
    return map;
  }, [studentData]);

  // ── Calendar Calculations for Selected Month ──────────────────────────────
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty slots before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ blank: true, key: `blank-${i}` });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const status = attendanceDateMap[dateKey] || null;

      days.push({
        blank: false,
        dayNumber: d,
        dateKey,
        status,
        key: dateKey,
      });
    }

    return days;
  }, [calendarDate, attendanceDateMap]);

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCalendarDate(new Date());
  };

  // Student header info string
  const studentName = studentData ? `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() : 'Student';
  const regNo = studentData?.registrationNumber || null;
  const course = studentData?.courseDetails?.name || studentData?.course || null;
  const year = studentData?.yearOfStudy || studentData?.year || null;
  const headerSubtitle = [studentName, regNo, course, year].filter(Boolean).join(' • ');

  // Loading state
  if (loading) {
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4, mb: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 4, mb: 4 }} />
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4, mb: 4 }} />
      </Box>
    );
  }

  // Error state
  if (error || !studentData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
          {error || 'Unable to load attendance records.'}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchAttendance}
          startIcon={<RotateCcw size={18} />}
          sx={{ backgroundColor: INDIGO, borderRadius: 2.5 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4 }}>
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => navigate(isStaff ? -1 : '/dashboard')} size="small" sx={{ mr: 0.5, border: '1px solid', borderColor: 'divider' }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
              Student Attendance
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {isStaff ? (studentData ? `Viewing attendance records for ${studentName}.` : 'Viewing student attendance records.') : 'Track your attendance and attendance history.'}
          </Typography>
          {headerSubtitle && (
            <Typography variant="body2" sx={{ color: INDIGO, fontWeight: 600, mt: 0.5 }}>
              {headerSubtitle}
            </Typography>
          )}
        </Box>

        <Button
          variant="outlined"
          onClick={fetchAttendance}
          startIcon={<RotateCcw size={16} />}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            borderRadius: 2.5,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { borderColor: INDIGO, backgroundColor: 'rgba(79, 70, 229, 0.05)' },
          }}
        >
          Refresh Attendance
        </Button>
      </Box>

      {/* ── 2. Top Summary Cards (Exactly 4 Cards) ─────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Card 1: Attendance Rate */}
        <Card
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
              }}
            >
              <CalendarCheck size={22} />
            </Box>
            <Chip
              label={stats.totalDays === 0 ? 'No Data' : stats.percentage >= 75 ? 'Good' : 'Low'}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: stats.totalDays === 0 ? 'rgba(100, 116, 139, 0.1)' : stats.percentage >= 75 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: stats.totalDays === 0 ? '#64748B' : stats.percentage >= 75 ? '#16A34A' : '#DC2626',
              }}
            />
          </Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
            ATTENDANCE RATE
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            {stats.totalDays > 0 ? `${stats.percentage}%` : '—'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Overall attendance
          </Typography>
        </Card>

        {/* Card 2: Present */}
        <Card
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
              }}
            >
              <CheckCircle2 size={22} />
            </Box>
            <Chip
              label="Present"
              size="small"
              sx={{ fontWeight: 600, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}
            />
          </Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
            PRESENT
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#16A34A' }}>
            {stats.presentCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Days present
          </Typography>
        </Card>

        {/* Card 3: Absent */}
        <Card
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}
            >
              <XCircle size={22} />
            </Box>
            <Chip
              label="Absent"
              size="small"
              sx={{ fontWeight: 600, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
            />
          </Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
            ABSENT
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#DC2626' }}>
            {stats.absentCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Days absent
          </Typography>
        </Card>

        {/* Card 4: Leave / Other */}
        <Card
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <Plane size={22} />
            </Box>
            <Chip
              label="Leave"
              size="small"
              sx={{ fontWeight: 600, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}
            />
          </Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
            LEAVE
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#2563EB' }}>
            {stats.leaveCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Approved leave
          </Typography>
        </Card>
      </Box>

      {/* ── 3. Attendance Status Card ───────────────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Attendance Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Minimum 75% attendance required for hostel compliance
            </Typography>
          </Box>
          <Chip
            label={
              stats.totalDays === 0
                ? 'No Records'
                : stats.percentage >= 75
                ? 'Good Attendance'
                : stats.percentage >= 60
                ? 'Attendance Needs Attention'
                : 'Low Attendance — Improve Your Attendance'
            }
            sx={{
              fontWeight: 700,
              fontSize: '0.85rem',
              py: 2,
              px: 1,
              backgroundColor:
                stats.totalDays === 0
                  ? 'rgba(100, 116, 139, 0.1)'
                  : stats.percentage >= 75
                  ? 'rgba(22, 163, 74, 0.1)'
                  : stats.percentage >= 60
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(220, 38, 38, 0.1)',
              color:
                stats.totalDays === 0
                  ? '#64748B'
                  : stats.percentage >= 75
                  ? '#16A34A'
                  : stats.percentage >= 60
                  ? '#D97706'
                  : '#DC2626',
            }}
          />
        </Box>

        {/* Progress Bar & Metric */}
        <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Overall Attendance
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: stats.percentage >= 75 ? '#16A34A' : stats.percentage >= 60 ? '#D97706' : '#DC2626' }}>
              {stats.totalDays > 0 ? `${stats.percentage}%` : '0%'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.totalDays > 0 ? Math.min(stats.percentage, 100) : 0}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                backgroundColor: stats.percentage >= 75 ? '#16A34A' : stats.percentage >= 60 ? '#D97706' : '#DC2626',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {stats.totalDays > 0 ? `${stats.presentCount} present out of ${stats.totalDays} recorded days` : '0 records logged yet'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Threshold: 75%
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* ── 4. Monthly Attendance Trend Chart ──────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Monthly Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your attendance percentage across each month of {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Box
                        sx={{
                          backgroundColor: 'background.paper',
                          p: 1.5,
                          borderRadius: 2,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {label} {new Date().getFullYear()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: data.rate >= 75 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                          Rate: {data.rate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {data.present} present / {data.total} recorded days
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {monthlyAttendanceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.total === 0 ? '#CBD5E1' : entry.rate >= 75 ? '#16A34A' : '#DC2626'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* ── 5 & 6. Attendance Breakdown + Recent Attendance Grid ───────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Attendance Breakdown */}
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Attendance Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status-wise summary of all recorded sessions
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 'auto' }}>
            {[
              { label: 'Present', count: stats.presentCount, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
              { label: 'Absent', count: stats.absentCount, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
              { label: 'Leave', count: stats.leaveCount, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
              { label: 'Outing', count: stats.outingCount, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
              { label: 'Late', count: stats.lateCount, color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' },
            ].map(({ label, count, color, bg }) => {
              const share = stats.totalDays > 0 ? Math.round((count / stats.totalDays) * 100) : 0;
              return (
                <Box key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                      {count} ({share}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={share}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: color,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Recent Attendance */}
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
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Recent Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest recorded attendance entries
            </Typography>
          </Box>

          {recentRecords.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', my: 'auto' }}>
              <CalendarIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No attendance records yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 'auto' }}>
              {recentRecords.map((rec, idx) => {
                const cfg = STATUS_CONFIG[rec.status] || { color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: CheckCircle2, label: rec.status || 'Marked' };
                const Icon = cfg.icon;
                const dateFormatted = rec.attendanceDate
                  ? new Date(rec.attendanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Recent Date';

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2.5,
                      backgroundColor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: cfg.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cfg.color,
                        }}
                      >
                        <Icon size={16} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {dateFormatted}
                      </Typography>
                    </Box>
                    <Chip
                      label={rec.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: cfg.bg,
                        color: cfg.color,
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>
      </Box>

      {/* ── 7. Attendance Calendar (Current Month) ─────────────────────────── */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Attendance Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily status for {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" onClick={handleCurrentMonth} sx={{ color: INDIGO, fontWeight: 600, textTransform: 'none' }}>
              Today
            </Button>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ChevronLeft size={16} />
            </IconButton>
            <IconButton size="small" onClick={handleNextMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ChevronRight size={16} />
            </IconButton>
          </Box>
        </Box>

        {/* Days of Week Header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center', mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Typography key={d} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {d}
            </Typography>
          ))}
        </Box>

        {/* Days Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {calendarDays.map(item => {
            if (item.blank) {
              return <Box key={item.key} sx={{ height: 44 }} />;
            }

            const cfg = item.status ? STATUS_CONFIG[item.status] : null;
            return (
              <Tooltip key={item.key} title={item.status ? `${item.dateKey}: ${item.status}` : `${item.dateKey}: Not Marked`} arrow>
                <Box
                  sx={{
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cfg ? cfg.bg : 'background.default',
                    border: '1px solid',
                    borderColor: cfg ? cfg.color + '40' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: INDIGO,
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: cfg ? 700 : 500, color: cfg ? cfg.color : 'text.primary', lineHeight: 1 }}>
                    {item.dayNumber}
                  </Typography>
                  {cfg && (
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: cfg.color,
                        mt: 0.5,
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Calendar Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.color }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {cfg.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* ── 8. Quick Actions ───────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: INDIGO,
            }}
          >
            <Sparkles size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Attendance related requests and shortcuts
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(isStaff ? -1 : '/dashboard')}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              py: 1.25,
              borderRadius: 2.5,
              backgroundColor: INDIGO,
              '&:hover': { backgroundColor: INDIGO_HOVER },
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {isStaff ? 'Back' : 'Back to Dashboard'}
          </Button>

          {isStaff ? (
            <Button
              variant="outlined"
              onClick={() => navigate(`/students/${targetStudentId}`)}
              startIcon={<User size={18} />}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: INDIGO, backgroundColor: 'rgba(79, 70, 229, 0.05)' },
              }}
            >
              View Student Profile
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/complaints/raise')}
              startIcon={<ClipboardList size={18} />}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: INDIGO, backgroundColor: 'rgba(79, 70, 229, 0.05)' },
              }}
            >
              Raise Attendance Query
            </Button>
          )}

          {isStaff ? (
            <Button
              variant="outlined"
              onClick={() => navigate('/attendance/student')}
              startIcon={<CalendarCheck size={18} />}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: INDIGO, backgroundColor: 'rgba(79, 70, 229, 0.05)' },
              }}
            >
              Attendance Overview
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/finances')}
              startIcon={<CalendarCheck size={18} />}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: INDIGO, backgroundColor: 'rgba(79, 70, 229, 0.05)' },
              }}
            >
              View Student Finances
            </Button>
          )}
        </Box>
      </Card>
    </Box>
  );
}
