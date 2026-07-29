import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import StaffStats from '../components/staff/StaffStats';
import StaffFilters from '../components/staff/StaffFilters';
import StaffTable from '../components/staff/StaffTable';
import { staff as staffApi } from '../api';

export default function StaffPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync staff state from backend when page is navigated to
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.list();
      const list = (res.data || []).map(s => ({
        ...s,
        name: s.name || `${s.firstName} ${s.lastName}`,
      }));
      setStaff(list);
    } catch (e) {
      setSnackbar({ open: true, message: `Failed to load staff: ${e.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff, location]);

  // Display success message from location state (navigation redirection)
  useEffect(() => {
    if (location.state?.successMessage) {
      setSnackbar({
        open: true,
        message: location.state.successMessage,
        severity: 'success'
      });
      // Clear the message state so it doesn't reappear on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);


  const [filters, setFilters] = useState({
    search: '',
    designation: 'All',
    assignedBlock: 'All'
  });

  const handleResetFilters = () => {
    setFilters({ search: '', designation: 'All', assignedBlock: 'All' });
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                            s.staffId.toLowerCase().includes(filters.search.toLowerCase()) || 
                            s.phone.includes(filters.search);
      const matchesDesignation = filters.designation === 'All' || s.designation === filters.designation;
      const matchesBlock = filters.assignedBlock === 'All' || s.assignedBlock === filters.assignedBlock;

      return matchesSearch && matchesDesignation && matchesBlock;
    });
  }, [staff, filters]);

  const handleAddClick = () => {
    navigate('/staff/add');
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(s => ({ ...s, open: false }));
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Staff Management
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
      ) : (
        <>
          <StaffStats staff={filteredStaff} />
          
          <StaffFilters 
            filters={filters} 
            setFilters={setFilters} 
            onReset={handleResetFilters}
            onAddClick={handleAddClick}
          />
          
          <StaffTable staff={filteredStaff} />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
