import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button,
  useTheme, styled, Card, CardContent,
  Avatar, Chip, CircularProgress, Alert, Snackbar,
  Modal, Backdrop, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  ArrowLeft, User, GraduationCap, Users,
  Home, CreditCard, FileText, Edit, Printer, Download, Lock, Trash2
} from 'lucide-react';
import { staff as staffApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import EmploymentManagementModal from '../components/staff/EmploymentManagementModal';

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
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [staffMember, setStaffMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (deleteOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [deleteOpen]);

  const handleDeleteStaff = async () => {
    setDeleting(true);
    try {
      const res = await staffApi.delete(id);
      setSnackbar({ open: true, message: res.message || 'Staff member removed successfully.', severity: 'success' });
      setTimeout(() => {
        navigate('/staff');
      }, 1500);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to remove staff.', severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

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
  }, [id, location.key]);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSnackbar({
        open: true,
        message: location.state.successMessage,
        severity: 'success',
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/staff')}>Go back</Button>
      </Box>
    );
  }

  const fullName = `${staffMember.firstName} ${staffMember.lastName}`;

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: '80px' }}>
      <PageContainer>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/staff')} sx={{ backgroundColor: 'action.hover' }}>
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>Staff Details</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                View complete information about the selected staff member.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
            {isAdmin && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={() => setDeleteOpen(true)}
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
                Remove Staff
              </Button>
            )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <IconWrapper><GraduationCap size={24} /></IconWrapper>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Employment Information</Typography>
              </Box>
              {user?.role === 'admin' && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setEmpModalOpen(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    borderColor: '#4F46E5',
                    color: '#4F46E5',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(79, 70, 229, 0.04)',
                      borderColor: '#4338CA',
                    },
                  }}
                >
                  Manage Employment Info
                </Button>
              )}
            </SectionHeaderBox>
            <GridBox>
              <InfoField label="Designation" value={staffMember.designation} />
              <InfoField label="Joining Date" value={fmtDate(staffMember.joiningDate)} />
              <InfoField label="Employment Type" value={staffMember.employmentType} />
              <InfoField label="Assigned Area" value={staffMember.assignedArea} />
              <InfoField label="Assigned Block" value={staffMember.assignedBlock} />
              <InfoField label="Shift" value={staffMember.shift} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <InfoField
                  label="System Access"
                  value={
                    staffMember.user ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={staffMember.user.isActive ? 'Active (Rector)' : 'Disabled'}
                          color={staffMember.user.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {staffMember.user.email}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="No System Access" size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                    )
                  }
                  chip
                />
              </Box>
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

      {/* Fixed bottom action bar */}
      <Box sx={{
        py: 2,
        px: { xs: 2, sm: 3, md: 4 },
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'background.paper',
        position: 'fixed',
        bottom: 0,
        left: { xs: 0, md: '280px' },
        right: 0,
        zIndex: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      }}>
        <Button
          variant="text"
          onClick={() => navigate('/staff')}
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAdmin && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Trash2 size={18} />}
              onClick={() => setDeleteOpen(true)}
              sx={{
                backgroundColor: '#DC2626',
                '&:hover': { backgroundColor: '#B91C1C' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 2, sm: 3 },
                py: 1,
              }}
            >
              Remove Staff
            </Button>
          )}
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
            onClick={() => navigate(`/staff/edit/${staffMember.id}`)}
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

      {/* Employment Management Modal */}
      <EmploymentManagementModal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        onUpdated={() => {
          setSnackbar({
            open: true,
            message: 'Employment information updated successfully',
            severity: 'success'
          });
        }}
      />

      {/* Remove Staff Confirmation Modal Overlay */}
      {isAdmin && (
        <Modal
          open={deleteOpen}
          onClose={() => !deleting && setDeleteOpen(false)}
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
              width: { xs: '90%', sm: '450px' },
              maxWidth: '95vw',
              backgroundColor: 'background.paper',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              outline: 'none',
              zIndex: 1401,
              p: 1,
            }}
          >
            <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 700 }}>
              Remove Staff Profile?
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                Are you sure you want to remove staff member <strong>{fullName}</strong> (Staff ID: {staffMember.staffId})? This action will delete their profile{staffMember.user ? ', delete their linked system login account,' : ''} and remove all staff records. This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={() => setDeleteOpen(false)} 
                disabled={deleting}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteStaff} 
                disabled={deleting}
                color="error" 
                variant="contained" 
                autoFocus
                sx={{ 
                  backgroundColor: '#DC2626', 
                  '&:hover': { backgroundColor: '#B91C1C' },
                  textTransform: 'none', 
                  fontWeight: 600,
                  boxShadow: 'none'
                }}
              >
                {deleting ? 'Removing...' : 'Remove Staff'}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
