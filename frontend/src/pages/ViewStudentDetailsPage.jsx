import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button,
  useTheme, styled, Card, CardContent,
  Avatar, Chip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
  ArrowLeft, User, GraduationCap, Users,
  Home, CreditCard, FileText, Edit, Printer, Download, KeyRound
} from 'lucide-react';
import { students as studentsApi } from '../api';

// ── Styled helpers ─────────────────────────────────────────────────────────────

const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
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
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
}));

const FilePreviewCard = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

// ── InfoField ─────────────────────────────────────────────────────────────────

function InfoField({ label, value, chip, avatar }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        {label}
      </Typography>
      {avatar ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Avatar src={avatar} sx={{ width: 48, height: 48 }} />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
        </Box>
      ) : chip ? (
        <Box sx={{ mt: 0.5 }}>{value}</Box>
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
          {value || '—'}
        </Typography>
      )}
    </Box>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Present: { color: '#16A34A', bg: 'rgba(34,197,94,0.1)'  },
  Outing:  { color: '#D97706', bg: 'rgba(245,158,11,0.1)' },
  Leave:   { color: '#2563EB', bg: 'rgba(59,130,246,0.1)' },
  Late:    { color: '#EA580C', bg: 'rgba(249,115,22,0.1)' },
  Absent:  { color: '#DC2626', bg: 'rgba(239,68,68,0.1)'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format ISO date string → "15 Aug 2005" */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ViewStudentDetailsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const res = await studentsApi.resetPassword(id);
      setSnackbar({ open: true, message: res.message, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to reset password.', severity: 'error' });
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentsApi.getById(id);
        if (!cancelled) setStudent(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load student.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Student not found.'}</Alert>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Go back</Button>
      </Box>
    );
  }

  // ── Map DB fields ─────────────────────────────────────────────────────────

  const fullName    = `${student.firstName} ${student.lastName}`;
  const activeAlloc = (student.allocations || []).find(a => a.status === 'active');
  const room        = activeAlloc?.room;

  const statusStyle = STATUS_COLORS[student.status] || STATUS_COLORS.Present;

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageContainer>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: 'action.hover' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>Student Details</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              View complete information about the selected student.
            </Typography>
          </Box>
        </Box>

        {/* ── SECTION 1: Personal Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><User size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField
                label="Student"
                value={fullName}
                avatar={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`}
              />
              <InfoField label="First Name"            value={student.firstName} />
              <InfoField label="Last Name"             value={student.lastName} />
              <InfoField label="Registration Number"   value={student.registrationNumber} />
              <InfoField label="Gender"                value={student.gender} />
              <InfoField label="Date of Birth"         value={fmtDate(student.dateOfBirth)} />
              <InfoField label="Phone Number"          value={student.phone} />
              <InfoField label="Email"                 value={student.email} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <InfoField label="Address" value={student.address} />
              </Box>
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 2: Academic Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><GraduationCap size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Academic Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Department"      value={student.department} />
              <InfoField label="Course"          value={student.course} />
              <InfoField label="Year of Study"   value={student.year} />
              <InfoField label="Admission Date"  value={fmtDate(student.admissionDate)} />
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 3: Parent / Guardian Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><Users size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Parent / Guardian Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Guardian Name"         value={student.guardianName} />
              <InfoField label="Relationship"          value={student.guardianRelationship} />
              <InfoField label="Guardian Phone"        value={student.guardianPhone} />
              <InfoField label="Guardian Email"        value={student.guardianEmail} />
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 4: Hostel Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><Home size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Hostel Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Room Number"      value={room?.number} />
              <InfoField label="Bed Number"       value={activeAlloc?.bedNumber} />
              <InfoField label="Allocation Date"  value={fmtDate(activeAlloc?.allocatedAt)} />
              <InfoField
                label="Student Status"
                chip
                value={
                  <Chip
                    label={student.status}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}
                  />
                }
              />
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 5: Fee Information (placeholder — no fee model yet) ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><CreditCard size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Fee Information</Typography>
            </SectionHeaderBox>
            <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">Fee records will appear here once the fee module is connected.</Typography>
            </Box>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 6: Documents ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><FileText size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Documents</Typography>
            </SectionHeaderBox>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 3 }}>
              {['Student Photo', 'Aadhaar Card', 'Fee Receipt'].map((doc) => (
                <FilePreviewCard key={doc}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <FileText size={20} color={theme.palette.text.secondary} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{doc}</Typography>
                  </Box>
                  <Box sx={{
                    height: 120, backgroundColor: 'action.hover', borderRadius: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'text.secondary', border: `1px dashed ${theme.palette.divider}`
                  }}>
                    <Typography variant="caption">Preview Available</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 1 }}>
                    {doc.toLowerCase().replace(' ', '_')}.pdf
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button size="small" variant="outlined" fullWidth sx={{ borderColor: 'divider', color: 'text.primary' }}>View</Button>
                    <Button size="small" variant="contained" color="secondary" fullWidth sx={{ boxShadow: 'none' }}>Download</Button>
                  </Box>
                </FilePreviewCard>
              ))}
            </Box>
          </CardContent>
        </SectionCard>

      </PageContainer>

      {/* Sticky footer actions */}
      <Box sx={{
        p: 3, mt: 4,
        mx: { xs: -2, sm: -3, md: -4 },
        mb: { xs: -2, sm: -3, md: -4 },
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'background.paper',
        position: 'sticky',
        bottom: { xs: -16, sm: -24, md: -32 },
        zIndex: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      }}>
        <Button
          variant="text"
          onClick={() => navigate(-1)}
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={resetting ? <CircularProgress size={16} /> : <KeyRound size={18} />}
            disabled={resetting}
            onClick={handleResetPassword}
            sx={{
              display: { xs: 'none', sm: 'flex' }, px: 3, py: 1,
              color: '#D97706',
              borderColor: '#D97706',
              '&:hover': { backgroundColor: 'rgba(217,119,6,0.08)', borderColor: '#D97706' },
            }}
          >
            {resetting ? 'Resetting…' : 'Reset Password'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Printer size={18} />}
            sx={{
              display: { xs: 'none', sm: 'flex' }, px: 3, py: 1,
              color: 'text.primary',
              borderColor: theme.palette.mode === 'light' ? '#D1D5DB' : 'divider',
              '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' },
            }}
          >
            Print Profile
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Download size={18} />}
            sx={{ display: { xs: 'none', sm: 'flex' }, px: 3, py: 1, boxShadow: 'none' }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit size={18} />}
            sx={{
              backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' },
              px: { xs: 2, sm: 4 }, py: 1, fontWeight: 600,
            }}
          >
            Edit Student
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}