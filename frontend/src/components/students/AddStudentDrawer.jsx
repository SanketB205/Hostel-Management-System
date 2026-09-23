import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, 
  useTheme, styled, CircularProgress, Card, CardContent
} from '@mui/material';
import { 
  ArrowLeft, Upload, CheckCircle2, User, GraduationCap, Users, 
  Home, CreditCard, FileText, Save, RotateCcw, Settings2,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRoomContext } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';
import { departments as departmentsApi, students as studentsApi } from '../../api';
import DepartmentManagementModal from './DepartmentManagementModal';

// Styled components
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

const SectionCard = styled(Card)(({ theme }) => ({
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
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const schema = yup.object().shape({
  // Personal
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  regNo: yup.string().optional(),
  gender: yup.string().required('Gender is required'),
  dob: yup.date().nullable().required('Date of birth is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  
  // Academic — now uses normalized IDs
  departmentId: yup.string().required('Department is required'),
  courseId: yup.string().required('Course is required'),
  yearOfStudy: yup.string().required('Year of study is required'),
  admissionDate: yup.date().nullable().required('Admission date is required'),
  
  // Parent
  parentName: yup.string().required('Parent/Guardian name is required'),
  relationship: yup.string().required('Relationship is required'),
  parentPhone: yup.string().required('Parent phone is required'),
  parentEmail: yup.string().email('Invalid email'),
  
  // Hostel
  hostelBlock: yup.string().required('Hostel block is required'),
  floorNumber: yup.string().required('Floor number is required'),
  roomNumber: yup.string().required('Room number is required'),
  bedNumber: yup.string().required('Bed number is required'),
  allocationDate: yup.date().nullable().required('Allocation date is required'),
  status: yup.string().required('Status is required'),
  
  // Fee
  totalFees: yup.number().typeError('Must be a number').nullable(),
  initialDeposit: yup.number().typeError('Must be a number').nullable(),
  paymentStatus: yup.string().nullable(),
});

export default function AddStudentDrawer({ open, onClose, onSave }) {
  const theme = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const { blocks: mockBlocks, fetchBlocks, getStudentsForRoom } = useRoomContext();
  
  // Track allocated beds in selected room
  const [allocatedBeds, setAllocatedBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // Departments / courses state
  const [allDepts, setAllDepts] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [nextRegNo, setNextRegNo] = useState('');

  const loadDepts = useCallback(async () => {
    try {
      const res = await departmentsApi.list({ status: 'Active' });
      setAllDepts(res.data || []);
    } catch (_) { /* silent */ }
  }, []);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', regNo: '', gender: '', dob: null, email: '', phone: '', address: '',
      departmentId: '', courseId: '', yearOfStudy: '', admissionDate: null,
      parentName: '', relationship: '', parentPhone: '', parentEmail: '',
      hostelBlock: '', floorNumber: '', roomNumber: '', bedNumber: '', allocationDate: null, status: 'Present',
      totalFees: '', initialDeposit: '', paymentStatus: 'Pending'
    }
  });

  const loadNextRegNo = useCallback(async () => {
    try {
      const res = await studentsApi.getNextRegistrationNumber();
      if (res?.registrationNumber) {
        setNextRegNo(res.registrationNumber);
        setValue('regNo', res.registrationNumber);
      }
    } catch (_) {
      const fallbackYear = String(new Date().getFullYear()).slice(-2);
      setNextRegNo(`HS-${fallbackYear}-...`);
    }
  }, [setValue]);

  useEffect(() => {
    if (open) {
      fetchBlocks(true);
      loadDepts();
      loadNextRegNo();
    }
  }, [open, fetchBlocks, loadDepts, loadNextRegNo]);

  const watchDepartmentId = watch('departmentId');
  const watchCourseId = watch('courseId');
  const watchBlock = watch('hostelBlock');
  const watchFloor = watch('floorNumber');
  const watchRoom = watch('roomNumber');

  // When department changes → reload filtered courses
  useEffect(() => {
    if (watchDepartmentId) {
      const dept = allDepts.find(d => d.id === watchDepartmentId);
      setFilteredCourses((dept?.courses || []).filter(c => c.status === 'Active'));
    } else {
      setFilteredCourses([]);
    }
  }, [watchDepartmentId, allDepts]);

  const availableBlocks = mockBlocks.filter(block =>
    (block.floors || []).some(floor =>
      (floor.rooms || []).some(room =>
        (room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance'
      )
    )
  );

  const selectedBlockObj = mockBlocks.find(b => b.name === watchBlock);
  const availableFloors = selectedBlockObj
    ? (selectedBlockObj.floors || []).filter(floor =>
        (floor.rooms || []).some(room =>
          (room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance'
        )
      )
    : [];

  const selectedFloorObj = selectedBlockObj?.floors?.find(f => f.name === watchFloor);
  const availableRooms = selectedFloorObj
    ? (selectedFloorObj.rooms || []).filter(room =>
        (room.bedsOccupied || 0) < room.capacity && room.status !== 'Maintenance'
      )
    : [];

  const selectedRoomObj = selectedFloorObj?.rooms?.find(r => r.number === watchRoom);

  // Fetch allocated beds whenever selected room changes
  useEffect(() => {
    const fetchAllocatedBeds = async () => {
      if (!selectedRoomObj?.id) {
        setAllocatedBeds([]);
        return;
      }

      setLoadingBeds(true);
      try {
        const students = await getStudentsForRoom(selectedRoomObj.id);
        const occupiedBeds = students.map(s => s.bedNumber);
        setAllocatedBeds(occupiedBeds);
      } catch (err) {
        console.error('Failed to fetch allocated beds:', err);
        setAllocatedBeds([]);
      } finally {
        setLoadingBeds(false);
      }
    };

    fetchAllocatedBeds();
  }, [selectedRoomObj?.id, getStudentsForRoom]);

  const onSubmit = async (data, addAnother = false) => {
    setIsSubmitting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = await onSave({ ...data, uploadedFiles });
    setIsSubmitting(false);
    if (result?.success === false) return;
    
    if (addAnother) {
      reset();
      setUploadedFiles({});
      loadNextRegNo();
      // Scroll back to top
      const drawerContent = document.getElementById('drawer-form-content');
      if (drawerContent) drawerContent.scrollTop = 0;
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    setUploadedFiles({});
    setNextRegNo('');
    setAllocatedBeds([]);
    onClose();
  };

  const handleFileUpload = (fieldName) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file.name }));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          maxWidth: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          top: '72px',
          height: 'calc(100% - 72px)',
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Form Content */}
        <FormContainer id="drawer-form-content">
          {/* Header (Scrollable) */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: 1,
          }}>
            <IconButton 
              onClick={handleClose} 
              sx={{ backgroundColor: 'action.hover' }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Student Registration
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Enter the student's details to enroll them into the system.
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
                    <TextField
                      {...field}
                      fullWidth
                      label="Registration Number"
                      value={nextRegNo || field.value || 'Generating...'}
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Auto-generated sequentially per year (e.g. HS-26-001)"
                    />
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
                  <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>Academic Information</Typography>
                  {isAdmin && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Settings2 size={14} />}
                      onClick={() => setDeptModalOpen(true)}
                      sx={{
                        textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                        borderRadius: '8px', px: 1.5, py: 0.5,
                        borderColor: theme.palette.divider,
                        color: 'text.secondary',
                        '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.04)' },
                      }}
                    >
                      Manage Departments
                    </Button>
                  )}
                </SectionHeaderBox>
                <GridBox>
                  {/* Department */}
                  <Controller name="departmentId" control={control} render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Department *"
                      error={!!errors.departmentId}
                      helperText={errors.departmentId?.message}
                      onChange={e => {
                        field.onChange(e);
                        setValue('courseId', '');
                        setValue('yearOfStudy', '');
                      }}
                    >
                      {allDepts.length === 0 && (
                        <MenuItem disabled value="">No departments available</MenuItem>
                      )}
                      {allDepts.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                      ))}
                    </TextField>
                  )} />

                  {/* Course — disabled until department selected */}
                  <Controller name="courseId" control={control} render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Course *"
                      error={!!errors.courseId}
                      helperText={errors.courseId?.message}
                      disabled={!watchDepartmentId}
                      onChange={e => {
                        field.onChange(e);
                        setValue('yearOfStudy', '');
                      }}
                    >
                      {filteredCourses.length === 0 && (
                        <MenuItem disabled value="">
                          {watchDepartmentId ? 'No courses for this department' : 'Select a department first'}
                        </MenuItem>
                      )}
                      {filteredCourses.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  )} />

                  {/* Year of Study — disabled until course selected */}
                  <Controller name="yearOfStudy" control={control} render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Year of Study *"
                      error={!!errors.yearOfStudy}
                      helperText={errors.yearOfStudy?.message}
                      disabled={!watchCourseId}
                    >
                      {YEAR_OPTIONS.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  )} />

                  {/* Admission Date */}
                  <Controller name="admissionDate" control={control} render={({ field }) => (
                    <DatePicker label="Admission Date *" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{ textField: { fullWidth: true, error: !!errors.admissionDate, helperText: errors.admissionDate?.message } }} />
                  )} />
                </GridBox>
              </CardContent>
            </SectionCard>

            {/* Department Management Modal */}
            <DepartmentManagementModal
              open={deptModalOpen}
              onClose={() => setDeptModalOpen(false)}
              onUpdated={loadDepts}
            />

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
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><Home size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Hostel Information</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <Controller name="hostelBlock" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Hostel Block *" error={!!errors.hostelBlock} helperText={errors.hostelBlock?.message}
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
                    <TextField {...field} select fullWidth label="Floor Number *" error={!!errors.floorNumber} helperText={errors.floorNumber?.message} disabled={!watchBlock}
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
                    <TextField {...field} select fullWidth label="Room Number *" error={!!errors.roomNumber} helperText={errors.roomNumber?.message} disabled={!watchFloor}
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
                    <TextField {...field} select fullWidth label="Bed Number *" error={!!errors.bedNumber} helperText={errors.bedNumber?.message} disabled={!watchRoom || loadingBeds}>
                      {selectedRoomObj && !loadingBeds ? (
                        // Generate all possible bed numbers for this room
                        Array.from({ length: selectedRoomObj.capacity }).map((_, i) => {
                          const bedNumber = i + 1;
                          const bedName = `Bed ${bedNumber}`;
                          
                          // Only show beds that are NOT already allocated
                          if (allocatedBeds.includes(bedName)) {
                            return null;
                          }
                          
                          return (
                            <MenuItem key={bedNumber} value={bedName}>
                              {bedName}
                            </MenuItem>
                          );
                        }).filter(Boolean)
                      ) : loadingBeds ? (
                        <MenuItem disabled>Loading available beds...</MenuItem>
                      ) : (
                        <MenuItem disabled>Select a room first</MenuItem>
                      )}
                    </TextField>
                  )} />
                  <Controller name="allocationDate" control={control} render={({ field }) => (
                    <DatePicker label="Allocation Date *" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{ textField: { fullWidth: true, error: !!errors.allocationDate, helperText: errors.allocationDate?.message } }} />
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
            Reset
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handleClose} 
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
              color="secondary"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting}
              sx={{ display: { xs: 'none', sm: 'flex' }, px: 3, py: 1 }}
            >
              Save & Add Another
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit((data) => onSubmit(data, false))}
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
      </Box>
    </Drawer>
  );
}
