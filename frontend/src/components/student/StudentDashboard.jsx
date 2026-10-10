import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Skeleton,
} from '@mui/material';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { students as studentsApi, complaints as complaintsApi } from '../../api';

import StudentWelcomeHeader from './StudentWelcomeHeader';
import StudentSummaryCards from './StudentSummaryCards';
import AttendanceOverview from './AttendanceOverview';
import StudentFinanceSummary from './StudentFinanceSummary';
import RecentActivity from './RecentActivity';
import HostelUpdatesSection from './HostelUpdatesSection';
import StudentQuickActions from './StudentQuickActions';
import StudentPaymentModal from './StudentPaymentModal';
import StudentRoomDetailsModal from './StudentRoomDetailsModal';

// Numeric converter to prevent string concatenation bugs with Sequelize DECIMALs
const toAmount = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

export default function StudentDashboard() {
  const { user } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [complaintsData, setComplaintsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  // Load Razorpay checkout script on mount
  useEffect(() => {
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch real student data & complaints
  const fetchData = useCallback(async () => {
    if (!user || !user.studentId) {
      setLoading(false);
      setError('Student profile not associated with this account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [studentRes, complaintsRes] = await Promise.allSettled([
        studentsApi.getById(user.studentId),
        complaintsApi.listMine(),
      ]);

      if (studentRes.status === 'fulfilled' && studentRes.value?.data) {
        setStudentData(studentRes.value.data);
      } else {
        throw new Error(studentRes.reason?.message || 'Failed to load student details');
      }

      if (complaintsRes.status === 'fulfilled' && complaintsRes.value?.data) {
        setComplaintsData(complaintsRes.value.data);
      } else {
        setComplaintsData([]);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
      setError(err.message || 'Unable to load student dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Financial Calculation (Finance Service Source of Truth) ────────────────
  const financeStats = useMemo(() => {
    if (!studentData) {
      return { totalBillable: 0, totalPaid: 0, balanceDue: 0, paymentStatus: 'Pending' };
    }

    const totalBillable = toAmount(studentData.totalBillable);
    const successfulPayments = (studentData.payments || []).filter(p => p.status === 'Success');
    const totalPaid = successfulPayments.reduce((sum, p) => sum + toAmount(p.amount), 0);
    const balanceDue = Math.max(0, totalBillable - totalPaid);

    let paymentStatus = 'Pending';
    if (totalPaid === 0) {
      paymentStatus = 'Pending';
    } else if (balanceDue === 0) {
      paymentStatus = 'Paid';
    } else {
      paymentStatus = 'Partial';
    }

    return {
      totalBillable,
      totalPaid,
      balanceDue,
      paymentStatus,
    };
  }, [studentData]);

  // ── Attendance Calculation ──────────────────────────────────────────────────
  const attendanceStats = useMemo(() => {
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
      };
    }

    const presentCount = attendances.filter(a => ['Present', 'Late', 'Outing'].includes(a.status)).length;
    const absentCount = attendances.filter(a => a.status === 'Absent').length;
    const leaveCount = attendances.filter(a => a.status === 'Leave').length;
    const lateCount = attendances.filter(a => a.status === 'Late').length;
    const outingCount = attendances.filter(a => a.status === 'Outing').length;
    const totalDays = attendances.filter(a => a.status !== 'Not Marked').length || attendances.length;
    const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

    return {
      percentage,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      outingCount,
      totalDays,
    };
  }, [studentData]);

  // ── Complaints Calculation ──────────────────────────────────────────────────
  const complaintStats = useMemo(() => {
    const total = complaintsData.length;
    const pending = complaintsData.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;
    const resolved = complaintsData.filter(c => c.status === 'Resolved').length;
    return { total, pending, resolved };
  }, [complaintsData]);

  // ── Recent Activity Aggregation ─────────────────────────────────────────────
  const activities = useMemo(() => {
    const items = [];

    // 1. Successful Payments
    (studentData?.payments || [])
      .filter(p => p.status === 'Success')
      .forEach(p => {
        const rawDate = p.paymentDate || p.createdAt;
        items.push({
          type: 'payment',
          title: `Payment of ₹${Number(p.amount || 0).toLocaleString('en-IN')} recorded`,
          subtitle: p.receiptNo ? `Receipt: ${p.receiptNo}` : 'Online Payment',
          date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: new Date(rawDate || 0).getTime(),
          status: 'Success',
        });
      });

    // 2. Attendance Records (Last 5)
    (studentData?.attendances || [])
      .filter(a => a.status && a.status !== 'Not Marked')
      .forEach(a => {
        const rawDate = a.attendanceDate || a.createdAt;
        items.push({
          type: 'attendance',
          title: `Attendance marked ${a.status}`,
          subtitle: 'Daily Roll Call',
          date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: new Date(rawDate || 0).getTime(),
          status: a.status,
        });
      });

    // 3. Complaints
    complaintsData.forEach(c => {
      const rawDate = c.updatedAt || c.createdAt;
      items.push({
        type: 'complaint',
        title: `Complaint ${c.complaintNumber || ''}: ${c.category || 'General'}`,
        subtitle: c.title || 'Student issue reported',
        date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        timestamp: new Date(rawDate || 0).getTime(),
        status: c.status,
      });
    });

    // 4. Payment Due Reminder if pending
    if (financeStats.balanceDue > 0) {
      items.push({
        type: 'warning',
        title: `Fee Balance Due: ₹${financeStats.balanceDue.toLocaleString('en-IN')}`,
        subtitle: 'Hostel Accommodation Dues',
        date: 'Action Required',
        timestamp: Date.now() + 1000, // keep near top
        status: 'Pending',
      });
    }

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [studentData, complaintsData, financeStats.balanceDue]);

  // ── Dynamic Notices (Notices derived from real student context) ─────────────
  const dynamicNotices = useMemo(() => {
    const notices = [];

    if (financeStats.balanceDue > 0) {
      notices.push({
        title: 'Fee Payment Reminder',
        description: `You have an outstanding fee balance of ₹${financeStats.balanceDue.toLocaleString('en-IN')}. Please clear dues at your earliest convenience.`,
        tag: 'Finance',
        isUrgent: financeStats.paymentStatus === 'Pending',
      });
    }

    if (attendanceStats.totalDays >= 3 && attendanceStats.percentage < 75) {
      notices.push({
        title: 'Attendance Alert',
        description: `Your overall attendance is currently ${attendanceStats.percentage}%, which is below the mandatory 75% threshold.`,
        tag: 'Attendance',
        isUrgent: true,
      });
    }

    return notices;
  }, [financeStats, attendanceStats]);

  // ── Loading Skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 4, mb: 4 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 4 }} />
        </Box>
      </Box>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error || !studentData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error || 'Unable to load student dashboard information.'}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchData}
          startIcon={<RotateCcw size={18} />}
          sx={{ backgroundColor: '#4F46E5', borderRadius: 2.5 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* 1. Personalized Welcome Header */}
      <StudentWelcomeHeader
        student={studentData}
        balanceDue={financeStats.balanceDue}
        onPayNow={() => setPaymentModalOpen(true)}
      />

      {/* 2. Five Summary Cards */}
      <StudentSummaryCards
        student={studentData}
        attendanceStats={attendanceStats}
        financeStats={financeStats}
        complaintStats={complaintStats}
        updates={[]} // Ready for backend announcements when added
        dynamicNotices={dynamicNotices}
        onRoomClick={() => setRoomModalOpen(true)}
      />

      {/* 3 & 4. Attendance Overview + Finance Summary */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <AttendanceOverview
          attendanceStats={attendanceStats}
          todayStatus={studentData.attendanceStatus || studentData.status}
        />
        <StudentFinanceSummary
          financeStats={financeStats}
          onPayNow={() => setPaymentModalOpen(true)}
        />
      </Box>

      {/* 5. Recent Activity + Hostel Updates */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <RecentActivity activities={activities} />
        <HostelUpdatesSection updates={[]} dynamicNotices={dynamicNotices} />
      </Box>

      {/* 6. Quick Actions */}
      <Box sx={{ mb: 2 }}>
        <StudentQuickActions
          onPayNow={() => setPaymentModalOpen(true)}
          onOpenRoomDetails={() => setRoomModalOpen(true)}
          balanceDue={financeStats.balanceDue}
        />
      </Box>

      {/* Reusable Razorpay Payment Modal */}
      <StudentPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        studentId={studentData.id}
        studentName={`${studentData.firstName || ''} ${studentData.lastName || ''}`.trim()}
        userEmail={user.email}
        balanceDue={financeStats.balanceDue}
        onPaymentSuccess={fetchData}
      />

      {/* Student Room Details Overlay Modal */}
      <StudentRoomDetailsModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        allocation={(studentData?.allocations || []).find(a => a.status === 'active') || (studentData?.allocations || [])[0]}
        currentStudent={studentData}
      />
    </Box>
  );
}
