import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button, TextField, MenuItem,
  useTheme, styled, Card, CardContent, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import {
  ArrowLeft, Upload, CheckCircle2, Tag, AlignLeft, FileText, Save, RotateCcw,
} from 'lucide-react';
import { complaints as complaintsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

// ─── Styled components — identical to StaffRegistrationPage / AddStudentDrawer ─
const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
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

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: theme.palette.background.default,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const GridBox = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(1, 1fr)',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
}));

const CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'Internet', 'Cleaning', 'Other'];

export default function RaiseComplaintPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/complaints', { replace: true });
    }
  }, [user, navigate]);

  const EMPTY = { category: '', title: '', priority: '', description: '' };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handle = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.category)           e.category    = 'Category is required';
    if (!form.title.trim())       e.title       = 'Complaint title is required';
    if (!form.priority)           e.priority    = 'Priority is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors({});
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const onSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      await complaintsApi.raise({
        category:       form.category,
        title:          form.title,
        description:    form.description,
        priority:       form.priority,
        attachmentName: attachment || undefined,
      });
      navigate('/complaints', { state: { successMessage: 'Complaint submitted successfully!' } });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to submit complaint.', severity: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageContainer>

        {/* ── Page Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate('/complaints')} sx={{ backgroundColor: 'action.hover' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Raise a Complaint
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Describe your issue and submit it to hostel management.
            </Typography>
          </Box>
        </Box>

        {/* ── SECTION 1 — Complaint Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><Tag size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Information</Typography>
            </SectionHeaderBox>
            <GridBox>
              <TextField select fullWidth label="Category *"
                value={form.category} onChange={handle('category')}
                error={!!errors.category} helperText={errors.category}>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Priority *"
                value={form.priority} onChange={handle('priority')}
                error={!!errors.priority} helperText={errors.priority}>
                <MenuItem value="High">🔴 High</MenuItem>
                <MenuItem value="Medium">🟡 Medium</MenuItem>
                <MenuItem value="Low">🟢 Low</MenuItem>
              </TextField>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <TextField fullWidth label="Complaint Title *"
                  value={form.title} onChange={handle('title')}
                  error={!!errors.title} helperText={errors.title}
                  placeholder="e.g. Fan not working in Room A-101"
                />
              </Box>
            </GridBox>
          </CardContent>
        </SectionCard>

        {/* ── SECTION 2 — Complaint Details ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><AlignLeft size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Details</Typography>
            </SectionHeaderBox>
            <TextField fullWidth multiline rows={6}
              label="Description *"
              placeholder="Describe the issue clearly so hostel staff can understand and resolve it quickly..."
              value={form.description} onChange={handle('description')}
              error={!!errors.description} helperText={errors.description}
            />
          </CardContent>
        </SectionCard>

        {/* ── SECTION 3 — Attachments ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <SectionHeaderBox>
              <IconWrapper><FileText size={24} /></IconWrapper>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Attachments</Typography>
            </SectionHeaderBox>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Optionally upload an image or PDF to support your complaint. Supported formats: JPG, PNG, PDF.
            </Typography>
            <Box sx={{ maxWidth: 340 }}>
              <input accept="image/*,.pdf" style={{ display: 'none' }} id="complaint-attachment"
                type="file" onChange={handleFileUpload} />
              <label htmlFor="complaint-attachment" style={{ display: 'block' }}>
                <FileUploadBox>
                  {attachment ? (
                    <>
                      {attachmentPreview
                        ? <img src={attachmentPreview} alt="Preview"
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                        : <CheckCircle2 color={theme.palette.success.main} size={32} style={{ marginBottom: 12 }} />
                      }
                      <Typography variant="body2" noWrap sx={{ maxWidth: 280, fontWeight: 600 }}>{attachment}</Typography>
                      <Typography variant="caption" color="text.secondary">Click to change</Typography>
                    </>
                  ) : (
                    <>
                      <Upload color={theme.palette.primary.main} size={32} style={{ marginBottom: 12 }} />
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Upload Image / PDF</Typography>
                      <Typography variant="caption" color="text.secondary">Optional — click to upload</Typography>
                    </>
                  )}
                </FileUploadBox>
              </label>
            </Box>
          </CardContent>
        </SectionCard>

      </PageContainer>

      {/* ── Sticky Bottom Action Bar ── */}
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
        <Button variant="text" onClick={handleReset} disabled={isSubmitting}
          startIcon={<RotateCcw size={18} />}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' } }}>
          Reset
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/complaints')} disabled={isSubmitting}
            sx={{ px: 3, py: 1, color: 'text.primary', borderColor: theme.palette.mode === 'light' ? '#D1D5DB' : 'divider',
              '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' } }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            sx={{ px: 4, py: 1, backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' }, fontWeight: 600 }}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
