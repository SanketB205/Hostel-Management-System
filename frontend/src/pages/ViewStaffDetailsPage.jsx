import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button,
  useTheme, styled, Card, CardContent,
  Avatar, Chip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
  ArrowLeft, User, GraduationCap, Users,
  Home, CreditCard, FileText, Edit, Printer, Download
} from 'lucide-react';
import { staff as staffApi } from '../api';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format ISO date string → "15 Aug 2005" */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ViewStaffDetailsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [staffMember, setStaffMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await staffApi.getById(id);
        if (!cancelled) setStaffMember(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load staff details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  if (error || !staffMember) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Staff member not found.'}</Alert>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Go back</Button>
      </Box>
    );
  }

  const fullName = `${staffMember.firstName} ${staffMember.lastName}`;

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageContainer>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: 'action.hover' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>Staff Details</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              View complete information about the selected staff member.
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
                label="Staff Member"
                value={fullName}
                avatar={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`}
              />
              <InfoField label="First Name" value={staffMember.firstName} />
              <InfoField label="Last Name" value={staffMember.lastName} />
              <InfoField label="Staff ID" value={staffMember.staffId} />
              <InfoField label="Gender" value={staffMember.gender} />
              <InfoField label="Date of Birth" value={fmtDate(staffMember.dateOfBirth)} />
              <InfoField label="Phone Number" value={staffMember.phone} />
              <InfoField label="Email" value={staffMember.email} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <InfoField label="Address" value={staffMember.address} />
              </Box>
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 2: Employment Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><GraduationCap size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Employment Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Designation" value={staffMember.designation} />
              <InfoField label="Joining Date" value={fmtDate(staffMember.joiningDate)} />
              <InfoField label="Employment Type" value={staffMember.employmentType} />
              <InfoField label="Assigned Area" value={staffMember.assignedArea} />
              <InfoField label="Assigned Block" value={staffMember.assignedBlock} />
              <InfoField label="Shift" value={staffMember.shift} />
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 3: Emergency Contact Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><Users size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Emergency Contact Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Contact Name" value={staffMember.emergencyContactName} />
              <InfoField label="Relationship" value={staffMember.relationship} />
              <InfoField label="Emergency Phone" value={staffMember.emergencyPhone} />
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 4: Documents ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><FileText size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Documents</Typography>
            </SectionHeaderBox>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 3 }}>
              {['Staff Photo', 'Aadhaar Card', 'Joining Letter'].map((doc) => (
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
            Edit Staff
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
