import React, { useState } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TableSortLabel,
  Chip, IconButton, Tooltip, Typography,
  Drawer, Button, useTheme, styled,
  Select, MenuItem, FormControl, InputLabel, TextField,
  CircularProgress, CardContent,
} from '@mui/material';
import {
  Eye, ArrowLeft, AlertCircle, AlignLeft, FileText,
  Clock, CheckCircle2, RefreshCw, Tag, User,
} from 'lucide-react';
import { complaints as complaintsApi } from '../../api';

// ── Colour maps ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:       { color: '#D97706', bg: 'rgba(245,158,11,0.1)',  dot: '🟠' },
  'In Progress': { color: '#2563EB', bg: 'rgba(59,130,246,0.1)',  dot: '🔵' },
  Resolved:      { color: '#16A34A', bg: 'rgba(34,197,94,0.1)',   dot: '🟢' },
  Rejected:      { color: '#DC2626', bg: 'rgba(239,68,68,0.1)',   dot: '🔴' },
};
const PRIORITY_COLORS = {
  Low:    { color: '#16A34A', bg: 'rgba(34,197,94,0.1)',  dot: '🟢' },
  Medium: { color: '#D97706', bg: 'rgba(245,158,11,0.1)', dot: '🟡' },
  High:   { color: '#DC2626', bg: 'rgba(239,68,68,0.1)',  dot: '🔴' },
};

// ── Styled helpers — identical to ViewStudentDetailsPage ──────────────────────
const FormContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(3, 4),
  backgroundColor: theme.palette.mode === 'light' ? '#F3F4F6' : theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  [theme.breakpoints.down('sm')]: { padding: theme.spacing(2) },
}));

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

const GridBox = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(1, 1fr)',
  [theme.breakpoints.up('sm')]: { gridTemplateColumns: 'repeat(2, 1fr)' },
}));

// ── Info field — label + value, matching ViewStudentDetailsPage ───────────────
function InfoField({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
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
  );
}

