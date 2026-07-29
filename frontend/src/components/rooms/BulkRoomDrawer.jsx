import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, 
  useTheme, styled, CircularProgress, Card, CardContent
} from '@mui/material';
import { 
  ArrowLeft, Building, ListOrdered, Settings, Save, RotateCcw, Eye
} from 'lucide-react';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
  blockName: yup.string().required('Block Name is required'),
  totalFloors: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Total Floors is required')
    .positive('Must be greater than 0'),
  roomsPerFloor: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Rooms Per Floor is required')
    .positive('Must be greater than 0'),
  startingRoomNumber: yup.string()
    .required('Starting Room Number is required')
    .matches(/^[0-9]+$/, 'Must be numeric'),
  roomNumberFormat: yup.string().required('Room Number Format is required'),
  roomType: yup.string().required('Room Type is required'),
  capacity: yup.number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required('Capacity is required')
    .positive('Must be greater than 0'),
  defaultStatus: yup.string().required('Default Status is required'),
});

export default function BulkRoomDrawer({ open, onClose, onSave }) {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      blockName: '',
      totalFloors: '',
      roomsPerFloor: '',
      startingRoomNumber: '',
      roomNumberFormat: 'Block + Floor + Room Number',
      roomType: '',
      capacity: '',
      defaultStatus: 'Available',
    }
  });

  const blockName = useWatch({ control, name: 'blockName' });
  const totalFloors = useWatch({ control, name: 'totalFloors' });
  const roomsPerFloor = useWatch({ control, name: 'roomsPerFloor' });
  const startingRoomNumber = useWatch({ control, name: 'startingRoomNumber' });
  const roomNumberFormat = useWatch({ control, name: 'roomNumberFormat' });

  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (blockName && totalFloors > 0 && roomsPerFloor > 0 && startingRoomNumber && /^[0-9]+$/.test(startingRoomNumber)) {
      const floors = [];
      let totalRoomsCount = 0;
      let startNum = parseInt(startingRoomNumber, 10);
      if (isNaN(startNum)) {
        setPreviewData(null);
        return;
      }

      // Always use uppercase block prefix so rooms like C101/D201 are consistent
      const blockPrefix = blockName.replace(/^block\s*/i, '').trim().toUpperCase();
      const baseSuffix = startNum % 100;

      for (let i = 1; i <= totalFloors; i++) {
        const floorRooms = [];
        const floorBase = i * 100 + baseSuffix;
        
        for (let j = 0; j < roomsPerFloor; j++) {
          let roomStr = '';
          const currentNum = floorBase + j;
          if (roomNumberFormat === 'Block + Floor + Room Number') {
            roomStr = `${blockPrefix}${currentNum}`;
          } else {
            roomStr = `${currentNum}`;
          }
          floorRooms.push(roomStr);
          totalRoomsCount++;
        }
        floors.push({ floor: i, rooms: floorRooms });
      }
      setPreviewData({ floors, totalRoomsCount });
    } else {
      setPreviewData(null);
    }
  }, [blockName, totalFloors, roomsPerFloor, startingRoomNumber, roomNumberFormat]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Pass the previewData along with form data so parent knows the exact rooms generated
    const result = onSave({ ...data, generatedRooms: previewData });
    setIsSubmitting(false);
    
    if (result && result.success === false) {
      alert(result.message);
      return;
    }
    
    handleClose();
  };

  const handleClose = () => {
    reset();
    setPreviewData(null);
    onClose();
  };

  const handlePreviewScroll = () => {
    const el = document.getElementById('preview-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
                Bulk Room Creation
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Configure block and floor rules to generate multiple rooms at once.
              </Typography>
            </Box>
          </Box>

          {/* SECTION 1: BLOCK INFORMATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Building size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>BLOCK INFORMATION</Typography>
              </SectionHeaderBox>
              <GridBox>
                <Controller name="blockName" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Block Name *" error={!!errors.blockName} helperText={errors.blockName?.message}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())} />
                )} />
                <Controller name="totalFloors" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Total Floors *" error={!!errors.totalFloors} helperText={errors.totalFloors?.message} />
                )} />
                <Controller name="roomsPerFloor" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Rooms Per Floor *" error={!!errors.roomsPerFloor} helperText={errors.roomsPerFloor?.message} />
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 2: ROOM NUMBER CONFIGURATION */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><ListOrdered size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>ROOM NUMBER CONFIGURATION</Typography>
              </SectionHeaderBox>
              <GridBox>
                <Controller name="startingRoomNumber" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth label="Starting Room Number *" error={!!errors.startingRoomNumber} helperText={errors.startingRoomNumber?.message || "E.g. 101"} />
                )} />
                <Controller name="roomNumberFormat" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Room Number Format *" error={!!errors.roomNumberFormat} helperText={errors.roomNumberFormat?.message}>
                    <MenuItem value="Block + Floor + Room Number">Block + Floor + Room Number</MenuItem>
                    <MenuItem value="Numeric Only">Numeric Only</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 3: DEFAULT ROOM SETTINGS */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Settings size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>DEFAULT ROOM SETTINGS</Typography>
              </SectionHeaderBox>
              <GridBox>
                <Controller name="roomType" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Room Type *" error={!!errors.roomType} helperText={errors.roomType?.message}>
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Deluxe">Deluxe</MenuItem>
                    <MenuItem value="Premium">Premium</MenuItem>
                    <MenuItem value="Suite">Suite</MenuItem>
                  </TextField>
                )} />
                <Controller name="capacity" control={control} render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Capacity (Beds) *" error={!!errors.capacity} helperText={errors.capacity?.message} />
                )} />
                <Controller name="defaultStatus" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Default Status *" error={!!errors.defaultStatus} helperText={errors.defaultStatus?.message}>
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Reserved">Reserved</MenuItem>
                  </TextField>
                )} />
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* SECTION 4: ROOM PREVIEW */}
          <SectionCard id="preview-section">
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Eye size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>ROOM PREVIEW</Typography>
              </SectionHeaderBox>
              
              {!previewData ? (
                <Box sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fill in the Block Information and Room Number Configuration to see a preview of the generated rooms.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Total Rooms To Be Created: {previewData.totalRoomsCount}
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 300, 
                    overflowY: 'auto', 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: 'background.default'
                  }}>
                    {previewData.floors.map((floorObj) => (
                      <Box key={floorObj.floor} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                          Floor {floorObj.floor}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {floorObj.rooms.slice(0, 10).map((rm) => (
                            <Box 
                              key={rm} 
                              sx={{ 
                                px: 1.5, 
                                py: 0.5, 
                                backgroundColor: 'background.paper', 
                                border: '1px solid', 
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontSize: '0.875rem'
                              }}
                            >
                              {rm}
                            </Box>
                          ))}
                          {floorObj.rooms.length > 10 && (
                            <Box 
                              sx={{ 
                                px: 1.5, 
                                py: 0.5, 
                                backgroundColor: 'transparent', 
                                color: 'text.secondary',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              ...
                            </Box>
                          )}
                          {floorObj.rooms.length > 10 && (
                            <Box 
                              sx={{ 
                                px: 1.5, 
                                py: 0.5, 
                                backgroundColor: 'background.paper', 
                                border: '1px solid', 
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontSize: '0.875rem'
                              }}
                            >
                              {floorObj.rooms[floorObj.rooms.length - 1]}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
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
            onClick={() => { reset(); setPreviewData(null); }} 
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
              onClick={handlePreviewScroll}
              disabled={isSubmitting || !previewData}
              sx={{ display: { xs: 'none', sm: 'flex' }, px: 3, py: 1 }}
            >
              Preview Rooms
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !previewData}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
              sx={{ 
                backgroundColor: '#4F46E5', 
                '&:hover': { backgroundColor: '#4338CA' },
                px: 4, 
                py: 1,
                fontWeight: 600
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Rooms'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
