import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Alert, Divider, Avatar, useTheme, styled, Button, Tooltip,
} from '@mui/material';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Briefcase,
  GraduationCap, Home, Calendar, Hash, Shield, Clock,
  Settings, CheckCircle2, Bed, AlertCircle, HeartHandshake,
  Layers, KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth as authApi } from '../api';

// ── Styled helpers ─────────────────────────────────────────────────────────────
const SectionCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
  border: '1px solid',
  borderColor: 'rgba(0,0,0,0.08)',
  overflow: 'visible',
  transition: 'box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.09), 0 4px 6px -2px rgba(0,0,0,0.05)',
  },
}));

const IconWrapper = styled(Box)(({ theme, color = '#4F46E5' }) => ({
  backgroundColor: `${color}15`,
  color: color,
  padding: theme.spacing(1),
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

const SectionHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2.5),
}));

const ROLE_COLORS = {
  admin:   { color: '#4F46E5', bg: 'rgba(79,70,229,0.1)', border: '#4F46E5' },
  rector:  { color: '#0891B2', bg: 'rgba(8,145,178,0.1)', border: '#0891B2' },
  student: { color: '#16A34A', bg: 'rgba(22,163,74,0.1)', border: '#16A34A' },
};

// ── Info field row with graceful fallback ──────────────────────────────────────
function InfoField({ icon: Icon, label, value, isLink, linkType = 'text', helper }) {
  const theme = useTheme();
  const displayVal = value || 'Not specified';
  const isMuted = !value;

  const renderValue = () => {
    if (isMuted) {
      return (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
          {displayVal}
        </Typography>
      );
    }

    if (isLink && linkType === 'email') {
      return (
        <Typography
          component="a"
          href={`mailto:${value}`}
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {value}
        </Typography>
      );
    }

    if (isLink && linkType === 'tel') {
      return (
        <Typography
          component="a"
          href={`tel:${value}`}
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {value}
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    );
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
      py: 1.5,
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{
        color: 'text.secondary',
        mt: 0.3,
        flexShrink: 0,
        width: 22,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <Icon size={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.25 }}
        >
          {label}
        </Typography>
        {renderValue()}
        {helper && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
            {helper}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Large hero avatar with initials ───────────────────────────────────────────
function ProfileHeroAvatar({ name, role, size = 88 }) {
  const cfg = ROLE_COLORS[role] || ROLE_COLORS.admin;
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <Avatar sx={{
      width: size,
      height: size,
      backgroundColor: cfg.bg,
      color: cfg.color,
      fontSize: size * 0.35,
      fontWeight: 700,
      border: `3px solid ${cfg.color}35`,
      boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
    }}>
      {initials || <User size={size * 0.4} />}
    </Avatar>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Main Profile Page ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authApi.me()
      .then(res => setProfile(res.user))
      .catch(err => setError(err.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const role = profile?.role || authUser?.role || 'admin';
  const roleLabel = role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1);
  const roleCfg = ROLE_COLORS[role] || ROLE_COLORS.admin;

  // Fallback display name
  const displayName = profile?.name || (role === 'admin' ? 'System Administrator' : 'User');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress sx={{ color: roleCfg.color }} />
        <Typography variant="body2" color="text.secondary">Loading your profile details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', animation: 'fadeIn 0.35s ease-out', pb: 6 }}>
      {/* Back button & Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} color={theme.palette.text.secondary} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Back
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Settings size={15} />}
          onClick={() => navigate('/settings')}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            '&:hover': { borderColor: roleCfg.color, color: roleCfg.color },
          }}
        >
          Account Settings
        </Button>
      </Box>

      {/* ── Profile Hero Card ── */}
      <SectionCard sx={{ mb: 3, borderColor: `${roleCfg.color}30` }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' },
            gap: 3,
          }}>
            <ProfileHeroAvatar name={displayName} role={role} size={88} />

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: 1,
                mb: 0.5,
              }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>
                  {displayName}
                </Typography>

                {/* Account Status Badge */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  color: '#16A34A',
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  Active Account
                </Box>
              </Box>

              {/* Roles and Badges */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: 1,
                flexWrap: 'wrap',
                mb: 1.5,
              }}>
                <Chip
                  icon={role === 'admin' ? <Shield size={14} /> : role === 'rector' ? <Briefcase size={14} /> : <GraduationCap size={14} />}
                  label={roleLabel}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: roleCfg.bg,
                    color: roleCfg.color,
                    borderRadius: '8px',
                    '& .MuiChip-icon': { color: roleCfg.color },
                  }}
                />

                {role === 'student' && profile?.registrationNumber && (
                  <Chip
                    label={profile.registrationNumber}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: '8px', fontFamily: 'monospace' }}
                  />
                )}

                {role === 'student' && (
                  <Chip
                    label={profile?.room ? `Room ${profile.room}` : 'Unallocated'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: '8px',
                      backgroundColor: profile?.room ? 'rgba(79, 70, 229, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: profile?.room ? '#4F46E5' : '#D97706',
                    }}
                  />
                )}

                {(role === 'admin' || role === 'rector') && profile?.designation && (
                  <Chip
                    label={profile.designation}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                  />
                )}

                {role === 'rector' && profile?.assignedBlock && (
                  <Chip
                    icon={<Home size={13} />}
                    label={profile.assignedBlock}
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: '8px', backgroundColor: 'rgba(8,145,178,0.08)', color: '#0891B2' }}
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {profile?.email}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </SectionCard>

      {/* ── Two-Column Information Layout ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>

        {/* ── Left Column: Personal & Contact Information ── */}
        <SectionCard>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionHeaderBox>
              <IconWrapper color={roleCfg.color}><User size={19} /></IconWrapper>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Personal Information</Typography>
                <Typography variant="caption" color="text.secondary">Contact & account identity details</Typography>
              </Box>
            </SectionHeaderBox>

            <InfoField icon={User}     label="Full Name"     value={displayName} />
            <InfoField icon={Mail}     label="Email Address" value={profile?.email} isLink linkType="email" />
            <InfoField icon={Phone}    label="Phone Number"  value={profile?.phone} isLink linkType="tel" />
            <InfoField
              icon={Hash}
              label={role === 'student' ? 'Registration No.' : role === 'rector' ? 'Staff ID' : 'System Username'}
              value={profile?.username || profile?.registrationNumber || profile?.staffId || (role === 'admin' ? 'ADMIN-SYS' : null)}
            />
            <InfoField icon={Shield}   label="Access Role"   value={roleLabel} />
            <InfoField icon={User}     label="Gender"        value={profile?.gender} />
            <InfoField icon={Calendar} label="Date of Birth" value={fmtDate(profile?.dateOfBirth)} />
            <InfoField icon={MapPin}   label="Address"       value={profile?.address} />
            <InfoField icon={Calendar} label="Member Since"  value={fmtDate(profile?.createdAt)} />
            <InfoField icon={Clock}    label="Last Login"    value={fmtDateTime(profile?.lastLoginAt) || 'Active Current Session'} />
          </CardContent>
        </SectionCard>

        {/* ── Right Column: Role-Specific Details ── */}

        {/* 1. STUDENT VIEW */}
        {role === 'student' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Academic Information */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#16A34A"><GraduationCap size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Academic Details</Typography>
                    <Typography variant="caption" color="text.secondary">Course enrollment & campus standing</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={GraduationCap} label="Course"          value={profile?.course} />
                <InfoField icon={Layers}        label="Department"      value={profile?.department} />
                <InfoField icon={Clock}         label="Year of Study"   value={profile?.yearOfStudy || profile?.year} />
                <InfoField icon={Calendar}      label="Admission Date"  value={fmtDate(profile?.admissionDate)} />
              </CardContent>
            </SectionCard>

            {/* Hostel Room Assignment */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#4F46E5"><Home size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Hostel Room Assignment</Typography>
                    <Typography variant="caption" color="text.secondary">Living quarters & bed allocation</Typography>
                  </Box>
                </SectionHeaderBox>

                {profile?.room ? (
                  <>
                    <InfoField icon={Home}     label="Room Number"     value={`Room ${profile.room}`} />
                    <InfoField icon={Home}     label="Block & Floor"   value={`${profile.block || 'Hostel Block'} • ${profile.floor || 'Floor 1'}`} />
                    <InfoField icon={Bed}      label="Bed Number"      value={profile?.bedNumber ? `Bed ${profile.bedNumber}` : 'Bed Assigned'} />
                    <InfoField icon={Layers}   label="Room Type"       value={profile?.roomType || 'Standard'} />
                    <InfoField icon={Calendar} label="Allocated On"    value={fmtDate(profile?.allocatedAt)} />
                  </>
                ) : (
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px dashed #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}>
                    <AlertCircle size={20} color="#D97706" />
                    <Typography variant="body2" sx={{ color: '#B45309', fontWeight: 500 }}>
                      No room currently assigned. Please contact the hostel rector/warden office.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </SectionCard>

            {/* Guardian & Emergency Contact */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#E11D48"><HeartHandshake size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Guardian & Emergency Contact</Typography>
                    <Typography variant="caption" color="text.secondary">Parent or authorized guardian details</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={User}  label="Guardian Name"  value={profile?.guardianName} />
                <InfoField icon={User}  label="Relationship"   value={profile?.guardianRelationship || 'Parent / Guardian'} />
                <InfoField icon={Phone} label="Guardian Phone" value={profile?.guardianPhone} isLink linkType="tel" />
                <InfoField icon={Mail}  label="Guardian Email" value={profile?.guardianEmail} isLink linkType="email" />
              </CardContent>
            </SectionCard>
          </Box>
        )}

        {/* 2. RECTOR VIEW */}
        {role === 'rector' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Employment & Duties Card */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#0891B2"><Briefcase size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Employment & Assigned Duties</Typography>
                    <Typography variant="caption" color="text.secondary">Hostel warden responsibility & shift schedule</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={Briefcase}  label="Designation"     value={profile?.designation || 'Warden / Rector'} />
                <InfoField icon={Hash}       label="Staff ID"        value={profile?.username || profile?.staffId || 'RECTOR-SYS'} />
                <InfoField icon={Briefcase}  label="Employment Type" value={profile?.employmentType || 'Full-time'} />
                <InfoField icon={Home}       label="Assigned Block"  value={profile?.assignedBlock || 'Campus Hostels'} />
                <InfoField icon={MapPin}     label="Assigned Area"   value={profile?.assignedArea || 'Hostel Block'} />
                <InfoField icon={Clock}      label="Shift Schedule"  value={profile?.shift || 'Regular Shift'} />
                <InfoField icon={Calendar}   label="Date of Joining" value={fmtDate(profile?.joiningDate)} />
              </CardContent>
            </SectionCard>

            {/* Emergency Contact */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#E11D48"><HeartHandshake size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Emergency Contact</Typography>
                    <Typography variant="caption" color="text.secondary">Designated emergency point of contact</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={User}  label="Contact Name" value={profile?.emergencyContactName} />
                <InfoField icon={User}  label="Relationship" value={profile?.emergencyRelationship || 'Next of Kin'} />
                <InfoField icon={Phone} label="Emergency Phone" value={profile?.emergencyPhone} isLink linkType="tel" />
              </CardContent>
            </SectionCard>
          </Box>
        )}

        {/* 3. ADMIN VIEW */}
        {role === 'admin' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* System Privileges Card */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#4F46E5"><Shield size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>System Privileges & Control</Typography>
                    <Typography variant="caption" color="text.secondary">Global administrator capabilities & access level</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={Shield}    label="Administrative Level" value="Super Administrator (Level 1)" />
                <InfoField icon={KeyRound}  label="Access Scope"         value="Campus-Wide (Global Unrestricted)" />
                <InfoField icon={Briefcase} label="Designation"          value={profile?.designation || 'System Administrator'} />
                <InfoField icon={Layers}    label="Department"           value="Hostel Management & Central Administration" />
                <InfoField icon={Clock}     label="Shift Availability"   value="24/7 Global Administrative Access" />
                <InfoField icon={Home}      label="Managed Hostels"      value="All Hostel Blocks & Floors" />

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1.5 }}>
                  Managed System Domains
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['Students Management', 'Staff & Rectors', 'Room Allocations', 'Finances & Fees', 'Complaints Resolution', 'System Configurations'].map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        color: '#4F46E5',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </SectionCard>

            {/* Platform Security Overview */}
            <SectionCard>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeaderBox>
                  <IconWrapper color="#10B981"><CheckCircle2 size={19} /></IconWrapper>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>Platform Security Overview</Typography>
                    <Typography variant="caption" color="text.secondary">Authentication session & data protection</Typography>
                  </Box>
                </SectionHeaderBox>

                <InfoField icon={Shield}       label="Session Protocol"    value="JWT Bearer Authentication (Secure)" />
                <InfoField icon={CheckCircle2} label="Database Security"   value="Parameterized SQL / Sequelize ORM" />
                <InfoField icon={CheckCircle2} label="Role Access Control" value="Multi-Tier RBAC Enforced" />
              </CardContent>
            </SectionCard>
          </Box>
        )}

      </Box>
    </Box>
  );
}
