import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, LinearProgress, Chip, IconButton,
  Modal, Backdrop, DialogTitle, DialogContent, DialogActions, Button,
  Divider, Avatar, CircularProgress, Tooltip, Snackbar, Alert
} from '@mui/material';
import {
  Eye, Users, X,
  GraduationCap, Hash, BookOpen, CalendarDays, Trash2
} from 'lucide-react';
import { useRoomContext } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';
import { hostel } from '../../api';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Available:   { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   progress: '#22C55E' },
  Occupied:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  progress: '#F59E0B' },
  Full:        { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   progress: '#EF4444' },
  Maintenance: { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  progress: '#F97316' },
  Reserved:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  progress: '#3B82F6' },
};

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6',
];

const STATUS_CHIP = {
  Present: { bg: 'rgba(34,197,94,0.12)',   color: '#16A34A' },
  Absent:  { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  Outing:  { bg: 'rgba(59,130,246,0.12)',  color: '#2563EB' },
  Leave:   { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  Late:    { bg: 'rgba(99,102,241,0.12)',  color: '#4F46E5' },
};

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── StudentCard ───────────────────────────────────────────────────────────────

function StudentCard({ student, index }) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const chipStyle = STATUS_CHIP[student.status] || STATUS_CHIP.Late;

  return (
    <Card sx={{
      p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', gap: 2,
      boxShadow: '0 2px 4px -1px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 6px 12px -2px rgba(0,0,0,0.1)' }
    }}>
      <Avatar sx={{ bgcolor: avatarColor, width: 44, height: 44, fontWeight: 700, fontSize: '1rem' }}>
        {getInitials(student.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {student.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Hash size={12} color="#6366F1" />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{student.regNo}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BookOpen size={12} color="#8B5CF6" />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{student.course}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarDays size={12} color="#F59E0B" />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{student.year} Year</Typography>
          </Box>
        </Box>
      </Box>

      <Chip
        label={student.status}
        size="small"
        sx={{ fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, backgroundColor: chipStyle.bg, color: chipStyle.color }}
      />
    </Card>
  );
}

// ── RoomCard ──────────────────────────────────────────────────────────────────

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [allocatedStudents, setAllocatedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { getStudentsForRoom, fetchBlocks } = useRoomContext();

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (dialogOpen || deleteConfirmOpen || deleteWarningOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [dialogOpen, deleteConfirmOpen, deleteWarningOpen]);

  const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.Available;
  const bedsOccupied = room.bedsOccupied || 0;
  const occupancyPct = room.capacity > 0 ? Math.min((bedsOccupied / room.capacity) * 100, 100) : 0;

  const handleViewRoom = async () => {
    setDialogOpen(true);
    setStudentsLoading(true);
    const data = await getStudentsForRoom(room.id);
    setAllocatedStudents(data);
    setStudentsLoading(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setAllocatedStudents([]);
  };

  const handleDeleteClick = () => {
    if (allocatedStudents.length > 0) {
      setDeleteWarningOpen(true);
    } else {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await hostel.deleteRoom(room.id);
      setDeleteConfirmOpen(false);
      setDialogOpen(false);
      if (fetchBlocks) {
        await fetchBlocks(true);
      }
      setSnackbar({ open: true, message: `Room ${room.number} deleted successfully.`, severity: 'success' });
    } catch (err) {
      console.error('Failed to delete room:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete room.', severity: 'error' });
    }
  };

  return (
    <>
      {/* ── Room Card ── */}
      <Card sx={{
        p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider',
        borderTop: `4px solid ${config.color}`,
        boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
      }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{room.number}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{room.type}</Typography>
          </Box>
          <Tooltip title="View Room">
            <IconButton
              size="small"
              onClick={handleViewRoom}
              sx={{
                mt: -0.5, mr: -1,
                color: 'text.secondary',
                '&:hover': { color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.08)' },
              }}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Beds */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1, color: 'text.secondary' }}>
          <Users size={16} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{bedsOccupied} / {room.capacity} Beds</Typography>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Progress</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{Math.round(occupancyPct)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={occupancyPct} sx={{
            height: 6, borderRadius: 3,
            backgroundColor: 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': { backgroundColor: config.progress, borderRadius: 3 }
          }} />
        </Box>

        {/* Status chip */}
        <Chip label={room.status} size="small" sx={{
          backgroundColor: config.bg, color: config.color,
          fontWeight: 600, width: '100%', borderRadius: '6px'
        }} />
      </Card>

      {/* ── View Room Dialog ── */}
      <Modal
        open={dialogOpen}
        onClose={handleCloseDialog}
        closeAfterTransition
        disablePortal={false}
        disableScrollLock={false}
        keepMounted={false}
        container={() => document.body}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
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
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '90%', sm: '600px' },
            maxWidth: '95vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            outline: 'none',
            zIndex: 1401,
            overflow: 'hidden',
          }}
        >
        {/* Dialog header */}
        <DialogTitle component="div" sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '10px',
                background: `linear-gradient(135deg, ${config.color}33 0%, ${config.color}11 100%)`,
                border: `2px solid ${config.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: config.color, fontWeight: 700, fontSize: '0.85rem',
              }}>
                {room.number}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Room {room.number}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{room.type} · {room.capacity} Beds</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={room.status} size="small" sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 600, borderRadius: '6px' }} />
              <IconButton size="small" onClick={handleCloseDialog}><X size={18} /></IconButton>
            </Box>
          </Box>

          {/* Occupancy bar */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Occupancy — {bedsOccupied} / {room.capacity} beds occupied
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: config.color }}>{Math.round(occupancyPct)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={occupancyPct} sx={{
              height: 6, borderRadius: 3,
              backgroundColor: 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': { backgroundColor: config.progress, borderRadius: 3 }
            }} />
          </Box>
        </DialogTitle>

        <Divider />

        {/* Students list */}
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GraduationCap size={18} color="#6366F1" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Allocated Students</Typography>
            {!studentsLoading && (
              <Chip
                label={allocatedStudents.length}
                size="small"
                sx={{ ml: 0.5, height: 20, backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366F1', fontWeight: 700, fontSize: '0.75rem' }}
              />
            )}
          </Box>

          {studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={36} sx={{ color: '#6366F1' }} />
            </Box>
          ) : allocatedStudents.length === 0 ? (
            <Box sx={{
              py: 5, textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px',
              border: '1px dashed', borderColor: 'divider'
            }}>
              <Users size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                No students allocated to this room
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Use "Allocate Student" to assign students
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {allocatedStudents.map((student, idx) => (
                <StudentCard key={student.id} student={student} index={idx} />
              ))}
            </Box>
          )}
        </DialogContent>
        {isAdmin && (
          <>
            <Divider />
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={handleDeleteClick}
                sx={{
                  backgroundColor: '#DC2626',
                  '&:hover': { backgroundColor: '#B91C1C' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1
                }}
              >
                Delete Room
              </Button>
            </DialogActions>
          </>
        )}
        </Box>
      </Modal>

      {/* ── Cannot Delete Room Warning Dialog ── */}
      <Modal
        open={deleteWarningOpen}
        onClose={() => setDeleteWarningOpen(false)}
        closeAfterTransition
        disablePortal={false}
        disableScrollLock={false}
        keepMounted={false}
        container={() => document.body}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
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
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '90%', sm: '600px' },
            maxWidth: '95vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            outline: 'none',
            zIndex: 1401,
            overflow: 'hidden',
          }}
        >
        <DialogTitle component="div" sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444'
          }}>
            <Trash2 size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Cannot Delete Room</Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            This room currently has students allocated. Transfer all students before deleting this room.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allocatedStudents.map(student => (
              <Box key={student.id} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.01)'
              }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{student.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Reg No: {student.regNo}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Current Room: {room.number}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setDeleteWarningOpen(false);
                    setDialogOpen(false);
                    navigate(`/students/edit/${student.id}?focus=hostel`);
                  }}
                  sx={{
                    backgroundColor: '#4F46E5',
                    '&:hover': { backgroundColor: '#4338CA' },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '6px',
                    px: 2
                  }}
                >
                  Transfer
                </Button>
              </Box>
            ))}
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteWarningOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
        </Box>
      </Modal>

      {/* ── Normal Delete Confirmation Dialog ── */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        closeAfterTransition
        disablePortal={false}
        disableScrollLock={false}
        keepMounted={false}
        container={() => document.body}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
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
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '90%', sm: '400px' },
            maxWidth: '95vw',
            backgroundColor: 'background.paper',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            outline: 'none',
            zIndex: 1401,
          }}
        >
        <DialogTitle component="div" sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Delete Room</Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete Room <strong>{room.number}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRoom}
            sx={{
              backgroundColor: '#DC2626',
              '&:hover': { backgroundColor: '#B91C1C' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Delete
          </Button>
        </DialogActions>
        </Box>
      </Modal>

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
    </>
  );
}
