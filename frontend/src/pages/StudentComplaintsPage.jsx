import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, InputBase, Select, MenuItem,
  FormControl, InputLabel, Button, Drawer, useTheme,
  styled, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import {
  ClipboardList, Clock, RefreshCw, CheckCircle2,
  Search, RotateCcw, Plus, Eye, X,
  AlertCircle, FileText, AlignLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { complaints as complaintsApi } from '../api';

// ─── Design tokens (matching HostelSpace design system) ───────────────────────
const INDIGO = '#4F46E5';
const INDIGO_HOVER = '#4338CA';

const STATUS_META = {
  Pending:     { color: '#D97706', bg: 'rgba(245,158,11,0.1)',  dot: '🟠' },
  'In Progress':{ color: '#2563EB', bg: 'rgba(59,130,246,0.1)', dot: '🔵' },
  Resolved:    { color: '#16A34A', bg: 'rgba(34,197,94,0.1)',   dot: '🟢' },
  Rejected:    { color: '#DC2626', bg: 'rgba(239,68,68,0.1)',   dot: '🔴' },
};

const PRIORITY_META = {
  Low:    { color: '#16A34A', bg: 'rgba(34,197,94,0.1)',  dot: '🟢' },
  Medium: { color: '#D97706', bg: 'rgba(245,158,11,0.1)', dot: '🟡' },
  High:   { color: '#DC2626', bg: 'rgba(239,68,68,0.1)', dot: '🔴' },
};

const CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'Internet', 'Cleaning', 'Other'];

// ─── Styled helpers (identical to AddStudentDrawer) ───────────────────────────
const SectionCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
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

// ─── Mock data generator (scoped to current student) ─────────────────────────
let nextId = 1;
function makeId() { return `CMP${String(nextId++).padStart(3, '0')}`; }


// ─── Sub-components ───────────────────────────────────────────────────────────

/** Helper: format a DB date to "20-Jun-2026" style */
function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch (_) { return val; }
}

/** Map a raw API complaint to the shape the UI components expect */
function normalize(c) {
  return {
    complaintId:     c.complaintNumber,
    id:              c.id,
    category:        c.category,
    title:           c.title,
    priority:        c.priority,
    status:          c.status,
    date:            fmtDate(c.createdAt),
    lastUpdated:     fmtDate(c.updatedAt),
    description:     c.description,
    attachment:      c.attachmentName || null,
    resolvedBy:      c.resolvedBy ? `${c.resolvedBy.firstName} ${c.resolvedBy.lastName}` : null,
    resolutionNotes: c.resolutionNotes || null,
    resolvedDate:    fmtDate(c.resolvedAt),
    timeline: (c.timeline || []).map((t, i, arr) => ({
      label: t.label,
      date:  fmtDate(t.createdAt),
      done:  true,
      // Mark the last entry as not done only if the complaint isn't terminal
      ...(i === arr.length - 1 && !['Resolved', 'Rejected'].includes(c.status)
        ? {}
        : {}),
    })),
  };
}

/** 4 summary stat cards */
function StudentComplaintStats({ complaints }) {
  const stats = [
    {
      id: 'total', title: 'Total Complaints', icon: ClipboardList,
      count: complaints.length,
      subtitle: 'Total complaints submitted by me.',
      color: '#6366F1', bg: 'rgba(99,102,241,0.1)',
    },
    {
      id: 'pending', title: 'Pending', icon: Clock,
      count: complaints.filter(c => c.status === 'Pending').length,
      subtitle: 'Waiting for hostel staff.',
      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
    },
    {
      id: 'inprogress', title: 'In Progress', icon: RefreshCw,
      count: complaints.filter(c => c.status === 'In Progress').length,
      subtitle: 'Currently being resolved.',
      color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
    },
    {
      id: 'resolved', title: 'Resolved', icon: CheckCircle2,
      count: complaints.filter(c => c.status === 'Resolved').length,
      subtitle: 'Successfully resolved complaints.',
      color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
      {stats.map(({ id, title, icon: Icon, count, subtitle, color, bg }) => (
        <Card key={id} sx={{
          p: 3, display: 'flex', flexDirection: 'column', height: '100%',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, mr: 2 }}>
              <Icon size={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>{title}</Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '28px', sm: '32px' } }}>{count}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{subtitle}</Typography>
        </Card>
      ))}
    </Box>
  );
}

