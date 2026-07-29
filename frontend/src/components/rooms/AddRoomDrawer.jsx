import React, { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, 
  useTheme, styled, CircularProgress, Card, CardContent
} from '@mui/material';
import { 
  ArrowLeft, Home, Users, Info, Save, RotateCcw
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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
  roomNumber: yup.string().required('Room number is required'),
  block: yup.string().required('Block is required'),
  floorNumber: yup.string()
    .required('Floor number is required')
    .matches(/^[0-9]+$/, 'Floor number must be numeric'),
  roomType: yup.string().required('Room type is required'),
  capacity: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Capacity is required')
    .min(1, 'Minimum capacity is 1'),
  status: yup.string().required('Status is required'),
  remarks: yup.string().nullable(),
});

export default function AddRoomDrawer({ open, onClose, onSave }) {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      roomNumber: '',
      block: '',
      floorNumber: '',
      roomType: '',
      capacity: '',
      status: 'Available',
      remarks: ''
    }
  });

  const onSubmit = async (data, addAnother = false) => {
    setIsSubmitting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = onSave(data);
    setIsSubmitting(false);
    
    if (result && result.success === false) {
      alert(result.message);
      setError('roomNumber', { type: 'manual', message: result.message });
      return;
    }
    
    if (addAnother) {
      reset();
      // Scroll back to top
      const drawerContent = document.getElementById('drawer-form-content');
      if (drawerContent) drawerContent.scrollTop = 0;
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
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
                Add New Room
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Enter the room details to add it into the system.
              </Typography>
            </Box>
          </Box>

          {/* SECTION 1: ROOM INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Home size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>ROOM INFORMATION</Typography>
              </SectionHeaderBox>
              <GridBox>
                <Controller name="roomNumber" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Room Number *" error={!!errors.roomNumber} helperText={errors.roomNumber?.message}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())} />
                )} />
                <Controller name="block" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Block *" error={!!errors.block} helperText={errors.block?.message}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())} />
                )} />
                <Controller name="floorNumber" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Floor Number *" error={!!errors.floorNumber} helperText={errors.floorNumber?.message} />
                )} />
                <Controller name="roomType" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Room Type *" error={!!errors.roomType} helperText={errors.roomType?.message}>
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Deluxe">Deluxe</MenuItem>
                    <MenuItem value="Premium">Premium</MenuItem>
                    <MenuItem value="Suite">Suite</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 2: CAPACITY INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Users size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>CAPACITY INFORMATION</Typography>
              </SectionHeaderBox>
              <GridBox>
                <Controller name="capacity" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Capacity (Beds) *" error={!!errors.capacity} helperText={errors.capacity?.message} />
                )} />
                <Controller name="status" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Status *" error={!!errors.status} helperText={errors.status?.message}>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Reserved">Reserved</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 3: ADDITIONAL INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Info size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>ADDITIONAL INFORMATION</Typography>
              </SectionHeaderBox>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                <Controller name="remarks" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth multiline rows={3} label="Remarks / Notes" error={!!errors.remarks} helperText={errors.remarks?.message} />
                )} />
              </Box>
            </CardContent>
          </SectionCard>

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
              {isSubmitting ? 'Saving...' : 'Save Room'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
