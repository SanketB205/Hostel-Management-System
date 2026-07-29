import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, Checkbox, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, IconButton, InputAdornment,
  InputLabel, MenuItem, Select, Snackbar, Stack, TextField,
  Typography, useTheme,
} from '@mui/material';
import {
  Bed, Bell, Building2, CheckCircle2, CircleDollarSign,
  ClipboardCheck, Crown, Eye, EyeOff, Lock, LogIn,
  MessageSquareWarning, Moon, ShieldCheck, Sun, User, Users,
} from 'lucide-react';
import { ColorModeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { auth as authApi } from '../api';

// ── Static config ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS = {
  admin:   { label: 'Admin',   icon: Crown,       color: '#4F46E5' },
  rector:  { label: 'Rector',  icon: ShieldCheck, color: '#2563EB' },
  student: { label: 'Student', icon: Users,        color: '#22C55E' },
};

const FEATURES = [
  { label: 'Student Management',   icon: Users              },
  { label: 'Room Management',      icon: Bed                },
  { label: 'Attendance Tracking',  icon: ClipboardCheck     },
  { label: 'Fee Management',       icon: CircleDollarSign   },
  { label: 'Complaint Management', icon: MessageSquareWarning },
  { label: 'Notifications',        icon: Bell               },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate   = useNavigate();
  const theme      = useTheme();
  const colorMode  = useContext(ColorModeContext);
  const { login }  = useAuth();

  // Login form state
  const [role, setRole]               = useState('admin');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [rememberMe, setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Change-password dialog state
  const [resetOpen, setResetOpen]             = useState(false);
  const [resetEmail, setResetEmail]           = useState('');
  const [resetDob, setResetDob]               = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [resetError, setResetError]           = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const showSnack = (message, severity = 'error') => setSnackbar({ open: true, message, severity });

  // ── Login ──────────────────────────────────────────────────────────────────

  const validateLogin = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(username)) errs.username = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoginLoading(true);
    try {
      const result = await authApi.login(username.trim(), password);
      if (result.user.role !== role) {
        showSnack('The selected role does not match this account.');
        return;
      }
      login(result.token, result.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showSnack(err.message || 'Unable to reach the backend.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────

  const openReset = () => {
    if (role !== 'student') {
      showSnack('Password change is only available for Student accounts.');
      return;
    }
    setResetOpen(true);
  };

  const closeReset = () => {
    setResetOpen(false);
    setResetEmail(''); setResetDob('');
    setNewPassword(''); setConfirmPassword('');
    setResetError('');
  };

  const handleChangePassword = async () => {
    if (!resetEmail.trim() || !resetDob || !newPassword || !confirmPassword) {
      setResetError('All fields are required.');
      return;
    }
    if (!/^\d{8}$/.test(resetDob)) {
      setResetError('Date of birth must be in DDMMYYYY format (8 digits).');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    try {
      await authApi.changePassword(resetEmail.trim(), resetDob, newPassword, confirmPassword);
      closeReset();
      showSnack('Password changed successfully. You can now sign in.', 'success');
    } catch (err) {
      setResetError(err.message || 'Failed to change password.');
    } finally {
      setResetLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default', position: 'relative' }}>

      {/* Dark/light toggle */}
      <IconButton
        aria-label="Toggle colour mode"
        onClick={colorMode.toggleColorMode}
        sx={{
          position: 'absolute', top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 2,
          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
          boxShadow: '0 2px 4px -1px rgba(0,0,0,0.06)',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {theme.palette.mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </IconButton>

      {/* Left branding panel */}
      <Box sx={{
        width: { md: '40%' }, display: { xs: 'none', md: 'flex' },
        position: 'relative', overflow: 'hidden', color: 'white',
        background: 'linear-gradient(145deg, #4338CA 0%, #4F46E5 54%, #2563EB 100%)',
        p: { md: 4, lg: 6 }, flexDirection: 'column',
      }}>
        <Box sx={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', top: -90, right: -110 }} />
        <Box sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '48px', border: '1px solid rgba(255,255,255,0.14)', transform: 'rotate(30deg)', bottom: 42, right: -80 }} />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', position: 'relative' }}>
          <Avatar variant="rounded" sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }}>
            <Building2 size={24} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>HostelSpace</Typography>
        </Stack>

        <Box sx={{ position: 'relative', my: 'auto', maxWidth: 440 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.16, mb: 2 }}>
            Hostel Management System
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, mb: 4 }}>
            Secure, Fast and Efficient Hostel Administration Platform
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.8 }}>
            {FEATURES.map(({ label, icon: Icon }) => (
              <Stack key={label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CheckCircle2 size={17} color="#A5B4FC" />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{label}</Typography>
              </Stack>
            ))}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ position: 'relative', color: 'rgba(255,255,255,0.65)' }}>© 2026 HostelSpace</Typography>
      </Box>

      {/* Right login panel */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 3, sm: 5 }, minWidth: 0 }}>
        <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ width: '100%', maxWidth: 460, borderRadius: '20px', p: { xs: 3, sm: 5 }, boxShadow: '0 12px 28px -12px rgba(15,23,42,0.16)' }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit} noValidate>
              <Box>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 3 }}>
                  <Avatar variant="rounded" sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: 'rgba(79,70,229,0.12)', color: 'primary.main' }}>
                    <Building2 size={21} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>HostelSpace</Typography>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75 }}>Welcome Back</Typography>
                <Typography variant="body2" color="text.secondary">Sign in to continue to your dashboard.</Typography>
              </Box>

              {/* Role selector */}
              <FormControl fullWidth>
                <InputLabel id="login-role-label">Login As</InputLabel>
                <Select labelId="login-role-label" value={role} label="Login As" onChange={(e) => setRole(e.target.value)}>
                  {Object.entries(ROLE_OPTIONS).map(([value, opt]) => {
                    const Icon = opt.icon;
                    return (
                      <MenuItem key={value} value={value}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Icon size={18} color={opt.color} />
                          <span>{opt.label}</span>
                        </Stack>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Email */}
              <TextField
                fullWidth label="Email" placeholder="Enter your email"
                value={username} onChange={(e) => setUsername(e.target.value)}
                error={Boolean(fieldErrors.username)} helperText={fieldErrors.username}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={19} /></InputAdornment> } }}
              />

              {/* Password */}
              <TextField
                fullWidth label="Password" placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                error={Boolean(fieldErrors.password)} helperText={fieldErrors.password}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock size={19} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" onClick={() => setShowPassword(p => !p)} sx={{ color: 'text.secondary', display: 'inline-flex' }}>
                          {showPassword ? <EyeOff size={20} strokeWidth={2.25} /> : <Eye size={20} strokeWidth={2.25} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Remember me + forgot password */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -1 }}>
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Remember Me</Typography>}
                />
                <Button type="button" size="small" onClick={openReset} sx={{ px: 0, minWidth: 'auto' }}>
                  Forgot Password?
                </Button>
              </Box>

              {/* Submit */}
              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loginLoading}
                startIcon={loginLoading ? <CircularProgress size={19} color="inherit" /> : <LogIn size={19} />}
                sx={{ height: 50, borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #4338CA)', boxShadow: '0 8px 16px rgba(79,70,229,0.22)' }}
              >
                {loginLoading ? 'Signing in…' : 'Login'}
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* ── Change Password dialog (students only) ── */}
      <Dialog open={resetOpen} onClose={closeReset} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Change Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your registered email and date of birth to verify your identity, then set a new password.
          </Typography>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Registered Email" type="email" fullWidth
              value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
            />
            <TextField
              label="Date of Birth" placeholder="DDMMYYYY" fullWidth
              value={resetDob}
              onChange={(e) => setResetDob(e.target.value.replace(/\D/g, '').slice(0, 8))}
              helperText="Format: DDMMYYYY — e.g. 20022005"
            />
            <TextField
              label="New Password" type={showNew ? 'text' : 'password'} fullWidth
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={() => setShowNew(p => !p)} sx={{ color: 'text.secondary', display: 'inline-flex' }}>
                        {showNew ? <EyeOff size={20} strokeWidth={2.25} /> : <Eye size={20} strokeWidth={2.25} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Confirm New Password" type={showConfirm ? 'text' : 'password'} fullWidth
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(resetError)} helperText={resetError}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={() => setShowConfirm(p => !p)} sx={{ color: 'text.secondary', display: 'inline-flex' }}>
                        {showConfirm ? <EyeOff size={20} strokeWidth={2.25} /> : <Eye size={20} strokeWidth={2.25} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={closeReset} disabled={resetLoading}>Cancel</Button>
          <Button
            variant="contained" onClick={handleChangePassword} disabled={resetLoading}
            startIcon={resetLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}
          >
            {resetLoading ? 'Saving…' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={5000}
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
