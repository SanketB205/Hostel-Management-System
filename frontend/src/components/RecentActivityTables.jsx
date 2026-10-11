import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, InputBase, IconButton, Button, Skeleton, Avatar, useTheme, Tooltip,
} from '@mui/material';
import { Search, Eye, ArrowRight, UserCheck, CreditCard, Building } from 'lucide-react';
import { hostel as hostelApi } from '../api';
import { useNavigate } from 'react-router-dom';

export default function RecentActivityTables() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    hostelApi.getDashboardStats()
      .then(res => setStudents(res.data?.recentStudents || []))
      .catch(err => console.error('RecentActivityTables: failed to load', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q) ||
      (s.regNo || '').toLowerCase().includes(q) ||
      (s.course || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.room || '').toLowerCase().includes(q) ||
      (s.paymentStatus || '').toLowerCase().includes(q)
    );
  });

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPaymentChip = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('paid') && !s.includes('partial') && !s.includes('pending')) {
      return (
        <Chip
          size="small"
          label="Paid"
          sx={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#16A34A',
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: '6px',
          }}
        />
      );
    }
    if (s.includes('partial')) {
      return (
        <Chip
          size="small"
          label="Partial"
          sx={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#D97706',
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: '6px',
          }}
        />
      );
    }
    return (
      <Chip
        size="small"
        label="Pending"
        sx={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: '6px',
        }}
      />
    );
  };

  const handleRowClick = (student) => {
    const targetId = student.studentId || student.id;
    if (targetId) {
      navigate(`/students/${targetId}`);
    }
  };

  return (
    <Card sx={{ mt: 4, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <Box sx={{
        borderBottom: 1, borderColor: 'divider',
        px: { xs: 2, sm: 3 }, py: 2,
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.3px' }}>
            Recent Registrations
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
            Latest students enrolled into the hostel management system
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'center',
          backgroundColor: 'background.default',
          border: 1, borderColor: 'divider',
          borderRadius: 2, px: 1.5, py: 0.5,
          minWidth: { xs: '100%', sm: 220 },
        }}>
          <Search size={16} color={theme.palette.text.secondary} />
          <InputBase
            placeholder="Search registrations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ ml: 1, fontSize: '0.875rem', width: '100%' }}
          />
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', display: { xs: 'none', md: 'table-cell' } }}>
                Course & Department
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', display: { xs: 'none', sm: 'table-cell' } }}>
                Payment
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', display: { xs: 'none', lg: 'table-cell' } }}>
                Registered Date
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="text" width={160} /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width={140} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={70} height={24} /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Skeleton variant="rounded" width={65} height={24} /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><Skeleton variant="text" width={90} /></TableCell>
                  <TableCell align="right"><Skeleton variant="circular" width={28} height={28} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {search ? 'No students match your search criteria.' : 'No recent registrations recorded yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, idx) => {
                const hasRoom = row.room && row.room !== '—' && row.room !== 'Unallocated';
                return (
                  <TableRow
                    key={row.studentId || row.id || idx}
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.2s ease',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    {/* Student Info */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          width: 36, height: 36,
                          backgroundColor: 'rgba(79, 70, 229, 0.1)',
                          color: '#4F46E5',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                        }}>
                          {row.name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {row.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              backgroundColor: 'action.hover',
                              px: 0.6,
                              py: 0.2,
                              borderRadius: '4px',
                              fontSize: '0.725rem',
                            }}
                          >
                            {row.regNo || row.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Course & Department */}
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {row.course}
                      </Typography>
                      {row.department && row.department !== '—' && row.department !== row.course ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {row.department} {row.year && row.year !== '—' ? `• ${row.year}` : ''}
                        </Typography>
                      ) : row.year && row.year !== '—' ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {row.year}
                        </Typography>
                      ) : null}
                    </TableCell>

                    {/* Room */}
                    <TableCell>
                      {hasRoom ? (
                        <Chip
                          size="small"
                          label={`Room ${row.room}`}
                          sx={{
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                            color: '#4F46E5',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Unallocated"
                          sx={{
                            borderColor: 'divider',
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {getPaymentChip(row.paymentStatus)}
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8125rem', display: { xs: 'none', lg: 'table-cell' } }}>
                      {fmtDate(row.date)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Tooltip title="View Student Profile" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                          }}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.08)' },
                          }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Box sx={{
        p: 2, px: { xs: 2, sm: 3 },
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: 1, borderColor: 'divider',
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
          {loading ? 'Loading...' : `Showing ${filtered.length} of ${students.length} recent registrations`}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowRight size={15} />}
          onClick={() => navigate('/students')}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: '#4F46E5', color: '#4F46E5' },
          }}
        >
          View All Students
        </Button>
      </Box>
    </Card>
  );
}