// ── Complaint Detail + Update — full-width form drawer ────────────────────────
function ComplaintDetailDrawer({ complaint, open, onClose, onRefresh }) {
  const theme = useTheme();
  const [newStatus,       setNewStatus]       = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving,          setSaving]          = useState(false);
  const [saveError,       setSaveError]       = useState('');

  React.useEffect(() => {
    if (complaint) {
      setNewStatus(complaint.status);
      setResolutionNotes(complaint.resolutionNotes || '');
      setSaveError('');
    }
  }, [complaint]);

  if (!complaint) return null;

  const sm = STATUS_COLORS[complaint.status]    || {};
  const pm = PRIORITY_COLORS[complaint.priority] || {};
  const statusChanged = newStatus !== complaint.status;

  const handleSave = async () => {
    if (!newStatus || !statusChanged) return;
    setSaving(true);
    setSaveError('');
    try {
      await complaintsApi.update(complaint.id, {
        status: newStatus,
        resolutionNotes: newStatus === 'Resolved' ? resolutionNotes || undefined : undefined,
      });
      onRefresh();
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

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
        <FormContainer>

          {/* Page header — matches ViewStudentDetailsPage */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <IconButton onClick={onClose} sx={{ backgroundColor: 'action.hover' }}>
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Complaint Details
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                View and update complaint — {complaint.complaintId}
              </Typography>
            </Box>
          </Box>

          {/* ── SECTION 1: Complaint Information ── */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><AlertCircle size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Information</Typography>
              </SectionHeaderBox>
              <GridBox>
                <InfoField label="Complaint ID"   value={complaint.complaintId} />
                <InfoField label="Category"       value={complaint.category} />
                <InfoField label="Submitted Date" value={complaint.date} />
                <InfoField label="Last Updated"   value={complaint.lastUpdated || complaint.date} />
                <InfoField
                  label="Priority"
                  value={
                    <Chip
                      label={`${pm.dot} ${complaint.priority}`}
                      size="small"
                      sx={{ fontWeight: 600, backgroundColor: pm.bg, color: pm.color }}
                    />
                  }
                />
                <InfoField
                  label="Current Status"
                  value={
                    <Chip
                      label={`${sm.dot} ${complaint.status}`}
                      size="small"
                      sx={{ fontWeight: 600, backgroundColor: sm.bg, color: sm.color }}
                    />
                  }
                />
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <InfoField label="Title" value={complaint.title} />
                </Box>
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* ── SECTION 2: Student Information ── */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><User size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Student Information</Typography>
              </SectionHeaderBox>
              <GridBox>
                <InfoField label="Student Name" value={complaint.studentName} />
                <InfoField label="Room No"      value={complaint.roomNo} />
                {complaint.assignedTo && (
                  <InfoField label="Assigned To" value={complaint.assignedTo} />
                )}
              </GridBox>
            </CardContent>
          </SectionCard>

          {/* ── SECTION 3: Complaint Description ── */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
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
            </CardContent>
          </SectionCard>

          {/* ── SECTION 4: Attachment ── */}
          <SectionCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
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
                }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4F46E5', flexShrink: 0,
                  }}>
                    <FileText size={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{complaint.attachment}</Typography>
                    <Typography variant="caption" color="text.secondary">Uploaded attachment</Typography>
                  </Box>
                  <Button size="small" variant="outlined" sx={{ flexShrink: 0, borderColor: 'divider', color: 'text.primary' }}>
                    View
                  </Button>
                </Box>
              ) : (
                <Box sx={{
                  p: 3, borderRadius: 2, textAlign: 'center',
                  border: `2px dashed ${theme.palette.divider}`,
                  backgroundColor: 'background.default',
                  color: 'text.secondary',
                }}>
                  <FileText size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <Typography variant="body2">No attachment uploaded.</Typography>
                </Box>
              )}
            </CardContent>
          </SectionCard>

          {/* ── SECTION 5: Timeline ── */}
          {complaint.timeline?.length > 0 && (
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <IconWrapper><Clock size={24} /></IconWrapper>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Timeline</Typography>
                </SectionHeaderBox>
                <Box sx={{ position: 'relative', pl: 3 }}>
                  {/* Vertical connector line */}
                  <Box sx={{
                    position: 'absolute', left: 7, top: 14, bottom: 14,
                    width: 2, backgroundColor: theme.palette.divider,
                  }} />
                  {complaint.timeline.map((step, i) => {
                    const isLast = i === complaint.timeline.length - 1;
                    const dotColor = isLast && complaint.status === 'Resolved'
                      ? '#10B981'
                      : '#4F46E5';
                    return (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 2,
                          mb: isLast ? 0 : 3.5, position: 'relative',
                        }}
                      >
                        <Box sx={{
                          width: 16, height: 16, borderRadius: '50%',
                          flexShrink: 0, mt: 0.3, zIndex: 1,
                          backgroundColor: dotColor,
                          border: `2px solid ${theme.palette.background.paper}`,
                          boxShadow: `0 0 0 2px ${dotColor}`,
                        }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.label}</Typography>
                          {step.date && step.date !== '—' && (
                            <Typography variant="caption" color="text.secondary">{step.date}</Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </SectionCard>
          )}

          {/* ── SECTION 6: Resolution Info (read-only, shown when already resolved) ── */}
          {complaint.status === 'Resolved' && (
            <SectionCard>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <SectionHeaderBox>
                  <Box sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981', p: 1, borderRadius: '8px', display: 'flex' }}>
                    <CheckCircle2 size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Resolution Details</Typography>
                </SectionHeaderBox>
                <GridBox>
                  <InfoField label="Resolved By"   value={complaint.resolvedBy} />
                  <InfoField label="Resolved Date" value={complaint.resolvedDate} />
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <InfoField label="Resolution Notes" value={complaint.resolutionNotes} />
                  </Box>
                </GridBox>
              </CardContent>
            </SectionCard>
          )}

          {/* ── SECTION 7: Update Status ── */}
          <SectionCard sx={{ border: `1px solid ${theme.palette.primary.main}28` }}>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <SectionHeaderBox>
                <IconWrapper><RefreshCw size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Update Status</Typography>
              </SectionHeaderBox>

              <GridBox>
                <FormControl fullWidth>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="New Status"
                    onChange={e => { setNewStatus(e.target.value); setSaveError(''); }}
                  >
                    {['Pending', 'In Progress', 'Resolved'].map(s => {
                      const meta = STATUS_COLORS[s] || {};
                      return (
                        <MenuItem key={s} value={s}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: meta.color, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{s}</Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {/* Resolution notes field — full width, only when Resolved */}
                {newStatus === 'Resolved' && (
                  <Box sx={{ gridColumn: { sm: '1 / -1' }, animation: 'fadeIn 0.2s ease-out' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Resolution Notes (optional)"
                      placeholder="Describe what was done to resolve the issue..."
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                    />
                  </Box>
                )}
              </GridBox>

              {saveError && (
                <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
                  ⚠ {saveError}
                </Typography>
              )}
            </CardContent>
          </SectionCard>

        </FormContainer>

        {/* ── Sticky footer — identical to ViewStudentDetailsPage ── */}
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
            startIcon={<ArrowLeft size={18} />}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={saving}
              sx={{
                px: 3, py: 1,
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
              disabled={saving || !statusChanged}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <RefreshCw size={18} />}
              sx={{
                px: 4, py: 1,
                backgroundColor: '#4F46E5',
                '&:hover': { backgroundColor: '#4338CA' },
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving…' : 'Update Status'}
            </Button>
          </Box>
        </Box>

      </Box>
    </Drawer>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────
export default function ComplaintTable({ complaints, onRefresh }) {
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy]         = useState('date');
  const [order, setOrder]             = useState('desc');
  const [viewTarget, setViewTarget]   = useState(null);

  const handleRequestSort = (property) => {
    setOrder(orderBy === property && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sorted = [...complaints].sort((a, b) => {
    if (b[orderBy] < a[orderBy]) return order === 'asc' ?  1 : -1;
    if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 :  1;
    return 0;
  });

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headCells = [
    { id: 'complaintId', label: 'Complaint ID' },
    { id: 'studentName', label: 'Student Name' },
    { id: 'roomNo',      label: 'Room No' },
    { id: 'category',    label: 'Category' },
    { id: 'title',       label: 'Title' },
    { id: 'priority',    label: 'Priority' },
    { id: 'status',      label: 'Status' },
    { id: 'date',        label: 'Date' },
    { id: 'actions',     label: 'Actions', disableSort: true },
  ];

  return (
    <>
      <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {headCells.map(hc => (
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
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No complaints found matching the criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paged.map((row, idx) => (
                <TableRow
                  key={row.complaintId}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                    '&:last-child td': { borderBottom: 0 },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.complaintId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.studentName}</TableCell>
                  <TableCell>{row.roomNo}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell
                    sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={row.title}
                  >
                    {row.title}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${PRIORITY_COLORS[row.priority]?.dot} ${row.priority}`}
                      size="small"
                      sx={{ fontWeight: 600, backgroundColor: PRIORITY_COLORS[row.priority]?.bg, color: PRIORITY_COLORS[row.priority]?.color }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${STATUS_COLORS[row.status]?.dot} ${row.status}`}
                      size="small"
                      sx={{ fontWeight: 600, backgroundColor: STATUS_COLORS[row.status]?.bg, color: STATUS_COLORS[row.status]?.color }}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View & Update">
                      <IconButton
                        size="small"
                        onClick={() => setViewTarget(row)}
                        sx={{ color: 'text.secondary', '&:hover': { color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)' } }}
                      >
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={complaints.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Card>

      <ComplaintDetailDrawer
        complaint={viewTarget}
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        onRefresh={onRefresh}
      />
    </>
  );
}
