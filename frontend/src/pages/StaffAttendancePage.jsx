import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
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
  InputAdornment,
  Snackbar,
  Alert,
  Avatar
} from '@mui/material';
import { 
  Search, 
  Check, 
  X, 
  Clock, 
  Plane, 
  Save, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: 'Present', color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', icon: Check, label: 'Present' },
  { value: 'Absent', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', icon: X, label: 'Absent' },
  { value: 'Late', color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)', icon: Clock, label: 'Late' },
  { value: 'Leave', color: '#2563EB', bg: 'rgba(59, 130, 246, 0.1)', icon: Plane, label: 'Leave' }
];

export default function StaffAttendancePage() {
  const [staff, setStaff] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load staff from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hostel_staff');
      if (saved) {
        setStaff(JSON.parse(saved));
      } else {
        const defaultStaff = [
          { staffId: 'STF-001', name: 'Rajesh Patil', designation: 'Warden', assignedBlock: 'Block A', phone: '9876543210' },
          { staffId: 'STF-002', name: 'Ramesh Kumar', designation: 'Security', assignedBlock: 'Main Gate', phone: '9876543212' },
          { staffId: 'STF-003', name: 'Priya Verma', designation: 'Cleaning', assignedBlock: 'Block B', phone: '9876543213' }
        ];
        setStaff(defaultStaff);
        localStorage.setItem('hostel_staff', JSON.stringify(defaultStaff));
      }
    } catch (e) {
      console.error('Failed to load staff list', e);
    }
  }, []);

  // Load or initialize attendance for the selected date
  useEffect(() => {
    if (staff.length === 0) return;
    
    const dateStr = selectedDate.format('YYYY-MM-DD');
    try {
      const savedAttendance = localStorage.getItem('hostel_staff_attendance_records');
      const allRecords = savedAttendance ? JSON.parse(savedAttendance) : {};
      
      if (allRecords[dateStr]) {
        setAttendance(allRecords[dateStr]);
      } else {
        const newDayAttendance = {};
        staff.forEach(member => {
          const currentStatus = member.status || 'Present';
          newDayAttendance[member.staffId] = ['Present', 'Absent', 'Late', 'Leave'].includes(currentStatus) 
            ? currentStatus 
            : 'Present';
        });
        setAttendance(newDayAttendance);
      }
    } catch (e) {
      console.error('Failed to load staff attendance records', e);
    }
  }, [selectedDate, staff]);

  const handleStatusChange = (staffId, newStatus) => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: newStatus
    }));
  };

  const handleSaveAttendance = () => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    try {
      const savedAttendance = localStorage.getItem('hostel_staff_attendance_records');
      const allRecords = savedAttendance ? JSON.parse(savedAttendance) : {};
      allRecords[dateStr] = attendance;
      localStorage.setItem('hostel_staff_attendance_records', JSON.stringify(allRecords));

      // Sync active state back to staff list
      const updatedStaff = staff.map(member => ({
        ...member,
        status: attendance[member.staffId] || member.status || 'Active'
      }));
      setStaff(updatedStaff);
      localStorage.setItem('hostel_staff', JSON.stringify(updatedStaff));

      setSnackbar({
        open: true,
        message: `Staff attendance for ${selectedDate.format('DD MMM YYYY')} saved successfully!`,
        severity: 'success'
      });
    } catch (e) {
      console.error('Failed to save staff attendance', e);
      setSnackbar({
        open: true,
        message: 'Failed to save staff attendance. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleMarkAll = (status) => {
    const updated = {};
    filteredStaff.forEach(member => {
      updated[member.staffId] = status;
    });
    setAttendance(prev => ({ ...prev, ...updated }));
    setSnackbar({
      open: true,
      message: `Marked all matching staff as ${status}`,
      severity: 'info'
    });
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
                            member.staffId.toLowerCase().includes(search.toLowerCase()) ||
                            member.designation.toLowerCase().includes(search.toLowerCase());
      
      const currentStatus = attendance[member.staffId] || 'Present';
      const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [staff, attendance, search, statusFilter]);

  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0, leave = 0;
    filteredStaff.forEach(member => {
      const status = attendance[member.staffId] || 'Present';
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
      else if (status === 'Leave') leave++;
    });
    return {
      total: filteredStaff.length,
      present,
      absent,
      late,
      leave,
      rate: filteredStaff.length > 0 ? Math.round((present / filteredStaff.length) * 100) : 0
    };
  }, [filteredStaff, attendance]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header Block */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Staff Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track daily attendance logs and shifts for hostel support staff.
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
              startIcon={<Save size={18} />}
              onClick={handleSaveAttendance}
              sx={{ 
                backgroundColor: '#4F46E5', 
                '&:hover': { backgroundColor: '#4338CA' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1
              }}
            >
              Save Attendance
            </Button>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Checked Staff', value: stats.total, icon: Users, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
            { label: 'Present Staff', value: stats.present, icon: CheckCircle2, color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Absent Staff', value: stats.absent, icon: AlertCircle, color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)' },
            { label: 'Attendance Rate', value: `${stats.rate}%`, icon: TrendingUp, color: '#EA580C', bg: 'rgba(249, 115, 22, 0.1)' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: stat.bg, color: stat.color }}>
                      <Icon size={24} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Filters/Actions Box */}
        <Card sx={{ borderRadius: 4, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                {['All', 'Present', 'Absent', 'Late', 'Leave'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setStatusFilter(status)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: statusFilter === status ? 'white' : 'text.secondary',
                      backgroundColor: statusFilter === status ? '#4F46E5' : 'transparent',
                      '&:hover': {
                        backgroundColor: statusFilter === status ? '#4338CA' : 'action.hover'
                      }
                    }}
                  >
                    {status}
                  </Button>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search staff name, ID, role..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: '100%', sm: 250 } }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="success" 
                    size="small" 
                    onClick={() => handleMarkAll('Present')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Mark All Present
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small" 
                    onClick={() => handleMarkAll('Absent')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Mark All Absent
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Attendance Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Staff Member</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Staff ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role / Designation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned Area</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '40%', textAlign: 'center' }}>Mark Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No staff members found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((row, index) => {
                      const currentStatus = attendance[row.staffId] || 'Present';
                      return (
                        <TableRow 
                          key={row.staffId} 
                          hover 
                          sx={{ 
                            backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.01)',
                            '&:last-child td': { borderBottom: 0 } 
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`} sx={{ width: 36, height: 36 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {row.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{row.staffId}</TableCell>
                          <TableCell>{row.designation}</TableCell>
                          <TableCell>{row.assignedBlock}</TableCell>
                          <TableCell sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1.5 }}>
                            {STATUS_OPTIONS.map(opt => {
                              const StatusIcon = opt.icon;
                              const isSelected = currentStatus === opt.value;
                              return (
                                <Chip
                                  key={opt.value}
                                  icon={isSelected ? <StatusIcon size={14} color="white" /> : null}
                                  label={opt.label}
                                  onClick={() => handleStatusChange(row.staffId, opt.value)}
                                  sx={{
                                    fontWeight: 600,
                                    borderRadius: 2.5,
                                    cursor: 'pointer',
                                    color: isSelected ? 'white' : opt.color,
                                    backgroundColor: isSelected ? opt.color : 'transparent',
                                    border: isSelected ? `1.5px solid ${opt.color}` : `1.5px solid ${opt.color}`,
                                    '&:hover': {
                                      backgroundColor: isSelected ? opt.color : opt.bg,
                                      opacity: 0.95
                                    },
                                    transition: 'all 0.15s ease'
                                  }}
                                />
                              );
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
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
