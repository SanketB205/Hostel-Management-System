import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Backdrop,
  Box, Button, TextField, Typography, Chip, IconButton,
  CircularProgress, Alert, Divider, Tabs, Tab,
  useTheme, styled,
} from '@mui/material';
import {
  Plus, Edit2, Check, X, MapPin, Clock, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { notifyAssignmentDataChanged } from '../../hooks/useAssignmentData';

// ─── Styled ────────────────────────────────────────────────────────────────────
const ItemRow = styled(Box)(({ theme }) => ({
  borderRadius: '10px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const STATUS_COLORS = {
  Active:   { color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  Inactive: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

// ─── Simple inline form (used for Assigned Areas) ──────────────────────────────
function InlineForm({ initial, onSave, onCancel, label = 'Name', saving }) {
  const [value, setValue] = useState(initial || '');
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!value.trim()) { setErr(`${label} is required.`); return; }
    setErr('');
    await onSave(value.trim());
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
      {err && <Alert severity="error" sx={{ py: 0 }}>{err}</Alert>}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label={`${label} *`}
          value={value}
          onChange={e => setValue(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          autoFocus
          disabled={saving}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={handleSave} disabled={saving} sx={{ color: '#16A34A' }}>
            {saving ? <CircularProgress size={16} /> : <Check size={16} />}
          </IconButton>
          <IconButton size="small" onClick={onCancel} disabled={saving} sx={{ color: 'text.secondary' }}>
            <X size={16} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Build fallback fullData from display name for legacy shifts ───────────────
// Parses names like "Morning Shift (06:00 - 14:00)" or "Morning Shift (6 AM - 2 PM)"
function buildFallbackFullData(name) {
  // Try to extract HH:MM - HH:MM pattern (24-h)
  const match24 = name.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
  // Try to extract "6 AM - 2 PM" pattern (12-h)
  const match12 = name.match(/\((\d{1,2}(?::\d{2})?\s*[AP]M)\s*-\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\)/i);

  let startTime = '09:00';
  let endTime   = '17:00';

  if (match24) {
    // Zero-pad if needed: "6:00" → "06:00"
    const pad = t => t.split(':').map((p, i) => i === 0 ? p.padStart(2, '0') : p).join(':');
    startTime = pad(match24[1]);
    endTime   = pad(match24[2]);
  } else if (match12) {
    const to24 = str => {
      const clean = str.trim().toUpperCase();
      const isPM  = clean.endsWith('PM');
      const timePart = clean.replace(/\s*[AP]M/, '').trim();
      const [h, m = '00'] = timePart.split(':');
      let hour = parseInt(h, 10);
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${m.padStart(2, '0')}`;
    };
    startTime = to24(match12[1]);
    endTime   = to24(match12[2]);
  }

  // Strip "(HH:MM - HH:MM)" or "(6 AM - 2 PM)" from the name for the field
  const shiftName = name
    .replace(/\s*\(\d{1,2}(?::\d{2})?\s*(?:[AP]M)?\s*-\s*\d{1,2}(?::\d{2})?\s*(?:[AP]M)?\s*\)/i, '')
    .trim();

  return {
    name:             shiftName || name,
    startTime,
    endTime,
    lateGracePeriod:  '15',
    halfDayAfter:     '',
    earlyClockIn:     '15',
    earlyClockOut:    '15',
    monthlyGraceDays: '3',
    lunchBreak:       '45',
    teaBreak:         '15',
  };
}

// ─── Comprehensive Shift Form ──────────────────────────────────────────────────
function ShiftForm({ initial, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState(initial || {
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    lateGracePeriod: '15',
    halfDayAfter: '',      // HH:MM in 24-h format (same as startTime/endTime)
    earlyClockIn: '15',
    earlyClockOut: '15',
    monthlyGraceDays: '3',
    lunchBreak: '45',
    teaBreak: '15',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Shift name is required';
    if (!formData.startTime)   newErrors.startTime = 'Start time is required';
    if (!formData.endTime)     newErrors.endTime = 'End time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    await onSave({ ...formData });
  };

  return (
    <Box sx={{
      p: 3,
      backgroundColor: 'background.paper',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
    }}>
      {/* Shift Name */}
      <TextField
        fullWidth size="small"
        label="Shift Name *"
        value={formData.name}
        onChange={e => handleChange('name', e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        disabled={saving}
        sx={{ mb: 2.5 }}
      />

      {/* Start Time & End Time */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <TextField
          fullWidth size="small"
          type="time"
          label="Start Time *"
          value={formData.startTime}
          onChange={e => handleChange('startTime', e.target.value)}
          error={!!errors.startTime}
          helperText={errors.startTime}
          disabled={saving}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth size="small"
          type="time"
          label="End Time *"
          value={formData.endTime}
          onChange={e => handleChange('endTime', e.target.value)}
          error={!!errors.endTime}
          helperText={errors.endTime}
          disabled={saving}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Late Grace Period & Half Day After */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <TextField
          fullWidth size="small"
          type="number"
          label="Late Grace Period (minutes) *"
          value={formData.lateGracePeriod}
          onChange={e => handleChange('lateGracePeriod', e.target.value)}
          disabled={saving}
          helperText="Clock in this many minutes after start without penalty."
        />
        {/* Same type="time" as Start/End Time → identical scroll picker */}
        <TextField
          fullWidth size="small"
          type="time"
          label="Half Day After"
          value={formData.halfDayAfter}
          onChange={e => handleChange('halfDayAfter', e.target.value)}
          disabled={saving}
          InputLabelProps={{ shrink: true }}
          helperText="Checking in after this time results in a Half Day."
        />
      </Box>

      {/* Early Clock In & Early Clock Out */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <TextField
          fullWidth size="small"
          type="number"
          label="Early Clock In Allowed (minutes) *"
          value={formData.earlyClockIn}
          onChange={e => handleChange('earlyClockIn', e.target.value)}
          disabled={saving}
          helperText="Clock in this many minutes before start without penalty."
        />
        <TextField
          fullWidth size="small"
          type="number"
          label="Early Clock Out Allowed (minutes) *"
          value={formData.earlyClockOut}
          onChange={e => handleChange('earlyClockOut', e.target.value)}
          disabled={saving}
          helperText="Clock out this many minutes before end without penalty."
        />
      </Box>

      {/* Monthly Grace Days · Lunch Break · Tea Break */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <TextField
          fullWidth size="small"
          type="number"
          label="Monthly Grace Days (3-Day Policy)"
          value={formData.monthlyGraceDays}
          onChange={e => handleChange('monthlyGraceDays', e.target.value)}
          disabled={saving}
          helperText="Up to this many late arrivals are marked as Present (Grace)."
        />
        <TextField
          fullWidth size="small"
          type="number"
          label="Lunch Break Allowance (minutes)"
          value={formData.lunchBreak}
          onChange={e => handleChange('lunchBreak', e.target.value)}
          disabled={saving}
          helperText="Total minutes employee can take for lunch break on demand."
        />
        <TextField
          fullWidth size="small"
          type="number"
          label="Tea Break Allowance (minutes)"
          value={formData.teaBreak}
          onChange={e => handleChange('teaBreak', e.target.value)}
          disabled={saving}
          helperText="Total minutes employee can take for tea break on demand."
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined" onClick={onCancel} disabled={saving}
          sx={{ textTransform: 'none', borderRadius: '8px' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Check size={16} />}
          sx={{ textTransform: 'none', borderRadius: '8px', backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' } }}
        >
          {initial ? 'Update Shift' : 'Create Shift'}
        </Button>
      </Box>
    </Box>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function AssignmentManagementModal({ open, onClose, onUpdated }) {
  const theme = useTheme();
  const [tab, setTab]                 = useState(0);
  const [assignedAreas, setAssignedAreas] = useState([]);
  const [shifts, setShifts]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [editing, setEditing]         = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError('');
    try {
      const storedAreas  = localStorage.getItem('staffAssignedAreas');
      const storedShifts = localStorage.getItem('staffShifts');

      if (storedAreas) {
        setAssignedAreas(JSON.parse(storedAreas));
      } else {
        const defaults = [
          { id: '1', name: 'Hostel Block', status: 'Active' },
          { id: '2', name: 'Main Gate',    status: 'Active' },
          { id: '3', name: 'Mess Area',    status: 'Active' },
          { id: '4', name: 'Office',       status: 'Active' },
          { id: '5', name: 'Common Area',  status: 'Active' },
          { id: '6', name: 'Other',        status: 'Active' },
        ];
        setAssignedAreas(defaults);
        localStorage.setItem('staffAssignedAreas', JSON.stringify(defaults));
      }

      if (storedShifts) {
        setShifts(JSON.parse(storedShifts));
      } else {
        const defaults = [
          { id: '1', name: 'Morning Shift (06:00 - 14:00)', status: 'Active', fullData: { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
          { id: '2', name: 'Evening Shift (14:00 - 22:00)', status: 'Active', fullData: { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
          { id: '3', name: 'Night Shift (22:00 - 06:00)',   status: 'Active', fullData: { name: 'Night Shift',   startTime: '22:00', endTime: '06:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '30', teaBreak: '15' } },
          { id: '4', name: 'General Shift (09:00 - 17:00)', status: 'Active', fullData: { name: 'General Shift', startTime: '09:00', endTime: '17:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
        ];
        setShifts(defaults);
        localStorage.setItem('staffShifts', JSON.stringify(defaults));
      }
    } catch (e) {
      setError(e.message || 'Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) loadData(); }, [open, loadData]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const persist = (type, data) => {
    if (type === 'assignedArea') {
      localStorage.setItem('staffAssignedAreas', JSON.stringify(data));
      setAssignedAreas(data);
    } else {
      localStorage.setItem('staffShifts', JSON.stringify(data));
      setShifts(data);
    }
    // Directly notify all mounted hook instances — no stale closure risk
    notifyAssignmentDataChanged();
    if (onUpdated) onUpdated();
  };

  const handleCreate = async (type, valueOrData) => {
    setSaving(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 300));
      let newItem;
      if (type === 'shift' && typeof valueOrData === 'object') {
        newItem = {
          id: Date.now().toString(),
          name: `${valueOrData.name} (${valueOrData.startTime} - ${valueOrData.endTime})`,
          fullData: valueOrData,
          status: 'Active',
        };
      } else {
        newItem = { id: Date.now().toString(), name: String(valueOrData), status: 'Active' };
      }
      persist(type, type === 'assignedArea' ? [...assignedAreas, newItem] : [...shifts, newItem]);
      setEditing(null);
    } catch (e) {
      setError(e.message || `Failed to create ${type}.`);
    } finally { setSaving(false); }
  };

  const handleUpdate = async (type, id, valueOrData) => {
    setSaving(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 300));
      if (type === 'shift' && typeof valueOrData === 'object') {
        const updated = shifts.map(s =>
          s.id === id
            ? { ...s, name: `${valueOrData.name} (${valueOrData.startTime} - ${valueOrData.endTime})`, fullData: valueOrData }
            : s
        );
        persist('shift', updated);
      } else {
        const updated = assignedAreas.map(d =>
          d.id === id ? { ...d, name: String(valueOrData) } : d
        );
        persist('assignedArea', updated);
      }
      setEditing(null);
    } catch (e) {
      setError(e.message || `Failed to update ${type}.`);
    } finally { setSaving(false); }
  };

  const handleToggle = async (type, id) => {
    setSaving(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 300));
      if (type === 'assignedArea') {
        persist('assignedArea', assignedAreas.map(d =>
          d.id === id ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d
        ));
      } else {
        persist('shift', shifts.map(s =>
          s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
        ));
      }
    } catch (e) {
      setError(e.message || `Failed to toggle ${type} status.`);
    } finally { setSaving(false); }
  };

  const handleClose = () => { setEditing(null); setError(''); onClose(); };

  const currentData  = tab === 0 ? assignedAreas : shifts;
  const currentType  = tab === 0 ? 'assignedArea' : 'shift';
  const currentLabel = tab === 0 ? 'Assigned Area' : 'Shift';

  return (
    <Modal
      open={open} onClose={handleClose}
      closeAfterTransition disablePortal={false} disableScrollLock={false} keepMounted={false}
      container={() => document.body}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500, sx: { position: 'fixed', inset: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1400 } } }}
      sx={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box sx={{
        position: 'relative',
        width: (tab === 1 && editing)
          ? { xs: '95%', sm: '700px', md: '800px' }
          : { xs: '90%', sm: '520px', md: '600px' },
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        outline: 'none',
        zIndex: 1401,
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}>
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ backgroundColor: theme.palette.primary.light + '20', color: theme.palette.primary.main, p: 1, borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <MapPin size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Assignment Management</Typography>
              <Typography variant="caption" color="text.secondary">Manage assigned areas and shifts</Typography>
            </Box>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setEditing(null); setError(''); }}
            sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' } }}
          >
            <Tab label="Assigned Areas" icon={<MapPin size={16} />} iconPosition="start" sx={{ gap: 0.5 }} />
            <Tab label="Shifts"         icon={<Clock size={16} />}  iconPosition="start" sx={{ gap: 0.5 }} />
          </Tabs>
        </Box>

        <Divider />

        {/* Scrollable body */}
        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* Add form */}
          {editing?.id === 'new' && editing?.type === currentType ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', fontWeight: 600 }}>
                {tab === 1 ? 'CREATE NEW SHIFT' : `NEW ${currentLabel.toUpperCase()}`}
              </Typography>
              {tab === 1
                ? <ShiftForm onSave={d => handleCreate(currentType, d)} onCancel={() => setEditing(null)} saving={saving} />
                : <InlineForm label={currentLabel} onSave={v => handleCreate(currentType, v)} onCancel={() => setEditing(null)} saving={saving} />
              }
            </Box>
          ) : (
            <Button
              size="small" variant="outlined" startIcon={<Plus size={15} />}
              onClick={() => setEditing({ type: currentType, id: 'new' })}
              sx={{ mb: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              disabled={saving}
            >
              Add {currentLabel}
            </Button>
          )}

          {/* List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
          ) : currentData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <MapPin size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Typography variant="body2">No {currentLabel.toLowerCase()}s yet. Add one above.</Typography>
            </Box>
          ) : currentData.map(item => {
            const statusCfg = STATUS_COLORS[item.status] || STATUS_COLORS.Active;
            return editing?.id === item.id && editing?.type === currentType ? (
              <Box key={item.id} sx={{ mb: 1.5 }}>
                {tab === 1
                  ? <ShiftForm
                      initial={item.fullData || buildFallbackFullData(item.name)}
                      onSave={d => handleUpdate(currentType, item.id, d)}
                      onCancel={() => setEditing(null)}
                      saving={saving}
                    />
                  : <InlineForm
                      initial={item.name}
                      label={currentLabel}
                      onSave={v => handleUpdate(currentType, item.id, v)}
                      onCancel={() => setEditing(null)}
                      saving={saving}
                    />
                }
              </Box>
            ) : (
              <ItemRow key={item.id}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.name}</Typography>
                  {item.fullData && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Grace: {item.fullData.lateGracePeriod}min
                      {item.fullData.halfDayAfter ? ` · Half Day after: ${item.fullData.halfDayAfter}` : ''}
                      {' '}· Lunch: {item.fullData.lunchBreak}min
                    </Typography>
                  )}
                </Box>
                <Chip label={item.status} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, color: statusCfg.color, backgroundColor: statusCfg.bg, borderRadius: '6px' }} />
                <IconButton size="small" onClick={() => setEditing({ type: currentType, id: item.id })} sx={{ color: 'text.secondary' }} disabled={saving}>
                  <Edit2 size={14} />
                </IconButton>
                <IconButton size="small" onClick={() => handleToggle(currentType, item.id)} sx={{ color: item.status === 'Active' ? '#16A34A' : '#DC2626' }} disabled={saving}>
                  {item.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </IconButton>
              </ItemRow>
            );
          })}
        </Box>

        <Divider />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' } }}>
            Done
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
