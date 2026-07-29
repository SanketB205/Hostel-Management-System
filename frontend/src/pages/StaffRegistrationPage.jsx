import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button, TextField, MenuItem, 
  useTheme, styled, CircularProgress, Card, CardContent, FormControlLabel, Switch, Snackbar, Alert
} from '@mui/material';
import { 
  ArrowLeft, Upload, CheckCircle2, User, Briefcase, Home, Users, 
  Lock, FileText, Save, RotateCcw, Eye, EyeOff
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRoomContext } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { staff as staffApi } from '../api';
import dayjs from 'dayjs';

// Styled components (matching AddStudentDrawer.jsx / ViewStudentDetailsPage.jsx)
const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
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
  gender: yup.string().required('Gender is required'),
  dob: yup.date().nullable().typeError('Invalid date').required('Date of birth is required'),
  phone: yup.string()
    .matches(/^[0-9+\-\s()]{10,15}$/, 'Invalid phone number format')
    .required('Phone number is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  address: yup.string().required('Address is required'),
  
  staffId: yup.string().required('Staff ID is required'),
  designation: yup.string().required('Designation is required'),
  joiningDate: yup.date().nullable().typeError('Invalid date').required('Joining date is required'),
  employmentType: yup.string().required('Employment type is required'),
  
  assignedArea: yup.string().required('Assigned area is required'),
  assignedBlock: yup.string().when('assignedArea', {
    is: 'Hostel Block',
    then: (schema) => schema.required('Assigned block is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  shift: yup.string().required('Shift is required'),
  
  emergencyContactName: yup.string().required('Emergency contact name is required'),
  relationship: yup.string().required('Relationship is required'),
  emergencyPhone: yup.string()
    .matches(/^[0-9+\-\s()]{10,15}$/, 'Invalid phone number format')
    .required('Emergency phone number is required'),
  
  giveSystemAccess: yup.boolean(),
  username: yup.string().when('giveSystemAccess', {
    is: true,
    then: (schema) => schema.required('Username / Email is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  password: yup.string().when('giveSystemAccess', {
    is: true,
    then: (schema) => schema.required('Password is required'),
    otherwise: (schema) => schema.nullable().notRequired()
  }),
  confirmPassword: yup.string().when('giveSystemAccess', {
    is: true,
    then: (schema) => schema
      .required('Confirm password is required')
      .oneOf([yup.ref('password')], 'Passwords must match'),
    otherwise: (schema) => schema.nullable().notRequired()
  })
});

export default function StaffRegistrationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { blocks: mockBlocks } = useRoomContext();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', gender: '', dob: null, email: '', phone: '', address: '',
      staffId: 'Generating...', designation: '', joiningDate: null, employmentType: '',
      assignedArea: '', assignedBlock: '', shift: '',
      emergencyContactName: '', relationship: '', emergencyPhone: '',
      giveSystemAccess: false, username: '', password: '', confirmPassword: ''
    }
  });

  const watchAssignedArea = watch('assignedArea');
  const watchGiveSystemAccess = watch('giveSystemAccess');
  const watchDesignation = watch('designation');

  useEffect(() => {
    if (watchDesignation !== 'Warden / Rector') {
      setValue('giveSystemAccess', false);
      setValue('username', '');
      setValue('password', '');
      setValue('confirmPassword', '');
    }
  }, [watchDesignation, setValue]);

  // Fetch next Staff ID from backend on mount
  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const res = await staffApi.list();
        const list = res.data || [];
        const nums = list
          .map(s => {
            const match = s.staffId ? s.staffId.match(/^STF(\d+)$/) : null;
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => n > 0);
          
        const maxNum = nums.length > 0 ? Math.max(...nums) : 24;
        const generated = `STF${String(maxNum + 1).padStart(3, '0')}`;
        setValue('staffId', generated);
      } catch (err) {
        console.error('Failed to generate staff ID from backend:', err);
      }
    };
    fetchNextId();
  }, [setValue]);

  const handleFileUpload = (fieldName) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file.name }));
      if (fieldName === 'Photo') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleReset = async () => {
    reset({
      firstName: '', lastName: '', gender: '', dob: null, email: '', phone: '', address: '',
      staffId: 'Generating...', designation: '', joiningDate: null, employmentType: '',
      assignedArea: '', assignedBlock: '', shift: '',
      emergencyContactName: '', relationship: '', emergencyPhone: '',
      giveSystemAccess: false, username: '', password: '', confirmPassword: ''
    });
    setUploadedFiles({});
    setPhotoPreview(null);

    try {
      const res = await staffApi.list();
      const list = res.data || [];
      const nums = list
        .map(s => {
          const match = s.staffId ? s.staffId.match(/^STF(\d+)$/) : null;
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
        
      const maxNum = nums.length > 0 ? Math.max(...nums) : 24;
      const generated = `STF${String(maxNum + 1).padStart(3, '0')}`;
      setValue('staffId', generated);
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (data, addAnother = false) => {
    setIsSubmitting(true);

    try {
      // Format Dates
      const dobFormatted = data.dob ? dayjs(data.dob).format('YYYY-MM-DD') : '';
      const joiningDateFormatted = data.joiningDate ? dayjs(data.joiningDate).format('YYYY-MM-DD') : '';

      // Determine Assigned Block representation
      const assignedBlockVal = data.assignedArea === 'Hostel Block' ? data.assignedBlock : data.assignedArea;

      const payload = {
        staffId: data.staffId,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: dobFormatted,
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        address: data.address,
        designation: data.designation,
        joiningDate: joiningDateFormatted,
        employmentType: data.employmentType,
        assignedArea: data.assignedArea,
        assignedBlock: assignedBlockVal,
        shift: data.shift,
        emergencyContactName: data.emergencyContactName,
        relationship: data.relationship,
        emergencyPhone: data.emergencyPhone,
        giveSystemAccess: !!data.giveSystemAccess,
        username: data.giveSystemAccess ? data.username : '',
        password: data.giveSystemAccess ? data.password : '',
        uploadedFiles,
      };

      await staffApi.create(payload);

      setSnackbar({ open: true, message: 'Staff registered successfully!', severity: 'success' });

      if (addAnother) {
        // Reset form to default except next generated ID which we fetch asynchronously
        reset({
          firstName: '', lastName: '', gender: '', dob: null, email: '', phone: '', address: '',
          staffId: 'Generating...', designation: '', joiningDate: null, employmentType: '',
          assignedArea: '', assignedBlock: '', shift: '',
          emergencyContactName: '', relationship: '', emergencyPhone: '',
          giveSystemAccess: false, username: '', password: '', confirmPassword: ''
        });
        setUploadedFiles({});
        setPhotoPreview(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
          const res = await staffApi.list();
          const list = res.data || [];
          const nums = list
            .map(s => {
              const match = s.staffId ? s.staffId.match(/^STF(\d+)$/) : null;
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => n > 0);
            
          const maxNum = nums.length > 0 ? Math.max(...nums) : 24;
          const generated = `STF${String(maxNum + 1).padStart(3, '0')}`;
          setValue('staffId', generated);
        } catch (err) {
          console.error(err);
        }
      } else {
        // Return to staff directory with success state
        navigate('/staff', { state: { successMessage: 'Staff registered successfully!' } });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to save staff.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const blocksList = mockBlocks && mockBlocks.length > 0 ? mockBlocks : [{ name: 'Block A' }, { name: 'Block B' }, { name: 'Block C' }];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageContainer>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate('/staff')} sx={{ backgroundColor: 'action.hover' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Staff Registration
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Enter the staff member's details to register them into the system.
            </Typography>
          </Box>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/* SECTION 1 — PERSONAL INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><User size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal Information</Typography>
              </SectionHeaderBox>
              <GridBox sx={{ gap: 3 }}>
                <Controller name="firstName" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="First Name *" error={!!errors.firstName} helperText={errors.firstName?.message} />
                )} />
                <Controller name="lastName" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Last Name *" error={!!errors.lastName} helperText={errors.lastName?.message} />
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
                  <TextField {...field} fullWidth label="Email Address *" error={!!errors.email} helperText={errors.email?.message} />
                )} />
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <Controller name="address" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth label="Address *" error={!!errors.address} helperText={errors.address?.message} />
                  )} />
                </Box>
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 2 — EMPLOYMENT INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Briefcase size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Employment Information</Typography>
              </SectionHeaderBox>
              <GridBox sx={{ gap: 3 }}>
                <Controller name="staffId" control={control} render={({ field }) => (
                  <TextField {...field} slotProps={{ input: { readOnly: true } }} fullWidth label="Staff ID *" error={!!errors.staffId} helperText={errors.staffId?.message} />
                )} />
                <Controller name="designation" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Designation *" error={!!errors.designation} helperText={errors.designation?.message}>
                    {user?.role === 'admin' && (
                      <MenuItem value="Warden / Rector">Warden / Rector</MenuItem>
                    )}
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Cleaner">Cleaner</MenuItem>
                    <MenuItem value="Mess Staff">Mess Staff</MenuItem>
                    <MenuItem value="Accountant">Accountant</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )} />
                <Controller name="joiningDate" control={control} render={({ field }) => (
                  <DatePicker label="Joining Date *" value={field.value} onChange={(newValue) => field.onChange(newValue)}
                    slotProps={{ textField: { fullWidth: true, error: !!errors.joiningDate, helperText: errors.joiningDate?.message } }} />
                )} />
                <Controller name="employmentType" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Employment Type *" error={!!errors.employmentType} helperText={errors.employmentType?.message}>
                    <MenuItem value="Full Time">Full Time</MenuItem>
                    <MenuItem value="Part Time">Part Time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 3 — HOSTEL ASSIGNMENT */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Home size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Hostel Assignment</Typography>
              </SectionHeaderBox>
              <GridBox sx={{ gap: 3 }}>
                <Controller name="assignedArea" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    select 
                    fullWidth 
                    label="Assigned Area *" 
                    error={!!errors.assignedArea} 
                    helperText={errors.assignedArea?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value !== 'Hostel Block') {
                        setValue('assignedBlock', '');
                      }
                    }}
                  >
                    <MenuItem value="Hostel Block">Hostel Block</MenuItem>
                    <MenuItem value="Main Gate">Main Gate</MenuItem>
                    <MenuItem value="Mess Area">Mess Area</MenuItem>
                    <MenuItem value="Office">Office</MenuItem>
                    <MenuItem value="Common Area">Common Area</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )} />

                {watchAssignedArea === 'Hostel Block' && (
                  <Controller name="assignedBlock" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Assigned Block *" error={!!errors.assignedBlock} helperText={errors.assignedBlock?.message}>
                      {blocksList.map(block => (
                        <MenuItem key={block.name} value={block.name}>{block.name}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                )}

                <Controller name="shift" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Shift *" error={!!errors.shift} helperText={errors.shift?.message}>
                    <MenuItem value="Morning">Morning</MenuItem>
                    <MenuItem value="Evening">Evening</MenuItem>
                    <MenuItem value="Night">Night</MenuItem>
                    <MenuItem value="General">General</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 4 — EMERGENCY CONTACT */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Users size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Emergency Contact Information</Typography>
              </SectionHeaderBox>
              <GridBox sx={{ gap: 3 }}>
                <Controller name="emergencyContactName" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Emergency Contact Name *" error={!!errors.emergencyContactName} helperText={errors.emergencyContactName?.message} />
                )} />
                <Controller name="relationship" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Relationship *" error={!!errors.relationship} helperText={errors.relationship?.message}>
                    <MenuItem value="Parent">Parent</MenuItem>
                    <MenuItem value="Spouse">Spouse</MenuItem>
                    <MenuItem value="Sibling">Sibling</MenuItem>
                    <MenuItem value="Relative">Relative</MenuItem>
                    <MenuItem value="Guardian">Guardian</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )} />
                <Controller name="emergencyPhone" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Emergency Phone Number *" error={!!errors.emergencyPhone} helperText={errors.emergencyPhone?.message} />
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 5 — SYSTEM ACCESS */}
          {watchDesignation === 'Warden / Rector' && (
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><Lock size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>System Access</Typography>
                </SectionHeaderBox>
                <Box sx={{ mb: watchGiveSystemAccess ? 3 : 0 }}>
                  <Controller
                    name="giveSystemAccess"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (!e.target.checked) {
                                setValue('username', '');
                                setValue('password', '');
                                setValue('confirmPassword', '');
                              }
                            }}
                            color="primary"
                          />
                        }
                        label="Give System Login Access"
                      />
                    )}
                  />
                </Box>

                {watchGiveSystemAccess && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'fadeIn 0.3s ease-out' }}>
                    <GridBox>
                      <Controller name="username" control={control} render={({ field }) => (
                        <TextField {...field} fullWidth label="Username / Email *" error={!!errors.username} helperText={errors.username?.message} />
                      )} />
                      <Controller name="password" control={control} render={({ field }) => (
                        <TextField
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          fullWidth
                          label="Password *"
                          error={!!errors.password}
                          helperText={errors.password?.message}
                          InputProps={{
                            endAdornment: (
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </IconButton>
                            )
                          }}
                        />
                      )} />
                    </GridBox>
                    <Box sx={{ width: { xs: '100%', sm: '50%' }, pr: { sm: 1.5 } }}>
                      <Controller name="confirmPassword" control={control} render={({ field }) => (
                        <TextField
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          fullWidth
                          label="Confirm Password *"
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword?.message}
                          InputProps={{
                            endAdornment: (
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </IconButton>
                            )
                          }}
                        />
                      )} />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </SectionCard>
          )}

          {/* SECTION 6 — DOCUMENTS UPLOAD */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><FileText size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Documents Upload</Typography>
              </SectionHeaderBox>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Please upload clear copies of the following documents. Supported formats: JPG, PNG, PDF.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                {['Photo', 'ID Proof'].map((doc) => (
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
                            {doc === 'Photo' && photoPreview ? (
                              <img src={photoPreview} alt="Profile Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                            ) : (
                              <CheckCircle2 color={theme.palette.success.main} size={32} style={{ marginBottom: 12 }} />
                            )}
                            <Typography variant="body2" noWrap sx={{ maxWidth: '100%', fontWeight: 600 }} color="textPrimary">
                              {uploadedFiles[doc]}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Upload color={theme.palette.primary.main} size={32} style={{ marginBottom: 12 }} />
                            <Typography variant="subtitle2" color="textPrimary" sx={{ mb: 0.5 }}>
                              Upload {doc}
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
      </PageContainer>

      {/* BOTTOM STICKY ACTION BAR */}
      <Box sx={{
        p: 3, mt: 4,
        mx: { xs: -2, sm: -3, md: -4 },
        mb: { xs: -2, sm: -3, md: -4 },
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'background.paper',
        position: 'sticky',
        bottom: { xs: -16, sm: -24, md: -32 },
        zIndex: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      }}>
        <Button
          variant="text"
          onClick={handleReset}
          disabled={isSubmitting}
          startIcon={<RotateCcw size={18} />}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}
        >
          Reset
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/staff')}
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
              backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' },
              px: 4, py: 1, fontWeight: 600,
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Staff'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
