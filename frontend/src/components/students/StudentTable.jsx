import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Present', 'Outing', 'Leave', 'Late', 'Absent'];

const STATUS_COLORS = {
  Present:    { color: '#16A34A', bg: 'rgba(34,197,94,0.12)',   dot: '🟢' },
  Outing:     { color: '#D97706', bg: 'rgba(245,158,11,0.12)',  dot: '🟡' },
  Leave:      { color: '#2563EB', bg: 'rgba(59,130,246,0.12)',  dot: '🔵' },
  Late:       { color: '#EA580C', bg: 'rgba(249,115,22,0.12)',  dot: '🟠' },
  Absent:     { color: '#DC2626', bg: 'rgba(239,68,68,0.12)',   dot: '🔴' },
  'Not Marked':{ color: '#64748B', bg: 'rgba(100,116,139,0.1)', dot: '❓' },
};

// ── Inline status dropdown (rector only) ─────────────────────────────────────

const NOT_MARKED = 'Not Marked';

function StatusCell({ studentId, status, marked, onStatusChange }) {
  const [saving, setSaving] = useState(false);

  // Current display value — always a real string, never empty
  const currentValue = marked ? (status || NOT_MARKED) : NOT_MARKED;
  const cfg = STATUS_COLORS[currentValue] || STATUS_COLORS[NOT_MARKED];

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === NOT_MARKED) return; // guard — shouldn't be selectable
    setSaving(true);
    await onStatusChange(studentId, newStatus);
    setSaving(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Select
        value={currentValue}
        onChange={handleChange}
        disabled={saving}
        size="small"
        variant="outlined"
        displayEmpty
        sx={{
          minWidth: 145,
          fontWeight: 600,
          fontSize: '0.82rem',
          color: cfg.color,
          backgroundColor: cfg.bg,
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg.color + '55',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg.color,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg.color,
          },
          '& .MuiSelect-icon': { color: cfg.color },
        }}
        renderValue={(val) => {
          const c = STATUS_COLORS[val] || STATUS_COLORS[NOT_MARKED];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{c.dot}</span>
              <span>{val}</span>
            </Box>
          );
        }}
      >
        {/* Not Marked — shown at top, disabled so it can't be re-selected */}
        <MenuItem value={NOT_MARKED} disabled sx={{
          opacity: '1 !important',
          fontStyle: 'italic',
          fontSize: '0.82rem',
          color: STATUS_COLORS[NOT_MARKED].color,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS[NOT_MARKED].color, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: STATUS_COLORS[NOT_MARKED].color, fontStyle: 'italic' }}>
              Not Marked
            </Typography>
          </Box>
        </MenuItem>

        {STATUS_OPTIONS.map(opt => {
          const c = STATUS_COLORS[opt];
          return (
            <MenuItem key={opt} value={opt}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: c.color }}>{opt}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {saving && <CircularProgress size={14} sx={{ color: cfg.color }} />}
    </Box>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export default function StudentTable({ students, isRector = false, isAdmin = false, onStatusChange }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  // Track which students the rector has already marked today
  const [markedIds, setMarkedIds] = useState(() => {
    const initialMarked = new Set();
    students.forEach(s => {
      if (s.status && s.status !== 'Not Marked') {
        initialMarked.add(s.id);
      }
    });
    return initialMarked;
  });

  useEffect(() => {
    const newMarked = new Set();
    students.forEach(s => {
      if (s.status && s.status !== 'Not Marked') {
        newMarked.add(s.id);
      }
    });
    setMarkedIds(newMarked);
  }, [students]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
    if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
    return 0;
  });

  const paginatedStudents = sortedStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const headCells = [
    { id: 'name',   label: 'Name' },
    { id: 'regNo',  label: 'Registration Number' },
    { id: 'room',   label: 'Room Number' },
    { id: 'course', label: 'Course' },
    { id: 'year',   label: 'Year' },
    { id: 'status', label: isRector ? 'Mark Attendance' : 'Status' },
    { id: 'actions', label: 'Actions', disableSort: true },
  ];

  const unmarkedCount = students.length - markedIds.size;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {isRector && unmarkedCount > 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.15)',
            borderLeft: '4px solid #F59E0B',
            borderRadius: '8px',
            p: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <AlertCircle size={20} color="#F59E0B" />
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'light' ? '#B45309' : '#FDE68A', fontWeight: 600 }}>
            {unmarkedCount} student{unmarkedCount > 1 ? 's have' : ' has'} not had their attendance marked today.
          </Typography>
        </Box>
      )}
      <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((hc) => (
                <TableCell
                  key={hc.id}
                  align={hc.id === 'actions' ? 'right' : 'left'}
                  sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}
                >
                  {hc.disableSort ? hc.label : (
                    <TableSortLabel
                      active={orderBy === hc.id}
                      direction={orderBy === hc.id ? order : 'asc'}
                      onClick={() => handleRequestSort(hc.id)}
                    >
                      {hc.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No students found matching the criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((row, index) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                    '&:last-child td': { borderBottom: 0 },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.regNo}</TableCell>
                  <TableCell>{row.room}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.year}</TableCell>

                  {/* Status — editable dropdown for rector, read-only chip for admin/others */}
                  <TableCell>
                    {isRector ? (
                      <StatusCell
                        studentId={row.id}
                        status={row.status}
                        marked={markedIds.has(row.id)}
                        onStatusChange={async (id, status) => {
                          await onStatusChange(id, status);
                          setMarkedIds(prev => new Set([...prev, id]));
                        }}
                      />
                    ) : (
                      (() => {
                        // Normalise: treat null/undefined/'Not Marked' uniformly
                        const displayStatus = (row.status && row.status !== 'Not Marked')
                          ? row.status
                          : 'Not Marked';
                        const cfg = STATUS_COLORS[displayStatus] || STATUS_COLORS['Not Marked'];
                        return (
                          <Chip
                            label={`${cfg.dot} ${displayStatus}`}
                            size="small"
                            sx={{ fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}
                          />
                        );
                      })()
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/students/${row.id}`)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)' },
                        }}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={students.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
      </Card>
    </Box>
  );
}
