import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button, TextField, MenuItem, Chip,
  useTheme, styled, CircularProgress, Card, CardContent, Snackbar, Alert,
  Switch, FormControlLabel
} from '@mui/material';
import { 
  ArrowLeft, Upload, CheckCircle2, User, GraduationCap, Users, 
  Home, CreditCard, FileText, Save, RotateCcw
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useRoomContext } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { students as studentsApi } from '../api';

// Styled components (identical to AddStudentDrawer, custom wrapper to negate page margins)
const PageWrapper = styled(Box)(({ theme }) => ({
  margin: theme.spacing(-2),
  height: 'calc(100vh - 72px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    margin: theme.spacing(-3),
  },
  [theme.breakpoints.up('md')]: {
    margin: theme.spacing(-4),
  }
}));

const FormContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(3, 4),
  backgroundColor: theme.palette.mode === 'light' ? '#F3F4F6' : theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const SectionCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  overflow: 'visible',
}));

const SectionHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light + '20',
  color: theme.palette.primary.main,
  padding: theme.spacing(1),
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: theme.palette.background.default,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  }
}));

const GridBox = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(1, 1fr)',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  }
}));

// Validation Schema
const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  regNo: yup.string().required('Registration number is required'),
  gender: yup.string().required('Gender is required'),
  dob: yup.date().nullable().required('Date of birth is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  department: yup.string().required('Department is required'),
  course: yup.string().required('Course is required'),
  year: yup.string().required('Year of study is required'),
  admissionDate: yup.date().nullable().required('Admission date is required'),
  parentName: yup.string().required('Parent/Guardian name is required'),
  relationship: yup.string().required('Relationship is required'),
  parentPhone: yup.string().required('Parent phone is required'),
  parentEmail: yup.string().email('Invalid email').nullable(),
  hostelBlock: yup.string().nullable(),
  floorNumber: yup.string().nullable(),
  roomNumber: yup.string().nullable(),
  bedNumber: yup.string().nullable(),
  allocationDate: yup.date().nullable(),
  status: yup.string().required('Status is required'),
  totalFees: yup.number().typeError('Must be a number').nullable(),
  initialDeposit: yup.number().typeError('Must be a number').nullable(),
  paymentStatus: yup.string().nullable(),
});

