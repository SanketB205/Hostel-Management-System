import React, { useContext, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BadgeCheck,
  Clock3,
  Globe2,
  KeyRound,
  Laptop,
  LocateFixed,
  Mail,
  Monitor,
  Moon,
  Phone,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { ColorModeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileAvatar from '../components/ProfileAvatar';

const cardSx = { p: 3, borderRadius: '16px' };

const notifications = [
  ['Email Notifications', 'Receive important account updates by email.'],
  ['Complaint Alerts', 'Get notified when a new complaint is submitted.'],
  ['Fee Payment Alerts', 'Receive alerts for successful and pending fee payments.'],
  ['Attendance Alerts', 'Get notified about attendance updates and exceptions.'],
];

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
    </Box>
  );
}

function SettingRow({ title, description, children, divider = true }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.4 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
          {description && <Typography variant="caption" color="text.secondary">{description}</Typography>}
        </Box>
        {children}
      </Box>
      {divider && <Divider />}
    </>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [alertSettings, setAlertSettings] = useState({ email: true, complaints: true, fees: false, attendance: true });
  const isDark = theme.palette.mode === 'dark';

  // Derive display values from the logged-in user
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '—';
  const displayPhone = user?.phone || null;
  const displayUsername = user?.username || null;
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '—';
  const displayDesignation = user?.designation || null;

  const roleColor = { admin: 'error', rector: 'primary', student: 'success' }[user?.role] || 'default';
  const roleLabel = { admin: 'Admin', rector: 'Rector', student: 'Student' }[user?.role] || displayRole;

  const lastLogin = user?.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const sessionDetails = [
    { title: 'IP Address', value: '192.xxx.xxx.xxx', icon: LocateFixed, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
    { title: 'Browser', value: 'Google Chrome', icon: Globe2, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
    { title: 'Device', value: 'Windows 11 Desktop', icon: Laptop, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'Last Active', value: lastLogin || 'Just Now', icon: Clock3, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 4, width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your account, appearance, security, and application preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card sx={cardSx}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.25 }}>
                <ProfileAvatar size={64} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{displayName}</Typography>

                  {/* Email */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                    <Mail size={13} color={theme.palette.text.secondary} />
                    <Typography variant="body2" color="text.secondary">{displayEmail}</Typography>
                  </Box>

                  {/* Phone (only if available) */}
                  {displayPhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.35 }}>
                      <Phone size={13} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary">{displayPhone}</Typography>
                    </Box>
                  )}

                  {/* Username / ID (only if available) */}
                  {displayUsername && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.35 }}>
                      <BadgeCheck size={13} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary">{displayUsername}</Typography>
                    </Box>
                  )}

                  {/* Designation (staff only) */}
                  {displayDesignation && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                      {displayDesignation}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.15, flexWrap: 'wrap' }}>
                    <Chip label={roleLabel} size="small" color={roleColor} variant="outlined" sx={{ fontWeight: 600 }} />
                    {lastLogin && (
                      <Tooltip title={`Last login: ${lastLogin}`} placement="right">
                        <Chip
                          icon={<Clock3 size={12} />}
                          label={`Last login: ${lastLogin}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500, fontSize: '0.68rem' }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
              <Button variant="contained" startIcon={<UserRound size={18} />}>Edit Profile</Button>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ ...cardSx, height: '100%' }}>
            <SectionHeader title="Appearance" subtitle="Customize how HostelSpace looks for you." />
            <SettingRow title="Theme Mode" description="Switch between light and dark appearance." divider={false}>
              <Switch checked={isDark} onChange={colorMode.toggleColorMode} />
            </SettingRow>
            <Box sx={{ mt: 1.75, p: 1.75, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: isDark ? 'rgba(251, 191, 36, 0.14)' : 'rgba(79, 70, 229, 0.12)', display: 'grid', placeItems: 'center', color: isDark ? '#FBBF24' : 'primary.main' }}>
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Theme</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{isDark ? 'Dark Mode' : 'Light Mode'}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ ...cardSx, height: '100%' }}>
            <SectionHeader title="Security" subtitle="Keep your account and access protected." />
            <SettingRow title="Change Password" description="Use a strong, unique password for your account.">
              <Button variant="outlined" size="small" startIcon={<KeyRound size={16} />}>Update Password</Button>
            </SettingRow>
            <SettingRow title="Two Factor Authentication" description="Add an extra layer of protection to your account.">
              <Switch checked={twoFactor} onChange={(event) => setTwoFactor(event.target.checked)} />
            </SettingRow>
            <SettingRow title="Active Sessions" description="Review devices currently signed in to your account." divider={false}>
              <Button variant="outlined" size="small" startIcon={<UsersRound size={16} />}>View Sessions</Button>
            </SettingRow>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={cardSx}>
            <SectionHeader title="Current Session" subtitle="Details about the device and browser currently in use." />
            <Grid container spacing={2}>
              {sessionDetails.map(({ title, value, icon: Icon, color, bg }) => (
                <Grid key={title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Box sx={{ p: 2, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: bg, color, display: 'grid', placeItems: 'center', mb: 1.75 }}><Icon size={20} /></Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.35 }}>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ ...cardSx, height: '100%' }}>
            <SectionHeader title="Notifications" subtitle="Choose the alerts you would like to receive." />
            {notifications.map(([title, description], index) => {
              const key = ['email', 'complaints', 'fees', 'attendance'][index];
              return <SettingRow key={title} title={title} description={description} divider={index < notifications.length - 1}><Switch checked={alertSettings[key]} onChange={(event) => setAlertSettings((current) => ({ ...current, [key]: event.target.checked }))} /></SettingRow>;
            })}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ ...cardSx, height: '100%' }}>
            <SectionHeader title="System Information" subtitle="Current HostelSpace application status." />
            <Stack divider={<Divider />}>
              <SettingRow title="Application Version" divider={false}><Typography variant="body2" sx={{ fontWeight: 700 }}>v1.0.0</Typography></SettingRow>
              <SettingRow title="Database Status" divider={false}><Chip icon={<ShieldCheck size={15} />} label="Connected" size="small" color="success" variant="outlined" /></SettingRow>
              <SettingRow title="Server Status" divider={false}><Chip icon={<Monitor size={15} />} label="Online" size="small" color="success" variant="outlined" /></SettingRow>
              <SettingRow title="Last Backup" divider={false}><Typography variant="body2" sx={{ fontWeight: 700 }}>Today 09:00 AM</Typography></SettingRow>
            </Stack>
          </Card>
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 0.5 }}>
            <Button color="inherit">Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
