import { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert, Button } from '@mui/material';
import ComplaintStats from '../components/complaints/ComplaintStats';
import ComplaintFilters from '../components/complaints/ComplaintFilters';
import ComplaintTable from '../components/complaints/ComplaintTable';
import { complaints as complaintsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Normalise API response → shape the existing components expect ─────────────
function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');
  } catch (_) { return val; }
}

function normalize(c) {
  // Room number: pulled from the student's active BedAllocation → Room
  const activeAlloc = c.student?.allocations?.[0];
  const roomNo = activeAlloc?.room?.number || '—';

  return {
    complaintId:     c.complaintNumber,
    id:              c.id,
    studentName:     c.student
      ? `${c.student.firstName} ${c.student.lastName}`
      : '—',
    roomNo,
    category:        c.category,
    title:           c.title,
    priority:        c.priority,
    status:          c.status,
    date:            fmtDate(c.createdAt),
    lastUpdated:     fmtDate(c.updatedAt),
    description:     c.description,
    attachment:      c.attachmentName || null,
    creatorRole:     c.student?.user?.role || 'student',
    studentUserId:   c.student?.userId || null,
    assignedTo:      c.assignedTo
      ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}`
      : null,
    resolvedBy:      c.resolvedBy
      ? `${c.resolvedBy.firstName} ${c.resolvedBy.lastName}`
      : null,
    resolutionNotes: c.resolutionNotes || null,
    resolvedDate:    fmtDate(c.resolvedAt),
    timeline: (c.timeline || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(t => ({
        label: t.label,
        date:  fmtDate(t.createdAt),
        done:  true,
      })),
  };
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [snackbar, setSnackbar]     = useState({ open: false, message: '', severity: 'error' });

  const [filters, setFilters] = useState(() => ({
    search: '', status: 'All', category: 'All', priority: 'All', block: 'All',
    creatorRole: 'All',
  }));

  // ── Fetch all complaints from backend ──────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      // Pass creatorRole filter to backend if admin
      const params = {};
      if (user?.role === 'admin' && filters.creatorRole && filters.creatorRole !== 'All') {
        params.creatorRole = filters.creatorRole;
      }
      
      const res = await complaintsApi.listAll(params);
      const allNormalized = (res.data || []).map(normalize);
      
      // Rector still filters client-side to only see student complaints
      const filtered = user?.role === 'rector'
        ? allNormalized.filter(c => c.creatorRole === 'student')
        : allNormalized;
      
      setComplaints(filtered);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to load complaints.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, filters.creatorRole]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Client-side filters (search + dropdowns) ───────────────────────────────
  const handleResetFilters = () =>
    setFilters({
      search: '',
      status: 'All',
      category: 'All',
      priority: 'All',
      block: 'All',
      creatorRole: 'All',
    });

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        !q ||
        c.studentName.toLowerCase().includes(q) ||
        c.complaintId.toLowerCase().includes(q) ||
        c.roomNo.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q);

      const matchesStatus   = filters.status   === 'All' || c.status   === filters.status;
      const matchesCategory = filters.category === 'All' || c.category === filters.category;
      const matchesPriority = filters.priority === 'All' || c.priority === filters.priority;
      const matchesCreator  = filters.creatorRole === 'All' || c.creatorRole === filters.creatorRole;

      // Block filter — room number starts with the block letter e.g. "A-101"
      const matchesBlock =
        filters.block === 'All' ||
        c.roomNo.toUpperCase().startsWith(filters.block.split(' ')[1]);

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesBlock && matchesCreator;
    });
  }, [complaints, filters]);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Complaint Management
        </Typography>
        {user?.role === 'rector' && (
          <Button
            variant="outlined"
            onClick={() => navigate('/complaints/my')}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#4F46E5',
              color: '#4F46E5',
              '&:hover': {
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                borderColor: '#4338CA',
              }
            }}
          >
            My Complaints
          </Button>
        )}
      </Box>

      <ComplaintStats complaints={filteredComplaints} />

      <ComplaintFilters
        filters={filters}
        setFilters={setFilters}
        onReset={handleResetFilters}
        onAddClick={null}
        showRoleFilter={isAdmin}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ComplaintTable complaints={filteredComplaints} onRefresh={fetchComplaints} />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
