import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, 
  useTheme, styled, CircularProgress, Card, CardContent, Tooltip,
  Modal, Backdrop, Select, InputLabel, FormControl, FormHelperText
} from '@mui/material';
import { 
  ArrowLeft, Building, ListOrdered, Settings, Save, RotateCcw, Eye, X, SlidersHorizontal
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

// ── Room Configuration Modal ──────────────────────────────────────────────────

const ROOM_TYPES = ['Standard', 'Deluxe', 'Premium', 'Suite'];

function RoomConfigModal({ open, roomNumber, defaultRoomType, defaultCapacity, existingConfig, onSave, onCancel }) {
  const theme = useTheme();
  const [roomType, setRoomType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [capacityError, setCapacityError] = useState('');
  const [roomTypeError, setRoomTypeError] = useState('');

  // Sync state whenever the modal opens or its props change
  useEffect(() => {
    if (open) {
      setRoomType(existingConfig?.roomType || defaultRoomType || 'Standard');
      setCapacity(String(existingConfig?.capacity ?? defaultCapacity ?? ''));
      setCapacityError('');
      setRoomTypeError('');
    }
  }, [open, roomNumber, existingConfig, defaultRoomType, defaultCapacity]);

  const validate = () => {
    let valid = true;
    if (!roomType) {
      setRoomTypeError('Room type is required.');
      valid = false;
    } else {
      setRoomTypeError('');
    }
    const cap = Number(capacity);
    if (!capacity || isNaN(cap) || !Number.isInteger(cap) || cap <= 0) {
      setCapacityError('Bed capacity must be a positive whole number.');
      valid = false;
    } else {
      setCapacityError('');
    }
    return valid;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ roomType, capacity: Number(capacity) });
  };

  // Lock body scroll while open (same as RecordPaymentModal)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      closeAfterTransition
      container={() => document.body}
      disablePortal={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1400,
          },
        },
      }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1401,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Modal panel */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          width: '90%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1402,
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: { xs: 2.5, sm: 3 },
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main + '18',
                color: 'primary.main',
                p: 1,
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              <SlidersHorizontal size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Configure Room
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {roomNumber}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onCancel}
            size="small"
            sx={{ backgroundColor: 'action.hover', '&:hover': { backgroundColor: 'action.selected' } }}
          >
            <X size={18} />
          </IconButton>
        </Box>

        {/* Modal Body */}
        <Box sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Room Number — static display, NOT a focusable/clickable input */}
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}
            >
              Room Number
            </Typography>
            <Box
              sx={{
                px: 1.75,
                py: 1.25,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '4px',
                backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : 'action.hover',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {roomNumber}
              </Typography>
            </Box>
          </Box>

          {/* Room Type — standalone Select portals menu to body above the modal */}
          <FormControl fullWidth error={!!roomTypeError}>
            <InputLabel id="cfg-room-type-label">Room Type *</InputLabel>
            <Select
              labelId="cfg-room-type-label"
              label="Room Type *"
              value={roomType}
              onChange={(e) => { setRoomType(e.target.value); setRoomTypeError(''); }}
              MenuProps={{
                container: document.body,
                PaperProps: {
                  sx: { maxHeight: 240, zIndex: 2000 },
                },
                sx: { zIndex: 2000 },
              }}
            >
              {ROOM_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
            {roomTypeError && <FormHelperText>{roomTypeError}</FormHelperText>}
          </FormControl>

          {/* Bed Capacity — type="text" with integer-only filtering avoids number-input quirks inside Modal */}
          <TextField
            label="Bed Capacity *"
            type="text"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only digits (no decimals, no negatives, no leading zeros beyond '0')
              if (val === '' || /^[1-9][0-9]*$/.test(val)) {
                setCapacity(val);
                setCapacityError('');
              }
            }}
            fullWidth
            error={!!capacityError}
            helperText={capacityError || 'Must be a positive whole number.'}
            placeholder="e.g. 2"
          />
        </Box>

        {/* Modal Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            p: { xs: 2.5, sm: 3 },
            pt: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              px: 3,
              color: 'text.primary',
              borderColor: theme.palette.mode === 'light' ? '#D1D5DB' : 'divider',
              '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              px: 3,
              backgroundColor: '#4F46E5',
              '&:hover': { backgroundColor: '#4338CA' },
              fontWeight: 600,
            }}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

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
  const globalRoomType = useWatch({ control, name: 'roomType' });
  const globalCapacity = useWatch({ control, name: 'capacity' });

  const [previewData, setPreviewData] = useState(null);

  // Map of { [roomNumber]: { roomType, capacity } } for per-room customizations
  const [roomCustomizations, setRoomCustomizations] = useState({});

  // Modal state
  const [modalState, setModalState] = useState({ open: false, roomNumber: null });

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
    
    // Pass the previewData and roomCustomizations so parent can apply per-room settings
    const result = onSave({ ...data, generatedRooms: previewData, roomCustomizations });
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
    setRoomCustomizations({});
    setModalState({ open: false, roomNumber: null });
    onClose();
  };

  const handleRoomChipClick = (roomNumber) => {
    setModalState({ open: true, roomNumber });
  };

  const handleModalSave = ({ roomType, capacity }) => {
    setRoomCustomizations(prev => ({
      ...prev,
      [modalState.roomNumber]: { roomType, capacity },
    }));
    setModalState({ open: false, roomNumber: null });
  };

  const handleModalCancel = () => {
    setModalState({ open: false, roomNumber: null });
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Total Rooms To Be Created: {previewData.totalRoomsCount}
                    </Typography>
                    {Object.keys(roomCustomizations).length > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <Box component="span" sx={{ color: '#4F46E5', fontWeight: 600 }}>
                          {Object.keys(roomCustomizations).length}
                        </Box>{' '}room{Object.keys(roomCustomizations).length !== 1 ? 's' : ''} customized
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                    Click any room number to customize its type and bed capacity individually.
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
                          {floorObj.rooms.slice(0, 10).map((rm) => {
                            const isCustomized = !!roomCustomizations[rm];
                            const cfg = roomCustomizations[rm];
                            const tooltipTitle = isCustomized
                              ? `Custom: ${cfg.roomType} · ${cfg.capacity} bed${cfg.capacity !== 1 ? 's' : ''}`
                              : 'Click to customize this room';
                            return (
                              <Tooltip key={rm} title={tooltipTitle} arrow placement="top">
                                <Box
                                  onClick={() => handleRoomChipClick(rm)}
                                  sx={{
                                    position: 'relative',
                                    px: 1.5,
                                    py: 0.5,
                                    backgroundColor: isCustomized
                                      ? 'rgba(79,70,229,0.08)'
                                      : 'background.paper',
                                    border: '1px solid',
                                    borderColor: isCustomized ? '#4F46E5' : 'divider',
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: isCustomized ? 600 : 400,
                                    color: isCustomized ? '#4F46E5' : 'text.primary',
                                    userSelect: 'none',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      backgroundColor: isCustomized ? 'rgba(79,70,229,0.14)' : 'action.hover',
                                      borderColor: '#4F46E5',
                                      color: '#4F46E5',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 2px 6px rgba(79,70,229,0.2)',
                                    },
                                  }}
                                >
                                  {rm}
                                  {isCustomized && (
                                    <Box
                                      component="span"
                                      sx={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: '#4F46E5',
                                        border: '1.5px solid',
                                        borderColor: 'background.paper',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Tooltip>
                            );
                          })}
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
                          {floorObj.rooms.length > 10 && (() => {
                            const rm = floorObj.rooms[floorObj.rooms.length - 1];
                            const isCustomized = !!roomCustomizations[rm];
                            const cfg = roomCustomizations[rm];
                            const tooltipTitle = isCustomized
                              ? `Custom: ${cfg.roomType} · ${cfg.capacity} bed${cfg.capacity !== 1 ? 's' : ''}`
                              : 'Click to customize this room';
                            return (
                              <Tooltip key={rm} title={tooltipTitle} arrow placement="top">
                                <Box
                                  onClick={() => handleRoomChipClick(rm)}
                                  sx={{
                                    position: 'relative',
                                    px: 1.5,
                                    py: 0.5,
                                    backgroundColor: isCustomized ? 'rgba(79,70,229,0.08)' : 'background.paper',
                                    border: '1px solid',
                                    borderColor: isCustomized ? '#4F46E5' : 'divider',
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: isCustomized ? 600 : 400,
                                    color: isCustomized ? '#4F46E5' : 'text.primary',
                                    userSelect: 'none',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      backgroundColor: isCustomized ? 'rgba(79,70,229,0.14)' : 'action.hover',
                                      borderColor: '#4F46E5',
                                      color: '#4F46E5',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 2px 6px rgba(79,70,229,0.2)',
                                    },
                                  }}
                                >
                                  {rm}
                                  {isCustomized && (
                                    <Box
                                      component="span"
                                      sx={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: '#4F46E5',
                                        border: '1.5px solid',
                                        borderColor: 'background.paper',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Tooltip>
                            );
                          })()}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </SectionCard>

        </FormContainer>

        {/* Room Configuration Modal */}
        <RoomConfigModal
          open={modalState.open}
          roomNumber={modalState.roomNumber}
          defaultRoomType={globalRoomType}
          defaultCapacity={globalCapacity}
          existingConfig={modalState.roomNumber ? roomCustomizations[modalState.roomNumber] : undefined}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />


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
            onClick={() => { reset(); setPreviewData(null); setRoomCustomizations({}); }} 
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
