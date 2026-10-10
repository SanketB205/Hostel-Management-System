import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  styled,
  TextField,
  MenuItem,
  Modal,
  Backdrop,
  IconButton,
  CircularProgress,
  InputAdornment,
  Chip,
  Avatar,
  Paper,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search,
  X,
  Building2,
  CalendarCheck,
  RotateCcw,
  ArrowRight,
  User,
  DoorOpen,
  FilterX,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { students as studentsApi, hostel as hostelApi } from '../../api';

// ── Styled Components ─────────────────────────────────────────────────────────

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '92%',
  maxWidth: '750px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '20px',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  outline: 'none',
  maxHeight: '88vh',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1402,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    width: '96%',
    maxHeight: '94vh',
    borderRadius: '16px',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(79, 70, 229, 0.1)',
  color: '#4F46E5',
  padding: theme.spacing(1.2),
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const SearchResultCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '14px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: 'none',
  '&:hover': {
    borderColor: '#4F46E5',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.12)',
    transform: 'translateY(-2px)',
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
  },
}));

const STATUS_COLORS = {
  Present: { color: '#16A34A', bg: 'rgba(34,197,94,0.12)', dot: '🟢' },
  Outing: { color: '#D97706', bg: 'rgba(245,158,11,0.12)', dot: '🟡' },
  Leave: { color: '#2563EB', bg: 'rgba(59,130,246,0.12)', dot: '🔵' },
  Late: { color: '#EA580C', bg: 'rgba(249,115,22,0.12)', dot: '🟠' },
  Absent: { color: '#DC2626', bg: 'rgba(239,68,68,0.12)', dot: '🔴' },
  'Not Marked': { color: '#64748B', bg: 'rgba(100,116,139,0.1)', dot: '❓' },
};