export default function EditStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isTransferMode = useMemo(() => searchParams.get('focus') === 'hostel' || searchParams.get('transfer') === 'true', [searchParams]);
  const [transferModeEnabled, setTransferModeEnabled] = useState(isTransferMode);

  useEffect(() => {
    if (isTransferMode) {
      setTransferModeEnabled(true);
    }
  }, [isTransferMode]);
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { blocks: mockBlocks, fetchBlocks } = useRoomContext();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', regNo: '', gender: '', dob: null, email: '', phone: '', address: '',
      department: '', course: '', year: '', admissionDate: null,
      parentName: '', relationship: '', parentPhone: '', parentEmail: '',
      hostelBlock: '', floorNumber: '', roomNumber: '', bedNumber: '', allocationDate: null, status: 'Present',
      totalFees: '', initialDeposit: '', paymentStatus: 'Pending'
    }
  });

  const watchBlock = watch('hostelBlock');
  const watchFloor = watch('floorNumber');
  const watchRoom = watch('roomNumber');

  // Load student details and verify authorization
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }

    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [studentRes] = await Promise.all([
          studentsApi.getById(id),
          fetchBlocks(true)
        ]);

        if (active) {
          const s = studentRes.data;
          setStudent(s);
          const activeAlloc = (s.allocations || []).find(a => a.status === 'active');
          
          reset({
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            regNo: s.registrationNumber || '',
            gender: s.gender || '',
            dob: s.dateOfBirth ? dayjs(s.dateOfBirth) : null,
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            department: s.department || '',
            course: s.course || '',
            year: s.year || '',
            admissionDate: s.admissionDate ? dayjs(s.admissionDate) : null,
            parentName: s.guardianName || '',
            relationship: s.guardianRelationship || '',
            parentPhone: s.guardianPhone || '',
            parentEmail: s.guardianEmail || '',
            hostelBlock: activeAlloc?.room?.floor?.block?.name || '',
            floorNumber: activeAlloc?.room?.floor?.name || '',
            roomNumber: activeAlloc?.room?.number || '',
            bedNumber: activeAlloc?.bedNumber || '',
            allocationDate: activeAlloc?.allocatedAt ? dayjs(activeAlloc.allocatedAt) : null,
            status: s.status || 'Present',
            totalFees: s.totalFees !== null && s.totalFees !== undefined ? s.totalFees : '',
            initialDeposit: s.initialDeposit !== null && s.initialDeposit !== undefined ? s.initialDeposit : '',
            paymentStatus: s.paymentStatus || 'Pending'
          });
        }
      } catch (err) {
        console.error('Failed to load student details:', err);
        setSnackbar({
          open: true,
          message: err.message || 'Failed to load student profile.',
          severity: 'error'
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [id, reset, user, navigate, fetchBlocks]);

  // Scroll to hostel info if in transfer mode
  useEffect(() => {
    if (!loading && isTransferMode) {
      const timer = setTimeout(() => {
        const element = document.getElementById('hostel-info-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isTransferMode]);

  // Extract current room and bed to ensure they are available even if capacity is full
  const currentAlloc = useMemo(() => {
    return (student?.allocations || []).find(a => a.status === 'active');
  }, [student]);

  const currentRoomNumber = currentAlloc?.room?.number;
  const currentBedNumber = currentAlloc?.bedNumber;

  const availableBlocks = useMemo(() => {
    return mockBlocks.filter(block =>
      (currentAlloc?.room?.floor?.block?.name && block.name === currentAlloc.room.floor.block.name) ||
      (block.floors || []).some(floor =>
        (floor.rooms || []).some(room =>
          (room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance'
        )
      )
    );
  }, [mockBlocks, currentAlloc]);

  const selectedBlockObj = useMemo(() => {
    return mockBlocks.find(b => b.name === watchBlock);
  }, [mockBlocks, watchBlock]);

  const availableFloors = useMemo(() => {
    if (!selectedBlockObj) return [];
    return (selectedBlockObj.floors || []).filter(floor =>
      (currentAlloc?.room?.floor?.name && floor.name === currentAlloc.room.floor.name) ||
      (floor.rooms || []).some(room =>
        (room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance'
      )
    );
  }, [selectedBlockObj, currentAlloc]);

  const selectedFloorObj = useMemo(() => {
    return selectedBlockObj?.floors?.find(f => f.name === watchFloor);
  }, [selectedBlockObj, watchFloor]);

  const availableRooms = useMemo(() => {
    if (!selectedFloorObj) return [];
    return (selectedFloorObj.rooms || []).filter(room =>
      room.number === currentRoomNumber ||
      ((room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance')
    );
  }, [selectedFloorObj, currentRoomNumber]);

  const selectedRoomObj = useMemo(() => {
    return selectedFloorObj?.rooms?.find(r => r.number === watchRoom);
  }, [selectedFloorObj, watchRoom]);

  const bedOptions = useMemo(() => {
    if (!selectedRoomObj) return [];
    const freeBeds = selectedRoomObj.capacity - (selectedRoomObj.bedsOccupied || 0);
    const isCurrentRoom = selectedRoomObj.number === currentRoomNumber;
    const optionCount = freeBeds + (isCurrentRoom ? 1 : 0);
    
    const options = [];
    for (let i = 0; i < optionCount; i++) {
      options.push(`Bed ${i + 1}`);
    }
    
    if (isCurrentRoom && currentBedNumber && !options.includes(currentBedNumber)) {
      options.push(currentBedNumber);
    }
    
    return options;
  }, [selectedRoomObj, currentRoomNumber, currentBedNumber]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const dobRaw = data.dob;
    let dateOfBirth;
    if (dobRaw && typeof dobRaw.format === 'function') {
      dateOfBirth = dobRaw.format('YYYY-MM-DD');
    } else if (dobRaw instanceof Date && !isNaN(dobRaw)) {
      const y = dobRaw.getFullYear();
      const m = String(dobRaw.getMonth() + 1).padStart(2, '0');
      const d = String(dobRaw.getDate()).padStart(2, '0');
      dateOfBirth = `${y}-${m}-${d}`;
    } else {
      dateOfBirth = String(dobRaw || '').slice(0, 10);
    }

    const admDateRaw = data.admissionDate;
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
      const payload = {
        registrationNumber: data.regNo,
        firstName:          data.firstName,
        lastName:           data.lastName,
        gender:             data.gender,
        dateOfBirth,
        email:              data.email.trim().toLowerCase(),
        phone:              data.phone,
        address:            data.address,
        department:         data.department,
        course:             data.course,
        year:               data.year,
        admissionDate,
        guardianName:         data.parentName,
        guardianRelationship: data.relationship,
        guardianPhone:        data.parentPhone,
        guardianEmail:        data.parentEmail || null,
        status:               data.status,
        totalFees:            data.totalFees !== '' && data.totalFees !== null && data.totalFees !== undefined ? Number(data.totalFees) : null,
        initialDeposit:       data.initialDeposit !== '' && data.initialDeposit !== null && data.initialDeposit !== undefined ? Number(data.initialDeposit) : null,
        paymentStatus:        data.paymentStatus || 'Pending',
      };

      if (transferModeEnabled) {
        if (!data.hostelBlock || !data.floorNumber || !data.roomNumber || !data.bedNumber) {
          setSnackbar({
            open: true,
            message: 'Please select a valid Hostel Block, Floor, Room, and Bed for reallocation.',
            severity: 'error'
          });
          setIsSubmitting(false);
          return;
        }
        payload.allocation = {
          roomNumber:  data.roomNumber,
          bedNumber:   data.bedNumber,
          allocatedAt: data.allocationDate?.format?.('YYYY-MM-DD') || data.allocationDate || new Date().toISOString().slice(0, 10),
        };
      }

      await studentsApi.update(id, payload);

      const oldRoomStr = currentAlloc?.room?.number || '';
      const newRoomStr = data.roomNumber || '';

      const successMsg = transferModeEnabled && oldRoomStr && oldRoomStr !== newRoomStr
        ? `Student successfully transferred from ${oldRoomStr} to ${newRoomStr}.`
        : 'Student details updated successfully!';

      setSnackbar({ open: true, message: successMsg, severity: 'success' });
      setTimeout(() => {
        if (isTransferMode) {
          navigate('/rooms');
        } else {
          navigate(`/students/${id}`);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to update student:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save student changes.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (fieldName) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file.name }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  return (
    <PageWrapper sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Form Container */}
      <FormContainer id="edit-form-content">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: 'action.hover' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Edit Student Profile
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Modify the student details below and save changes.
            </Typography>
          </Box>
        </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            
            {/* SECTION 1: Personal Information */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><User size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal Information</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <Controller name="firstName" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="First Name *" error={!!errors.firstName} helperText={errors.firstName?.message} />
                  )} />
                  <Controller name="lastName" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Last Name *" error={!!errors.lastName} helperText={errors.lastName?.message} />
                  )} />
                  <Controller name="regNo" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Registration Number *" error={!!errors.regNo} helperText={errors.regNo?.message} />
                  )} />
                  <Controller name="gender" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Gender *" error={!!errors.gender} helperText={errors.gender?.message}>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  )} />
                  <Controller name="dob" control={control} render={({ field }) => (
                    <DatePicker label="Date of Birth *" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{ textField: { fullWidth: true, error: !!errors.dob, helperText: errors.dob?.message } }} />
                  )} />
                  <Controller name="phone" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Phone Number *" error={!!errors.phone} helperText={errors.phone?.message} />
                  )} />
                  <Controller name="email" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Email *" error={!!errors.email} helperText={errors.email?.message} />
                  )} />
                  <Controller name="address" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Address *" error={!!errors.address} helperText={errors.address?.message} />
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* SECTION 2: Academic Information */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><GraduationCap size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Academic Information</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <Controller name="department" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Department *" error={!!errors.department} helperText={errors.department?.message} />
                  )} />
                  <Controller name="course" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Course *" error={!!errors.course} helperText={errors.course?.message}>
                      <MenuItem value="CSE">CSE</MenuItem>
                      <MenuItem value="ECE">ECE</MenuItem>
                      <MenuItem value="ME">ME</MenuItem>
                      <MenuItem value="CE">CE</MenuItem>
                      <MenuItem value="BBA">BBA</MenuItem>
                    </TextField>
                  )} />
                  <Controller name="year" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Year of Study *" error={!!errors.year} helperText={errors.year?.message}>
                      <MenuItem value="1st">1st Year</MenuItem>
                      <MenuItem value="2nd">2nd Year</MenuItem>
                      <MenuItem value="3rd">3rd Year</MenuItem>
                      <MenuItem value="4th">4th Year</MenuItem>
                    </TextField>
                  )} />
                  <Controller name="admissionDate" control={control} render={({ field }) => (
                    <DatePicker label="Admission Date *" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{ textField: { fullWidth: true, error: !!errors.admissionDate, helperText: errors.admissionDate?.message } }} />
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* SECTION 3: Parent/Guardian Information */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><Users size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Parent/Guardian Information</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <Controller name="parentName" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Parent Name *" error={!!errors.parentName} helperText={errors.parentName?.message} />
                  )} />
                  <Controller name="relationship" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Relationship *" error={!!errors.relationship} helperText={errors.relationship?.message} />
                  )} />
                  <Controller name="parentPhone" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Parent Phone Number *" error={!!errors.parentPhone} helperText={errors.parentPhone?.message} />
                  )} />
                  <Controller name="parentEmail" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Parent Email" error={!!errors.parentEmail} helperText={errors.parentEmail?.message} />
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* SECTION 4: Hostel Information */}
            <SectionCard
              id="hostel-info-section"
              sx={{
                transition: 'all 0.3s ease',
                ...(transferModeEnabled && {
                  border: '2px solid #6366F1',
                  boxShadow: '0 0 20px rgba(99,102,241,0.25)',
                  '@keyframes pulseHighlight': {
                    '0%': { borderColor: '#6366F1', boxShadow: '0 0 5px rgba(99,102,241,0.2)' },
                    '50%': { borderColor: '#4F46E5', boxShadow: '0 0 20px rgba(79,70,229,0.5)' },
                    '100%': { borderColor: '#6366F1', boxShadow: '0 0 5px rgba(99,102,241,0.2)' },
                  },
                  animation: 'pulseHighlight 2.5s infinite ease-in-out',
                })
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconWrapper><Home size={24} /></IconWrapper>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Hostel Information</Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={transferModeEnabled}
                        onChange={(e) => setTransferModeEnabled(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700, color: transferModeEnabled ? 'primary.main' : 'text.secondary' }}>
                        Enable Transfer Mode
                      </Typography>
                    }
                  />
                </SectionHeaderBox>

                {currentAlloc ? (
                  <Box sx={{
                    mb: 3, p: 2, borderRadius: '12px',
                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 1
                  }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5, letterSpacing: '0.5px' }}>
                        Current Room & Bed
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4F46E5', fontSize: '1rem' }}>
                        {currentAlloc.room?.floor?.block?.name ? `${currentAlloc.room.floor.block.name} - ` : ''}Room {currentAlloc.room?.number} ({currentAlloc.bedNumber})
                      </Typography>
                    </Box>
                    <Chip
                      label={transferModeEnabled ? 'Transfer Mode ON (Editing Enabled)' : 'Transfer Mode OFF (Allocation Locked)'}
                      size="small"
                      color={transferModeEnabled ? 'primary' : 'default'}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        py: 1.5
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{
                    mb: 3, p: 2, borderRadius: '12px',
                    backgroundColor: 'action.hover',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No active hostel allocation found for this student.
                    </Typography>
                    <Chip
                      label={transferModeEnabled ? 'Allocation Mode Active' : 'Allocation Locked'}
                      size="small"
                      color={transferModeEnabled ? 'primary' : 'default'}
                    />
                  </Box>
                )}

                {!transferModeEnabled && (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: '10px' }}>
                    Hostel room and bed allocation are locked. Previous allocation will be kept as is. Turn on <strong>Enable Transfer Mode</strong> above if you wish to transfer or reallocate this student.
                  </Alert>
                )}

                <GridBox>
                  <Controller name="hostelBlock" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Hostel Block" error={!!errors.hostelBlock} helperText={errors.hostelBlock?.message}
                      disabled={!transferModeEnabled}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue('floorNumber', '');
                        setValue('roomNumber', '');
                        setValue('bedNumber', '');
                      }}
                    >
                      {availableBlocks.map(block => (
                        <MenuItem key={block.name} value={block.name}>{block.name}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                  <Controller name="floorNumber" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Floor Number" error={!!errors.floorNumber} helperText={errors.floorNumber?.message} disabled={!transferModeEnabled || !watchBlock}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue('roomNumber', '');
                        setValue('bedNumber', '');
                      }}
                    >
                      {availableFloors.map(floor => (
                        <MenuItem key={floor.name} value={floor.name}>{floor.name}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                  <Controller name="roomNumber" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Room Number" error={!!errors.roomNumber} helperText={errors.roomNumber?.message} disabled={!transferModeEnabled || !watchFloor}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue('bedNumber', '');
                      }}
                    >
                      {availableRooms.map(room => (
                        <MenuItem key={room.number} value={room.number}>
                          {room.number} ({room.capacity - (room.bedsOccupied || 0)} beds left)
                        </MenuItem>
                      ))}
                    </TextField>
                  )} />
                  <Controller name="bedNumber" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Bed Number" error={!!errors.bedNumber} helperText={errors.bedNumber?.message} disabled={!transferModeEnabled || !watchRoom}>
                      {bedOptions.map((bedOpt) => (
                        <MenuItem key={bedOpt} value={bedOpt}>{bedOpt}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                  <Controller name="allocationDate" control={control} render={({ field }) => (
                    <DatePicker label="Allocation Date" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                      disabled={!transferModeEnabled}
                      slotProps={{ textField: { fullWidth: true, error: !!errors.allocationDate, helperText: errors.allocationDate?.message, disabled: !transferModeEnabled } }} />
                  )} />
                  <Controller name="status" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Student Status *" error={!!errors.status} helperText={errors.status?.message}>
                      <MenuItem value="Present">Present</MenuItem>
                      <MenuItem value="Outing">Outing</MenuItem>
                      <MenuItem value="Leave">Leave</MenuItem>
                      <MenuItem value="Late">Late</MenuItem>
                      <MenuItem value="Absent">Absent</MenuItem>
                    </TextField>
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* SECTION 5: Fee Information */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><CreditCard size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Fee Information</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <Controller name="totalFees" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Total Fees" error={!!errors.totalFees} helperText={errors.totalFees?.message} />
                  )} />
                  <Controller name="initialDeposit" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Initial Deposit" error={!!errors.initialDeposit} helperText={errors.initialDeposit?.message} />
                  )} />
                  <Controller name="paymentStatus" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Payment Status" error={!!errors.paymentStatus} helperText={errors.paymentStatus?.message}>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Partial">Partial</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                    </TextField>
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* SECTION 6: Documents */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><FileText size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Documents Upload</Typography>
                </SectionHeaderBox>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Please upload clear copies of the following documents. Supported formats: JPG, PNG, PDF.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {['Photo', 'Aadhaar', 'Receipt'].map((doc) => (
                    <Box key={doc}>
                      <input
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        id={`upload-${doc}`}
                        type="file"
                        onChange={handleFileUpload(doc)}
                      />
                      <label htmlFor={`upload-${doc}`} style={{ display: 'block', height: '100%' }}>
                        <FileUploadBox>
                          {uploadedFiles[doc] ? (
                            <>
                              <CheckCircle2 color={theme.palette.success.main} size={32} style={{ marginBottom: 12 }} />
                              <Typography variant="body2" noWrap sx={{ maxWidth: '100%', fontWeight: 600 }} color="textPrimary">
                                {uploadedFiles[doc]}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Upload color={theme.palette.primary.main} size={32} style={{ marginBottom: 12 }} />
                              <Typography variant="subtitle2" color="textPrimary" sx={{ mb: 0.5 }}>
                                {doc}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Click to upload
                              </Typography>
                            </>
                          )}
                        </FileUploadBox>
                      </label>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </SectionCard>

          </LocalizationProvider>
        </FormContainer>

        {/* Sticky Actions Footer */}
        <Box sx={{ 
          p: 3, 
          borderTop: `1px solid ${theme.palette.divider}`, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <Button 
            variant="text" 
            onClick={() => reset()} 
            disabled={isSubmitting}
            startIcon={<RotateCcw size={18} />}
            sx={{ 
              color: 'text.secondary', 
              '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } 
            }}
          >
            Reset Form
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)} 
              disabled={isSubmitting}
              sx={{ 
                px: 3, py: 1,
                color: 'text.primary',
                borderColor: theme.palette.mode === 'light' ? '#D1D5DB' : 'divider',
                '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
              sx={{ 
                backgroundColor: '#4F46E5', 
                '&:hover': { backgroundColor: '#4338CA' },
                px: 4, 
                py: 1,
                fontWeight: 600
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Student'}
            </Button>
        </Box>
      </Box>

      {/* Snackbar feedback */}
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
    </PageWrapper>
  );
}
