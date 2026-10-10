import React, { useState, useEffect } from 'react';
import {
  Modal,
  Backdrop,
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Avatar,
  CircularProgress,
  Card,
  useTheme,
} from '@mui/material';
import {
  X,
  GraduationCap,
  Hash,
  BookOpen,
  CalendarDays,
  Users,
  Bed,
} from 'lucide-react';
import { hostel } from '../../api';

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

function StudentCard({ student, index }) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const chipStyle = STATUS_CHIP[student.status] || STATUS_CHIP.Present;

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 2px 4px -1px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 6px 12px -2px rgba(0,0,0,0.1)' },
      }}
    >
      <Avatar
        sx={{
          bgcolor: avatarColor,
          width: 44,
          height: 44,
          fontWeight: 700,
          fontSize: '1rem',
        }}
      >
        {getInitials(student.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {student.name}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {student.regNo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Hash size={12} color="#6366F1" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {student.regNo}
              </Typography>
            </Box>
          )}
          {student.course && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BookOpen size={12} color="#8B5CF6" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {student.course}
              </Typography>
            </Box>
          )}
          {student.year && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarDays size={12} color="#F59E0B" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {student.year.includes('Year') ? student.year : `${student.year} Year`}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default function StudentRoomDetailsModal({
  open,
  onClose,
  allocation,
  currentStudent,
}) {
  const theme = useTheme();
  const room = allocation?.room;
  const [allocatedStudents, setAllocatedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setAllocatedStudents([]);
      return;
    }

    if (!room?.id) {
      // If student has room information in currentStudent but not room.id
      if (currentStudent) {
        setAllocatedStudents([
          {
            id: currentStudent.id,
            name: `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
            regNo: currentStudent.registrationNumber,
            course: currentStudent.courseDetails?.name || currentStudent.course,
            year: currentStudent.yearOfStudy || currentStudent.year,
            status: currentStudent.attendanceStatus || currentStudent.status || 'Present',
          },
        ]);
      }
      return;
    }

    let active = true;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await hostel.getRoomStudents(room.id);
        if (active) {
          const list = res.data || [];
          if (list.length > 0) {
            setAllocatedStudents(list);
          } else if (currentStudent) {
            setAllocatedStudents([
              {
                id: currentStudent.id,
                name: `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
                regNo: currentStudent.registrationNumber,
                course: currentStudent.courseDetails?.name || currentStudent.course,
                year: currentStudent.yearOfStudy || currentStudent.year,
                status: currentStudent.attendanceStatus || currentStudent.status || 'Present',
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch room students:', err);
        if (active && currentStudent) {
          setAllocatedStudents([
            {
              id: currentStudent.id,
              name: `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
              regNo: currentStudent.registrationNumber,
              course: currentStudent.courseDetails?.name || currentStudent.course,
              year: currentStudent.yearOfStudy || currentStudent.year,
              status: currentStudent.attendanceStatus || currentStudent.status || 'Present',
            },
          ]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      active = false;
    };
  }, [open, room, currentStudent]);

  const config = STATUS_CONFIG[room?.status || 'Occupied'] || STATUS_CONFIG.Occupied;
  const capacity = room?.capacity || 2;
  const bedsOccupied = allocatedStudents.length > 0 ? allocatedStudents.length : 1;
  const occupancyPct = capacity > 0 ? Math.min((bedsOccupied / capacity) * 100, 100) : 0;
  const roomNumber = room?.number || allocation?.roomNumber || 'A101';
  const roomType = room?.type || 'Standard';

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
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
          width: { xs: '90%', sm: '580px' },
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
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${config.color}33 0%, ${config.color}11 100%)`,
                  border: `2px solid ${config.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.color,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {roomNumber}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Room {roomNumber}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {roomType} · {capacity} Beds
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={room?.status || 'Occupied'}
                size="small"
                sx={{
                  backgroundColor: config.bg,
                  color: config.color,
                  fontWeight: 600,
                  borderRadius: '6px',
                }}
              />
              <IconButton size="small" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* Occupancy Bar */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Occupancy — {bedsOccupied} / {capacity} beds occupied
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: config.color }}>
                {Math.round(occupancyPct)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={occupancyPct}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: config.progress,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        </Box>

        <Divider />

        {/* Allocated Students Section */}
        <Box sx={{ p: 3, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GraduationCap size={18} color="#6366F1" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Allocated Students
            </Typography>
            {!loading && (
              <Chip
                label={allocatedStudents.length}
                size="small"
                sx={{
                  ml: 0.5,
                  height: 20,
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  color: '#6366F1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={36} sx={{ color: '#6366F1' }} />
            </Box>
          ) : allocatedStudents.length === 0 ? (
            <Box
              sx={{
                py: 5,
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Users size={36} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                No students allocated to this room
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {allocatedStudents.map((student, idx) => (
                <StudentCard key={student.id || idx} student={student} index={idx} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
