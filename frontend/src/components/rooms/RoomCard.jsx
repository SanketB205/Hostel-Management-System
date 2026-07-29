import React, { useState } from 'react';
import {
  Box, Card, Typography, LinearProgress, Chip, IconButton,
  Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent,
  Divider, Avatar, CircularProgress
} from '@mui/material';
import {
  MoreVertical, Eye, Users, UserPlus, Edit, X,
  GraduationCap, Hash, BookOpen, CalendarDays
} from 'lucide-react';
import { useRoomContext } from '../../contexts/RoomContext';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allocatedStudents, setAllocatedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const { getStudentsForRoom } = useRoomContext();
  const menuOpen = Boolean(anchorEl);

  const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.Available;
  const bedsOccupied = room.bedsOccupied || 0;
  const occupancyPct = room.capacity > 0 ? Math.min((bedsOccupied / room.capacity) * 100, 100) : 0;

  // Fetch students from backend and open dialog
  const handleViewRoom = async () => {
    setAnchorEl(null);
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
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mt: -0.5, mr: -1 }}>
            <MoreVertical size={16} />
          </IconButton>
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

        {/* Context menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 165, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } }}
        >
          <MenuItem onClick={handleViewRoom} sx={{ fontSize: '0.875rem' }}>
            <ListItemIcon><Eye size={16} /></ListItemIcon> View Room
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: '0.875rem' }}>
            <ListItemIcon><Users size={16} /></ListItemIcon> View Students
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: '0.875rem' }}>
            <ListItemIcon><UserPlus size={16} /></ListItemIcon> Allocate Student
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: '0.875rem' }}>
            <ListItemIcon><Edit size={16} /></ListItemIcon> Edit Room
          </MenuItem>
        </Menu>
      </Card>

      {/* ── View Room Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        {/* Dialog header */}
        <DialogTitle sx={{ p: 3, pb: 2 }}>
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
      </Dialog>
    </>
  );
}