/** Filters bar */
function StudentComplaintFilters({ filters, setFilters, onReset, onRaise }) {
  const theme = useTheme();
  const handle = (field) => (e) => setFilters(f => ({ ...f, [field]: e.target.value }));

  return (
    <Card sx={{ p: 3, mb: 4, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        {/* Search */}
        <Box sx={{
          display: 'flex', alignItems: 'center', flex: 1,
          backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider',
          borderRadius: 2, px: 2, py: 1, transition: 'border-color 0.2s',
          '&:focus-within': { borderColor: INDIGO },
        }}>
          <Search size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />
          <InputBase
            placeholder="Search Complaint..."
            value={filters.search}
            onChange={handle('search')}
            sx={{ width: '100%' }}
          />
        </Box>
        {/* Dropdowns + actions */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status} label="Status" onChange={handle('status')}>
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Category</InputLabel>
            <Select value={filters.category} label="Category" onChange={handle('category')}>
              <MenuItem value="All">All Categories</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={filters.priority} label="Priority" onChange={handle('priority')}>
              <MenuItem value="All">All Priorities</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RotateCcw size={16} />} onClick={onReset}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}>
            Reset
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={onRaise}
            sx={{ backgroundColor: INDIGO, '&:hover': { backgroundColor: INDIGO_HOVER } }}>
            Raise Complaint
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

/** Complaint table — student columns only */
function StudentComplaintTable({ complaints, onView }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');

  const handleSort = (col) => {
    setOrder(orderBy === col && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(col);
  };

  const sorted = [...complaints].sort((a, b) => {
    if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
    if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
    return 0;
  });

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const cols = [
    { id: 'complaintId', label: 'Complaint ID' },
    { id: 'category',    label: 'Category' },
    { id: 'title',       label: 'Title' },
    { id: 'priority',    label: 'Priority' },
    { id: 'status',      label: 'Status' },
    { id: 'date',        label: 'Submitted Date' },
    { id: 'lastUpdated', label: 'Last Updated' },
    { id: 'actions',     label: 'Actions', noSort: true },
  ];

  return (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {cols.map(col => (
                <TableCell key={col.id} align={col.id === 'actions' ? 'right' : 'left'}
                  sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                  {col.noSort ? col.label : (
                    <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No complaints found.</Typography>
                </TableCell>
              </TableRow>
            ) : paged.map((row, i) => (
              <TableRow key={row.complaintId} hover
                sx={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.complaintId}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.title}>{row.title}</TableCell>
                <TableCell>
                  <Chip label={`${PRIORITY_META[row.priority]?.dot} ${row.priority}`} size="small"
                    sx={{ fontWeight: 600, backgroundColor: PRIORITY_META[row.priority]?.bg, color: PRIORITY_META[row.priority]?.color }} />
                </TableCell>
                <TableCell>
                  <Chip label={`${STATUS_META[row.status]?.dot} ${row.status}`} size="small"
                    sx={{ fontWeight: 600, backgroundColor: STATUS_META[row.status]?.bg, color: STATUS_META[row.status]?.color }} />
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.lastUpdated}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => onView(row)}
                      sx={{ color: 'text.secondary', '&:hover': { color: INDIGO, backgroundColor: 'rgba(79,70,229,0.1)' } }}>
                      <Eye size={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]} component="div"
        count={complaints.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Card>
  );
}

// ─── View Complaint Drawer — full-page form style (read-only for student) ─────
function ViewComplaintDrawer({ complaint, open, onClose }) {
  const theme = useTheme();
  if (!complaint) return null;

  const sm = STATUS_META[complaint.status] || {};
  const pm = PRIORITY_META[complaint.priority] || {};

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          maxWidth: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          top: '72px',
          height: 'calc(100% - 72px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Scrollable form body ── */}
        <Box sx={{
          flex: 1, overflowY: 'auto',
          p: { xs: 2, sm: 3, md: 4 },
          display: 'flex', flexDirection: 'column', gap: 4,
          backgroundColor: theme.palette.mode === 'light' ? '#F3F4F6' : 'background.default',
        }}>

          {/* Page-style header with back arrow */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <IconButton onClick={onClose} sx={{ backgroundColor: 'action.hover' }}>
              <X size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Complaint Details
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {complaint.complaintId} — View your complaint status and timeline.
              </Typography>
            </Box>
          </Box>

          {/* ── SECTION 1: Complaint Information ── */}
          <SectionCard>
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><AlertCircle size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Information</Typography>
              </SectionHeaderBox>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}>
                {[
                  { label: 'Complaint ID',   value: complaint.complaintId },
                  { label: 'Category',       value: complaint.category },
                  { label: 'Submitted Date', value: complaint.date },
                  { label: 'Last Updated',   value: complaint.lastUpdated },
                  {
                    label: 'Priority',
                    value: (
                      <Chip label={`${pm.dot} ${complaint.priority}`} size="small"
                        sx={{ fontWeight: 600, backgroundColor: pm.bg, color: pm.color }} />
                    ),
                  },
                  {
                    label: 'Current Status',
                    value: (
                      <Chip label={`${sm.dot} ${complaint.status}`} size="small"
                        sx={{ fontWeight: 600, backgroundColor: sm.bg, color: sm.color }} />
                    ),
                  },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {label}
                    </Typography>
                    {React.isValidElement(value) ? (
                      <Box sx={{ mt: 0.5 }}>{value}</Box>
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                        {value || '—'}
                      </Typography>
                    )}
                  </Box>
                ))}
                {/* Title — full width */}
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <Typography variant="caption" color="text.secondary"
                    sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Title
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                    {complaint.title}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </SectionCard>

          {/* ── SECTION 2: Complaint Description ── */}
          <SectionCard>
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><AlignLeft size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Description</Typography>
              </SectionHeaderBox>
              <Box sx={{
                p: 2.5,
                backgroundColor: 'background.default',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <Typography variant="body2" sx={{ lineHeight: 1.85, color: 'text.secondary' }}>
                  {complaint.description || 'No description provided.'}
                </Typography>
              </Box>
            </Box>
          </SectionCard>

          {/* ── SECTION 3: Attachment ── */}
          <SectionCard>
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><FileText size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Attachment</Typography>
              </SectionHeaderBox>
              {complaint.attachment ? (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  p: 2, borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: 'background.default',
                  maxWidth: 400,
                }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: INDIGO, flexShrink: 0,
                  }}>
                    <FileText size={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{complaint.attachment}</Typography>
                    <Typography variant="caption" color="text.secondary">Uploaded attachment</Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{
                  p: 3, borderRadius: 2, textAlign: 'center',
                  border: `2px dashed ${theme.palette.divider}`,
                  backgroundColor: 'background.default',
                  color: 'text.secondary', maxWidth: 400,
                }}>
                  <FileText size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <Typography variant="body2">No attachment uploaded.</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>

          {/* ── SECTION 4: Complaint Timeline ── */}
          <SectionCard>
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><Clock size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Timeline</Typography>
              </SectionHeaderBox>
              <Box sx={{ position: 'relative', pl: 3, maxWidth: 520 }}>
                <Box sx={{
                  position: 'absolute', left: 7, top: 14, bottom: 14,
                  width: 2, backgroundColor: theme.palette.divider,
                }} />
                {(complaint.timeline || []).map((step, i, arr) => {
                  const isLast = i === arr.length - 1;
                  const isResolved = complaint.status === 'Resolved' && isLast;
                  const dotColor = isResolved ? '#10B981' : step.done ? INDIGO : theme.palette.action.disabled;
                  const glowColor = step.done ? (isResolved ? '#10B981' : INDIGO) : null;
                  return (
                    <Box key={i} sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 2,
                      mb: isLast ? 0 : 3.5, position: 'relative',
                    }}>
                      <Box sx={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, mt: 0.3, zIndex: 1,
                        backgroundColor: dotColor,
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: glowColor ? `0 0 0 2px ${glowColor}` : 'none',
                      }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: step.done ? 600 : 400, color: step.done ? 'text.primary' : 'text.disabled' }}>
                          {step.label}
                        </Typography>
                        {step.date && step.date !== '—' && (
                          <Typography variant="caption" color="text.secondary">{step.date}</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </SectionCard>

          {/* ── SECTION 5: Resolution — only when resolved ── */}
          {complaint.status === 'Resolved' && (
            <SectionCard>
              <Box sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <Box sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981', p: 1, borderRadius: '8px', display: 'flex' }}>
                    <CheckCircle2 size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Resolution Details</Typography>
                </SectionHeaderBox>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 3,
                }}>
                  {[
                    { label: 'Resolved By',   value: complaint.resolvedBy },
                    { label: 'Resolved Date',  value: complaint.resolvedDate },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Typography variant="caption" color="text.secondary"
                        sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                        {value || '—'}
                      </Typography>
                    </Box>
                  ))}
                  {/* Resolution notes — full width */}
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Resolution Notes
                    </Typography>
                    <Box sx={{
                      mt: 0.5, p: 2, borderRadius: 2,
                      backgroundColor: 'background.default',
                      border: `1px solid ${theme.palette.divider}`,
                    }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                        {complaint.resolutionNotes || '—'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </SectionCard>
          )}

        </Box>

        {/* ── Sticky footer ── */}
        <Box sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'background.paper',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          flexShrink: 0,
        }}>
          <Button
            variant="text"
            onClick={onClose}
            startIcon={<X size={18} />}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              px: 3, py: 1,
              color: 'text.primary',
              borderColor: theme.palette.mode === 'light' ? '#D1D5DB' : 'divider',
              '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' },
            }}
          >
            Close
          </Button>
        </Box>

      </Box>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentComplaintsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'All', category: 'All', priority: 'All' });
  const [viewTarget, setViewTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Show success message if navigated back from RaiseComplaintPage
  useEffect(() => {
    if (location.state?.successMessage) {
      setSnackbar({ open: true, message: location.state.successMessage, severity: 'success' });
      // Clear the state so refresh doesn't re-show it
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.listMine();
      setComplaints((res.data || []).map(normalize));
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to load complaints.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleReset = () => setFilters({ search: '', status: 'All', category: 'All', priority: 'All' });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return complaints.filter(c => {
      const matchSearch = !q ||
        c.complaintId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchStatus   = filters.status   === 'All' || c.status   === filters.status;
      const matchCategory = filters.category === 'All' || c.category === filters.category;
      const matchPriority = filters.priority === 'All' || c.priority === filters.priority;
      return matchSearch && matchStatus && matchCategory && matchPriority;
    });
  }, [complaints, filters]);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>My Complaints</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Submit, track and manage your own complaints.
          </Typography>
        </Box>
        {user?.role === 'rector' && (
          <Button
            variant="outlined"
            onClick={() => navigate('/complaints')}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#4F46E5',
              color: '#4F46E5',
              '&:hover': {
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                borderColor: '#4338CA',
              }
            }}
          >
            Back to Management
          </Button>
        )}
      </Box>

      <StudentComplaintStats complaints={complaints} />

      <StudentComplaintFilters
        filters={filters}
        setFilters={setFilters}
        onReset={handleReset}
        onRaise={() => navigate('/complaints/raise')}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <StudentComplaintTable
          complaints={filtered}
          onView={(row) => setViewTarget(row)}
        />
      )}

      <ViewComplaintDrawer
        complaint={viewTarget}
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
      />

      <Snackbar open={snackbar.open} autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
