import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import StudentStats from '../components/students/StudentStats';
import StudentFilters from '../components/students/StudentFilters';
import StudentTable from '../components/students/StudentTable';
import AddStudentDrawer from '../components/students/AddStudentDrawer';
import { students as studentsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useRoomContext } from '../contexts/RoomContext';

export default function StudentsPage() {
  const { user } = useAuth();
  const isRector = user?.role === 'rector';
  const isAdmin  = user?.role === 'admin';
  const { blocks } = useRoomContext();   // for block filter dropdown

  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    block: 'All',
    course: 'All',
    year: 'All',
    status: 'All',
  });

  // ── Fetch from backend ────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsApi.list();
      // Normalise backend shape → UI shape
      const normalised = (res.data || []).map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        regNo: s.registrationNumber,
        email: s.email,
        course: s.course,
        year: s.year,
        status: s.status,
        // pick room number from the first active allocation if available
        room: s.allocations?.[0]?.room?.number || '—',
      }));
      setStudentList(normalised);
    } catch (err) {
      setSnackbar({ open: true, message: `Failed to load students: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const handleResetFilters = () =>
    setFilters({ search: '', block: 'All', course: 'All', year: 'All', status: 'All' });

  const filteredStudents = useMemo(() => {
    return (studentList || []).filter(student => {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(search) ||
        student.regNo.toLowerCase().includes(search) ||
        (student.room || '').toLowerCase().includes(search);

      // Block filter — room starts with the block prefix e.g. "A101" starts with "A"
      // Block names are stored as "BLOCK A", prefix is the last char / after "BLOCK "
      const matchesBlock = (() => {
        if (filters.block === 'All') return true;
        const prefix = filters.block.replace(/^BLOCK\s*/i, '').trim().toUpperCase();
        return String(student.room || '').toUpperCase().startsWith(prefix);
      })();

      const matchesCourse = filters.course === 'All' || student.course === filters.course;
      const matchesYear   = filters.year   === 'All' || student.year   === filters.year;
      const matchesStatus = filters.status === 'All' || student.status === filters.status;
      return matchesSearch && matchesBlock && matchesCourse && matchesYear && matchesStatus;
    });
  }, [studentList, filters]);

  // ── Add student ───────────────────────────────────────────────────────────
  const handleAddStudent = async (newStudentData) => {
    // yup.date() coerces the dayjs value to a native Date object.
    // We must format it explicitly — dayjs wraps both dayjs and Date objects safely.
    const dobRaw = newStudentData.dob;
    let dateOfBirth = '';
    if (dobRaw && typeof dobRaw.format === 'function') {
      // still a dayjs object (shouldn't happen after yup, but safe fallback)
      dateOfBirth = dobRaw.format('YYYY-MM-DD');
    } else if (dobRaw instanceof Date && !isNaN(dobRaw)) {
      // yup coerced it to a JS Date — format manually without timezone shift
      const y = dobRaw.getFullYear();
      const m = String(dobRaw.getMonth() + 1).padStart(2, '0');
      const d = String(dobRaw.getDate()).padStart(2, '0');
      dateOfBirth = `${y}-${m}-${d}`;
    } else {
      dateOfBirth = String(dobRaw || '').slice(0, 10); // ISO string fallback
    }

    const admDateRaw = newStudentData.admissionDate;
    let admissionDate = null;
    if (admDateRaw && typeof admDateRaw.format === 'function') {
      admissionDate = admDateRaw.format('YYYY-MM-DD');
    } else if (admDateRaw instanceof Date && !isNaN(admDateRaw)) {
      const y = admDateRaw.getFullYear();
      const m = String(admDateRaw.getMonth() + 1).padStart(2, '0');
      const d = String(admDateRaw.getDate()).padStart(2, '0');
      admissionDate = `${y}-${m}-${d}`;
    } else if (admDateRaw) {
      admissionDate = String(admDateRaw).slice(0, 10);
    }

    try {
      await studentsApi.create({
        registrationNumber: newStudentData.regNo,
        firstName:          newStudentData.firstName,
        lastName:           newStudentData.lastName,
        gender:             newStudentData.gender,
        dateOfBirth,
        email:              newStudentData.email.trim().toLowerCase(),
        phone:              newStudentData.phone,
        address:            newStudentData.address,
        department:         newStudentData.department,
        course:             newStudentData.course,
        year:               newStudentData.year,
        admissionDate,
        guardianName:         newStudentData.parentName,
        guardianRelationship: newStudentData.relationship,
        guardianPhone:        newStudentData.parentPhone,
        guardianEmail:        newStudentData.parentEmail || null,
        status:               newStudentData.status,
        allocation: {
          roomNumber:  newStudentData.roomNumber,
          bedNumber:   newStudentData.bedNumber,
          allocatedAt: newStudentData.allocationDate?.format?.('YYYY-MM-DD') || newStudentData.allocationDate,
        },
      });

      await fetchStudents(); // refresh from DB so room is up-to-date
      setSnackbar({ open: true, message: 'Student added successfully!', severity: 'success' });
      return { success: true };
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Student could not be saved.', severity: 'error' });
      return { success: false, message: error.message };
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(s => ({ ...s, open: false }));
  };

  // ── Rector: update student attendance status ──────────────────────────────
  const handleStatusChange = async (studentId, newStatus) => {
    // Optimistic update
    setStudentList(prev =>
      prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
    );
    try {
      await studentsApi.updateStatus(studentId, newStatus);
    } catch (err) {
      // Revert on failure
      await fetchStudents();
      setSnackbar({ open: true, message: `Failed to update status: ${err.message}`, severity: 'error' });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Students Directory
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
      ) : (
        <>
          <StudentStats students={studentList} />

          <StudentFilters
            filters={filters}
            setFilters={setFilters}
            onReset={handleResetFilters}
            onAddClick={() => setIsDrawerOpen(true)}
            blocks={blocks}
            isRector={isRector}
          />

          <StudentTable
            students={filteredStudents}
            isRector={isRector}
            isAdmin={isAdmin}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

      <AddStudentDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleAddStudent}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
