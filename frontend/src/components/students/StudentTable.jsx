import React, { useState } from 'react';
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
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Present', 'Outing', 'Leave', 'Late', 'Absent'];

const STATUS_COLORS = {
  Present: { color: '#16A34A', bg: 'rgba(34,197,94,0.12)',  dot: '🟢' },
  Outing:  { color: '#D97706', bg: 'rgba(245,158,11,0.12)', dot: '🟡' },
  Leave:   { color: '#2563EB', bg: 'rgba(59,130,246,0.12)', dot: '🔵' },
  Late:    { color: '#EA580C', bg: 'rgba(249,115,22,0.12)', dot: '🟠' },
  Absent:  { color: '#DC2626', bg: 'rgba(239,68,68,0.12)',  dot: '🔴' },
};

// ── Inline status dropdown (rector only) ─────────────────────────────────────

function StatusCell({ studentId, status, marked, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const cfg = marked ? (STATUS_COLORS[status] || STATUS_COLORS.Present) : null;

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setSaving(true);
    await onStatusChange(studentId, newStatus);
    setSaving(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Select
        value={marked ? status : ''}
        onChange={handleChange}
        disabled={saving}
        size="small"
        variant="outlined"
        displayEmpty
        sx={{
          minWidth: 145,
          fontWeight: 600,
          fontSize: '0.82rem',
          color: cfg ? cfg.color : 'text.secondary',
          backgroundColor: cfg ? cfg.bg : 'rgba(0,0,0,0.04)',
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg ? cfg.color + '55' : 'rgba(0,0,0,0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg ? cfg.color : 'rgba(0,0,0,0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: cfg ? cfg.color : '#4F46E5',
          },
          '& .MuiSelect-icon': { color: cfg ? cfg.color : 'text.secondary' },
        }}
        renderValue={(val) => {
          if (!val) {
            return (
              <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.82rem' }}>
                Not Marked
              </Typography>
            );
          }
          const c = STATUS_COLORS[val];
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{c?.dot}</span>
              <span>{val}</span>
            </Box>
          );
        }}
      >
        {/* Placeholder — not selectable */}
        <MenuItem value="" disabled sx={{ display: 'none' }} />
        {STATUS_OPTIONS.map(opt => {
          const c = STATUS_COLORS[opt];
          return (
            <MenuItem key={opt} value={opt}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: c.color, flexShrink: 0,
                }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: c.color }}>{opt}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {saving && <CircularProgress size={14} sx={{ color: cfg ? cfg.color : '#4F46E5' }} />}
    </Box>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export default function StudentTable({ students, isRector = false, onStatusChange }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  // Track which students the rector has already marked today (session-only)
  const [markedIds, setMarkedIds] = useState(new Set());

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

  return (
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

                  {/* Status — editable dropdown for rector, read-only chip for others */}
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
                      <Chip
                        label={`${STATUS_COLORS[row.status]?.dot ?? ''} ${row.status}`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: STATUS_COLORS[row.status]?.bg,
                          color: STATUS_COLORS[row.status]?.color,
                        }}
                      />
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
  );
}
