import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Backdrop,
  Box, Button, TextField, Typography, Chip, IconButton,
  Collapse, CircularProgress, Alert, Divider,
  useTheme, styled,
} from '@mui/material';
import {
  Plus, Edit2, ChevronDown, ChevronRight, GraduationCap,
  Check, X, BookOpen, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { departments as departmentsApi } from '../../api';

// Styled
const DeptRow = styled(Box)(({ theme }) => ({
  borderRadius: '10px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
  marginBottom: theme.spacing(1.5),
}));

const DeptHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  cursor: 'pointer',
  '&:hover': { backgroundColor: theme.palette.action.hover },
}));

const CourseRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2, 1, 4),
  borderTop: `1px solid ${theme.palette.divider}`,
  '&:hover': { backgroundColor: theme.palette.action.hover },
}));

const STATUS_COLORS = {
  Active: { color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  Inactive: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

// Inline editor
function InlineForm({ initial, onSave, onCancel, labels = ['Name', 'Code'], saving }) {
  const [name, setName] = useState(initial?.name || '');
  const [code, setCode] = useState(initial?.code || '');
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr(`${labels[0]} is required.`); return; }
    if (!code.trim()) { setErr(`${labels[1]} is required.`); return; }
    setErr('');
    await onSave({ name: name.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
      {err && <Alert severity="error" sx={{ py: 0 }}>{err}</Alert>}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small" label={`${labels[0]} *`} value={name}
          onChange={e => setName(e.target.value)} sx={{ flex: 2, minWidth: 160 }}
          autoFocus disabled={saving}
        />
        <TextField
          size="small" label={`${labels[1]} *`} value={code}
          onChange={e => setCode(e.target.value)} sx={{ flex: 1, minWidth: 90 }}
          disabled={saving}
          inputProps={{ style: { textTransform: 'uppercase' } }}
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
export default function DepartmentManagementModal({ open, onClose, onUpdated }) {
  const theme = useTheme();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [editingDept, setEditingDept] = useState(null);
  const [addingCourseDept, setAddingCourseDept] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  const loadDepts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await departmentsApi.list();
      setDepts(res.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadDepts();
  }, [open, loadDepts]);

  // Lock body scroll while open, restore on close
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const refreshAndNotify = async () => {
    await loadDepts();
    if (onUpdated) onUpdated();
  };

  const handleCreateDept = async ({ name, code }) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.create({ name, code });
      setEditingDept(null);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to create department.'); }
    finally { setSaving(false); }
  };

  const handleUpdateDept = async (id, { name, code }) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.update(id, { name, code });
      setEditingDept(null);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to update department.'); }
    finally { setSaving(false); }
  };

  const handleToggleDept = async (id) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.toggleStatus(id);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to toggle department status.'); }
    finally { setSaving(false); }
  };

  const handleCreateCourse = async (deptId, { name, code }) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.createCourse(deptId, { name, code });
      setAddingCourseDept(null);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to create course.'); }
    finally { setSaving(false); }
  };

  const handleUpdateCourse = async (courseId, { name, code }) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.updateCourse(courseId, { name, code });
      setEditingCourse(null);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to update course.'); }
    finally { setSaving(false); }
  };

  const handleToggleCourse = async (courseId) => {
    setSaving(true); setError('');
    try {
      await departmentsApi.toggleCourseStatus(courseId);
      await refreshAndNotify();
    } catch (e) { setError(e.message || 'Failed to toggle course status.'); }
    finally { setSaving(false); }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ [id]: !prev[id] }));

  const handleClose = () => {
    setEditingDept(null);
    setAddingCourseDept(null);
    setEditingCourse(null);
    setError('');
    onClose();
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              backgroundColor: theme.palette.primary.light + '20',
              color: theme.palette.primary.main,
              p: 1, borderRadius: '8px', display: 'flex', alignItems: 'center',
            }}>
              <GraduationCap size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Department Management</Typography>
              <Typography variant="caption" color="text.secondary">
                Add and manage departments and courses
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Scrollable content */}
        <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
          )}

          {editingDept === 'new' ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                NEW DEPARTMENT
              </Typography>
              <InlineForm
                labels={['Department Name', 'Code']}
                onSave={handleCreateDept}
                onCancel={() => setEditingDept(null)}
                saving={saving}
              />
            </Box>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={15} />}
              onClick={() => setEditingDept('new')}
              sx={{ mb: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              disabled={saving}
            >
              Add Department
            </Button>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : depts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <BookOpen size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Typography variant="body2">No departments yet. Add one above.</Typography>
            </Box>
          ) : (
            depts.map(dept => {
              const isOpen = !!expanded[dept.id];
              const statusCfg = STATUS_COLORS[dept.status] || STATUS_COLORS.Active;

              return (
                <DeptRow key={dept.id}>
                  {editingDept === dept.id ? (
                    <Box sx={{ p: 1.5 }}>
                      <InlineForm
                        initial={{ name: dept.name, code: dept.code }}
                        labels={['Department Name', 'Code']}
                        onSave={(data) => handleUpdateDept(dept.id, data)}
                        onCancel={() => setEditingDept(null)}
                        saving={saving}
                      />
                    </Box>
                  ) : (
                    <DeptHeader onClick={() => toggleExpand(dept.id)}>
                      <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {dept.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {dept.code}
                        </Typography>
                      </Box>
                      <Chip
                        label={dept.status}
                        size="small"
                        sx={{
                          fontSize: '0.68rem', fontWeight: 700,
                          color: statusCfg.color, backgroundColor: statusCfg.bg,
                          borderRadius: '6px',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); setEditingDept(dept.id); setExpanded({ [dept.id]: true }); }}
                        sx={{ color: 'text.secondary' }}
                        disabled={saving}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); handleToggleDept(dept.id); }}
                        sx={{ color: dept.status === 'Active' ? '#16A34A' : '#DC2626' }}
                        disabled={saving}
                      >
                        {dept.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </IconButton>
                    </DeptHeader>
                  )}

                  <Collapse in={isOpen}>
                    {(dept.courses || []).map(course => {
                      const cStatusCfg = STATUS_COLORS[course.status] || STATUS_COLORS.Active;
                      return editingCourse === course.id ? (
                        <Box key={course.id} sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                          <InlineForm
                            initial={{ name: course.name, code: course.code }}
                            labels={['Course Name', 'Code']}
                            onSave={(data) => handleUpdateCourse(course.id, data)}
                            onCancel={() => setEditingCourse(null)}
                            saving={saving}
                          />
                        </Box>
                      ) : (
                        <CourseRow key={course.id}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{course.name}</Typography>
                            <Typography variant="caption" color="text.secondary">Code: {course.code}</Typography>
                          </Box>
                          <Chip
                            label={course.status}
                            size="small"
                            sx={{
                              fontSize: '0.65rem', fontWeight: 700,
                              color: cStatusCfg.color, backgroundColor: cStatusCfg.bg,
                              borderRadius: '5px',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setEditingCourse(course.id)}
                            sx={{ color: 'text.secondary' }}
                            disabled={saving}
                          >
                            <Edit2 size={13} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleCourse(course.id)}
                            sx={{ color: course.status === 'Active' ? '#16A34A' : '#DC2626' }}
                            disabled={saving}
                          >
                            {course.status === 'Active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </IconButton>
                        </CourseRow>
                      );
                    })}

                    {addingCourseDept === dept.id && (
                      <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <InlineForm
                          labels={['Course Name', 'Code']}
                          onSave={(data) => handleCreateCourse(dept.id, data)}
                          onCancel={() => setAddingCourseDept(null)}
                          saving={saving}
                        />
                      </Box>
                    )}
                  </Collapse>

                  {addingCourseDept !== dept.id && (
                    <Box sx={{ px: 2, pb: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Button
                        size="small"
                        startIcon={<Plus size={13} />}
                        onClick={() => { setAddingCourseDept(dept.id); setExpanded({ [dept.id]: true }); }}
                        sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.78rem', mt: 1 }}
                        disabled={saving}
                      >
                        Add Course
                      </Button>
                    </Box>
                  )}
                </DeptRow>
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
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' } }}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}