export default function StudentSearchModal({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Fetch student list and hostel blocks
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, blocksRes] = await Promise.all([
        studentsApi.list(),
        hostelApi.listBlocks(),
      ]);
      setStudents(studentsRes?.data || []);
      setBlocks(blocksRes?.data || []);
    } catch (err) {
      console.error('Failed to load students/blocks for search modal:', err);
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      setSearchQuery('');
      setSelectedBlock('All');
    }
  }, [open]);

  // Normalise student records with room & block information
  const processedStudents = useMemo(() => {
    return students.map((s) => {
      const activeAlloc = (s.allocations || []).find((a) => a.status === 'active') || s.allocations?.[0];
      const roomObj = activeAlloc?.room;
      const roomNum = roomObj?.number || '—';
      const blockName =
        roomObj?.floor?.block?.name ||
        (roomNum !== '—' && roomNum.match(/^[A-Za-z]/) ? `Block ${roomNum.charAt(0).toUpperCase()}` : '—');
      const blockId = roomObj?.floor?.block?.id || null;

      return {
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed Student',
        regNo: s.registrationNumber || '—',
        room: roomNum,
        blockName: blockName,
        blockId: blockId,
        course: s.courseDetails?.name || s.course || '—',
        year: s.yearOfStudy || s.year || '—',
        status: s.status || 'Not Marked',
      };
    });
  }, [students]);

  // Filter students based on name/registration number and block
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return processedStudents.filter((s) => {
      // Name or Registration Number match
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        (s.room !== '—' && s.room.toLowerCase().includes(q));

      // Block filter
      const matchesBlock = (() => {
        if (selectedBlock === 'All') return true;
        if (s.blockId && s.blockId === selectedBlock) return true;
        if (s.blockName && s.blockName.toLowerCase() === selectedBlock.toLowerCase()) return true;

        // Fallback for block name pattern (e.g. "BLOCK A" vs "Block A" vs "A")
        const cleanSelected = selectedBlock.replace(/^BLOCK\s*/i, '').trim().toUpperCase();
        const cleanStudentBlock = s.blockName.replace(/^BLOCK\s*/i, '').trim().toUpperCase();
        return cleanStudentBlock === cleanSelected || (s.room !== '—' && s.room.toUpperCase().startsWith(cleanSelected));
      })();

      return matchesSearch && matchesBlock;
    });
  }, [processedStudents, searchQuery, selectedBlock]);

  const handleSelectStudent = (studentId) => {
    onClose();
    navigate(`/attendance/student/${studentId}`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBlock('All');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedBlock !== 'All';

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      container={() => document.body}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 400,
          sx: {
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
      }}
    >
      <ModalBox>
        {/* ── Modal Header ── */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            backgroundColor: theme.palette.mode === 'light' ? '#FAFAFA' : 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconWrapper>
              <Users size={24} />
            </IconWrapper>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Select Student for Attendance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search or filter to view individual student attendance records.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* ── Search & Filter Controls ── */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'background.paper',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          {/* Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by student name or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                      <X size={16} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              flex: { sm: 2 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
          />

          {/* Block Dropdown Filter */}
          <TextField
            select
            size="small"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Building2 size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
              },
              select: {
                MenuProps: {
                  sx: { zIndex: 1600 },
                  slotProps: {
                    paper: {
                      sx: { maxHeight: 300, borderRadius: '12px' },
                    },
                  },
                },
              },
            }}
            sx={{
              flex: { sm: 1 },
              minWidth: { sm: 180 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
          >
            <MenuItem value="All">All Blocks</MenuItem>
            {blocks.map((b) => (
              <MenuItem key={b.id || b.name} value={b.id || b.name}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <Tooltip title="Reset filters">
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<FilterX size={16} />}
                sx={{
                  borderRadius: '10px',
                  borderColor: theme.palette.divider,
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  py: 1,
                  '&:hover': {
                    borderColor: '#4F46E5',
                    color: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.05)',
                  },
                }}
              >
                Clear
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* ── Results Container (Scrollable) ── */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 280,
            maxHeight: '52vh',
            backgroundColor: theme.palette.mode === 'light' ? '#F8FAFC' : 'background.default',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              borderRadius: '10px',
            },
            scrollbarWidth: 'thin',
          }}
        >
          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={40} sx={{ color: '#4F46E5' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Loading students and assignments...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {!loading && error && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={fetchData}
                startIcon={<RotateCcw size={16} />}
                sx={{ backgroundColor: '#4F46E5', borderRadius: 2.5, textTransform: 'none' }}
              >
                Retry
              </Button>
            </Box>
          )}

          {/* Empty State */}
          {!loading && !error && filteredStudents.length === 0 && (
            <Box
              sx={{
                py: 6,
                px: 3,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                my: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(100, 116, 139, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  mb: 2,
                }}
              >
                <Search size={28} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                No students found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 2 }}>
                {hasActiveFilters
                  ? 'No students match your current search query or block filter. Try adjusting your filters.'
                  : 'No student records are currently available in the system.'}
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetFilters}
                  startIcon={<RotateCcw size={16} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#4F46E5',
                    color: '#4F46E5',
                  }}
                >
                  Reset Search & Filters
                </Button>
              )}
            </Box>
          )}

          {/* Results List */}
          {!loading &&
            !error &&
            filteredStudents.map((student) => {
              const statusCfg = STATUS_COLORS[student.status] || STATUS_COLORS['Not Marked'];

              return (
                <SearchResultCard key={student.id}>
                  {/* Student Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                    <Avatar
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff`}
                      alt={student.name}
                      sx={{ width: 44, height: 44, borderRadius: '12px', fontWeight: 700, fontSize: '1rem' }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                          {student.name}
                        </Typography>
                        <Chip
                          label={student.regNo}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 22,
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                            color: '#4F46E5',
                          }}
                        />
                      </Box>

                      {/* Details row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Building2 size={14} color={theme.palette.text.secondary} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {student.blockName}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DoorOpen size={14} color={theme.palette.text.secondary} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Room {student.room}
                          </Typography>
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          • {student.course} ({student.year})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Action Button & Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    }}
                  >
                    <Chip
                      label={`${statusCfg.dot} ${student.status}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.color,
                        display: { xs: 'flex', sm: 'none', md: 'flex' },
                      }}
                    />

                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSelectStudent(student.id)}
                      endIcon={<ArrowRight size={16} />}
                      sx={{
                        backgroundColor: '#4F46E5',
                        '&:hover': { backgroundColor: '#4338CA' },
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.85,
                        boxShadow: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View Attendance
                    </Button>
                  </Box>
                </SearchResultCard>
              );
            })}
        </Box>

        {/* ── Modal Footer ── */}
        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.mode === 'light' ? '#FAFAFA' : 'background.paper',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Close
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
}
