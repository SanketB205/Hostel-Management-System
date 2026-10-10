import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Backdrop,
  Box, Button, TextField, Typography, Chip, IconButton,
  CircularProgress, Alert, Divider, Tabs, Tab,
  useTheme, styled,
} from '@mui/material';
import {
  Plus, Edit2, Check, X, Briefcase, ToggleLeft, ToggleRight, Users,
} from 'lucide-react';
import { notifyEmploymentDataChanged } from '../../hooks/useEmploymentData';

// Styled
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
  Active: { color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  Inactive: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

// Inline editor for adding/editing items
function InlineForm({ initial, onSave, onCancel, label = 'Name', saving }) {
  const [value, setValue] = useState(initial || '');
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!value.trim()) { 
      setErr(`${label} is required.`); 
      return; 
    }
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

// Main Modal
export default function EmploymentManagementModal({ open, onClose, onUpdated }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0); // 0 = Designations, 1 = Employment Types
  const [designations, setDesignations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // { type: 'designation'|'employmentType', id: string|'new', value: string }

  // Load data from localStorage or use defaults
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Try to load from localStorage first
      const storedDesignations = localStorage.getItem('staffDesignations');
      const storedEmploymentTypes = localStorage.getItem('staffEmploymentTypes');
      
      if (storedDesignations) {
        setDesignations(JSON.parse(storedDesignations));
      } else {
        // Default data
        const defaultDesignations = [
          { id: '1', name: 'Warden', status: 'Active' },
          { id: '2', name: 'Assistant Warden', status: 'Active' },
          { id: '3', name: 'Security Guard', status: 'Active' },
          { id: '4', name: 'Maintenance Staff', status: 'Active' },
          { id: '5', name: 'Housekeeping', status: 'Active' },
        ];
        setDesignations(defaultDesignations);
        localStorage.setItem('staffDesignations', JSON.stringify(defaultDesignations));
      }
      
      if (storedEmploymentTypes) {
        setEmploymentTypes(JSON.parse(storedEmploymentTypes));
      } else {
        // Default data
        const defaultEmploymentTypes = [
          { id: '1', name: 'Full-Time', status: 'Active' },
          { id: '2', name: 'Part-Time', status: 'Active' },
          { id: '3', name: 'Contract', status: 'Active' },
          { id: '4', name: 'Temporary', status: 'Active' },
        ];
        setEmploymentTypes(defaultEmploymentTypes);
        localStorage.setItem('staffEmploymentTypes', JSON.stringify(defaultEmploymentTypes));
      }
    } catch (e) {
      setError(e.message || 'Failed to load employment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const saveToLocalStorage = (type, data) => {
    if (type === 'designation') {
      localStorage.setItem('staffDesignations', JSON.stringify(data));
      setDesignations(data);
    } else {
      localStorage.setItem('staffEmploymentTypes', JSON.stringify(data));
      setEmploymentTypes(data);
    }
    // Directly notify all mounted hook instances — no stale closure risk
    notifyEmploymentDataChanged();
  };

  const refreshAndNotify = (type, data) => {
    saveToLocalStorage(type, data);
    if (onUpdated) onUpdated();
  };

  const handleCreate = async (type, value) => {
    setSaving(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newItem = {
        id: Date.now().toString(),
        name: value,
        status: 'Active'
      };
      
      let updatedData;
      if (type === 'designation') {
        updatedData = [...designations, newItem];
        refreshAndNotify('designation', updatedData);
      } else {
        updatedData = [...employmentTypes, newItem];
        refreshAndNotify('employmentType', updatedData);
      }
      
      setEditing(null);
    } catch (e) {
      setError(e.message || `Failed to create ${type}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (type, id, value) => {
    setSaving(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let updatedData;
      if (type === 'designation') {
        updatedData = designations.map(d => d.id === id ? { ...d, name: value } : d);
        refreshAndNotify('designation', updatedData);
      } else {
        updatedData = employmentTypes.map(e => e.id === id ? { ...e, name: value } : e);
        refreshAndNotify('employmentType', updatedData);
      }
      
      setEditing(null);
    } catch (e) {
      setError(e.message || `Failed to update ${type}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (type, id) => {
    setSaving(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let updatedData;
      if (type === 'designation') {
        updatedData = designations.map(d => 
          d.id === id ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d
        );
        refreshAndNotify('designation', updatedData);
      } else {
        updatedData = employmentTypes.map(e => 
          e.id === id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e
        );
        refreshAndNotify('employmentType', updatedData);
      }
    } catch (e) {
      setError(e.message || `Failed to toggle ${type} status.`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditing(null);
    setError('');
    onClose();
  };

  const currentData = tab === 0 ? designations : employmentTypes;
  const currentType = tab === 0 ? 'designation' : 'employmentType';
  const currentLabel = tab === 0 ? 'Designation' : 'Employment Type';

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
          width: { xs: '90%', sm: '520px', md: '600px' },
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          outline: 'none',
          zIndex: 1401,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{
              backgroundColor: theme.palette.primary.light + '20',
              color: theme.palette.primary.main,
              p: 1, borderRadius: '8px', display: 'flex', alignItems: 'center',
            }}>
              <Briefcase size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Employment Management</Typography>
              <Typography variant="caption" color="text.secondary">
                Manage designations and employment types
              </Typography>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs 
            value={tab} 
            onChange={(_, v) => { setTab(v); setEditing(null); setError(''); }}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }
            }}
          >
            <Tab 
              label="Designations" 
              icon={<Users size={16} />} 
              iconPosition="start"
              sx={{ gap: 0.5 }}
            />
            <Tab 
              label="Employment Types" 
              icon={<Briefcase size={16} />} 
              iconPosition="start"
              sx={{ gap: 0.5 }}
            />
          </Tabs>
        </Box>

        <Divider />

        {/* Scrollable content */}
        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
          )}

          {editing?.id === 'new' && editing?.type === currentType ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                NEW {currentLabel.toUpperCase()}
              </Typography>
              <InlineForm
                label={currentLabel}
                onSave={(value) => handleCreate(currentType, value)}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            </Box>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={15} />}
              onClick={() => setEditing({ type: currentType, id: 'new' })}
              sx={{ mb: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              disabled={saving}
            >
              Add {currentLabel}
            </Button>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : currentData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Briefcase size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Typography variant="body2">No {currentLabel.toLowerCase()}s yet. Add one above.</Typography>
            </Box>
          ) : (
            currentData.map(item => {
              const statusCfg = STATUS_COLORS[item.status] || STATUS_COLORS.Active;
              
              return editing?.id === item.id && editing?.type === currentType ? (
                <Box key={item.id} sx={{ mb: 1.5 }}>
                  <InlineForm
                    initial={item.name}
                    label={currentLabel}
                    onSave={(value) => handleUpdate(currentType, item.id, value)}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                  />
                </Box>
              ) : (
                <ItemRow key={item.id}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      fontSize: '0.68rem', fontWeight: 700,
                      color: statusCfg.color, backgroundColor: statusCfg.bg,
                      borderRadius: '6px',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setEditing({ type: currentType, id: item.id })}
                    sx={{ color: 'text.secondary' }}
                    disabled={saving}
                  >
                    <Edit2 size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleToggle(currentType, item.id)}
                    sx={{ color: item.status === 'Active' ? '#16A34A' : '#DC2626' }}
                    disabled={saving}
                  >
                    {item.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </IconButton>
                </ItemRow>
              );
            })
          )}
        </Box>

        <Divider />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600, 
              borderRadius: '8px', 
              backgroundColor: '#4F46E5', 
              '&:hover': { backgroundColor: '#4338CA' } 
            }}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
