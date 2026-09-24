import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, useTheme, styled,
  Modal, Backdrop, TextField, MenuItem, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, CircularProgress
} from '@mui/material';
import { CreditCard, Plus, X, IndianRupee, Trash2 } from 'lucide-react';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { payments as paymentsApi } from '../../api';

// ── Styled Components ─────────────────────────────────────────────────────────

const SectionCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  overflow: 'visible',
}));

const SectionHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
  }
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

const SummaryCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : theme.palette.background.default,
}));

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '90%',
  maxWidth: '600px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  outline: 'none',
  maxHeight: '90vh',
  overflowY: 'auto',
  zIndex: 1402,
  [theme.breakpoints.down('sm')]: {
    width: '95%',
    maxHeight: '95vh',
  }
}));

const BalanceDueBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPaid',
})(({ theme, isPaid }) => ({
  backgroundColor: isPaid 
    ? (theme.palette.mode === 'light' ? '#F0FDF4' : 'rgba(34,197,94,0.1)')
    : (theme.palette.mode === 'light' ? '#FEF2F2' : 'rgba(239,68,68,0.1)'),
  border: isPaid
    ? `2px solid ${theme.palette.mode === 'light' ? '#BBF7D0' : 'rgba(34,197,94,0.2)'}`
    : `2px solid ${theme.palette.mode === 'light' ? '#FEE2E2' : 'rgba(239,68,68,0.2)'}`,
  borderRadius: '12px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentLedger({ studentName = 'Student', registrationNumber = '', studentId }) {
  const theme = useTheme();

  // ── State for API Data ──────────────────────────────────────────────────────
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBillable, setTotalBillable] = useState(0);
  const [payments, setPayments] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Modal State ─────────────────────────────────────────────────────────────

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    mode: 'Cash',
    reference: '',
    date: dayjs(),
    receipt: null,
    notes: '',
  });
  const [receiptFileName, setReceiptFileName] = useState('');

  // ── Fetch Payment Data ──────────────────────────────────────────────────────

  const fetchPaymentData = async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsApi.getByStudent(studentId);
      const data = response.data;
      
      setTotalBillable(data.totalBillable || 0);
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to load payment data:', err);
      setError(err.message || 'Failed to load payment information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // ── Calculations ────────────────────────────────────────────────────────────

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const balanceDue = useMemo(() => {
    return Math.max(0, totalBillable - totalPaid);
  }, [totalBillable, totalPaid]);

  const paymentStatus = useMemo(() => {
    if (totalPaid === 0) return 'Pending';
    if (balanceDue === 0) return 'Paid in Full';
    return 'Partial';
  }, [totalPaid, balanceDue]);

  const statusColors = {
    'Pending': { bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
    'Partial': { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
    'Paid in Full': { bg: 'rgba(34,197,94,0.1)', color: '#16A34A' },
  };

  // ── Modal Handlers ──────────────────────────────────────────────────────────

  const openModal = () => {
    setModalOpen(true);
    // Reset form
    setFormData({
      amount: '',
      mode: 'Cash',
      reference: '',
      date: dayjs(),
      receipt: null,
      notes: '',
    });
    setReceiptFileName('');
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handlePayFullDue = () => {
    setFormData(prev => ({ ...prev, amount: balanceDue.toString() }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFileName(file.name);
      setFormData(prev => ({ ...prev, receipt: file }));
    }
  };

  const handleSavePayment = async () => {
    // Validate amount
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      // Call API to create payment
      const response = await paymentsApi.create({
        studentId,
        amount: amountNum,
        paymentMode: formData.mode,
        transactionId: formData.reference || null,
        paymentDate: (formData.date && dayjs.isDayjs(formData.date) && formData.date.isValid())
          ? formData.date.toISOString()
          : new Date().toISOString(),
        notes: formData.notes || null,
        receivedBy: 'Admin' // Current user - could be passed from context
      });

      // Refresh payment data from server
      await fetchPaymentData();

      // Close modal
      closeModal();
    } catch (err) {
      console.error('Failed to save payment:', err);
      alert(err.message || 'Failed to save payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      await paymentsApi.delete(paymentId);
      // Refresh payment data from server
      await fetchPaymentData();
    } catch (err) {
      console.error('Failed to delete payment:', err);
      alert(err.message || 'Failed to delete payment. Please try again.');
    }
  };

  // ── Format Helpers ──────────────────────────────────────────────────────────

  const fmtCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const fmtDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // ── Lock Body Scroll When Modal Open ────────────────────────────────────────

  React.useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SectionCard>
        <CardContent sx={{ p: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </CardContent>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            {error}
          </Alert>
        </CardContent>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          
          {/* Header */}
          <SectionHeaderBox>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconWrapper><CreditCard size={24} /></IconWrapper>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Payment & Collection Ledger
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Track paid receipts, installment history and pending balance
                </Typography>
              </Box>
            </Box>
            <Chip
              label={paymentStatus}
              sx={{
                fontWeight: 600,
                backgroundColor: statusColors[paymentStatus].bg,
                color: statusColors[paymentStatus].color,
                px: 1,
                height: '32px',
              }}
            />
          </SectionHeaderBox>

          {/* Summary Cards */}
          <Box sx={{ 
            display: 'grid', 
            gap: 3, 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            mb: 4 
          }}>
            {/* Total Billable */}
            <SummaryCard>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Total Billable
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {fmtCurrency(totalBillable)}
                </Typography>
              </CardContent>
            </SummaryCard>

            {/* Total Paid */}
            <SummaryCard>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Total Paid
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A' }}>
                  {fmtCurrency(totalPaid)}
                </Typography>
              </CardContent>
            </SummaryCard>

            {/* Balance Due */}
            <SummaryCard>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Balance Due
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: balanceDue > 0 ? '#DC2626' : '#16A34A' }}>
                  {fmtCurrency(balanceDue)}
                </Typography>
              </CardContent>
            </SummaryCard>
          </Box>

          {/* Payment History Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Payment Installment History
            </Typography>
            {balanceDue > 0 && (
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={openModal}
                sx={{
                  backgroundColor: '#4F46E5',
                  '&:hover': { backgroundColor: '#4338CA' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: 'none'
                }}
              >
                Record Payment
              </Button>
            )}
          </Box>

          {/* Payment History Table */}
          {payments.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '8px' }}>
              No payment records found. Click "Record Payment" to add the first installment.
            </Alert>
          ) : (
            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: '12px', 
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                overflowX: 'auto'
              }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Payment Mode</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Reference / Notes</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Received By</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Receipt / Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {fmtDateTime(payment.date)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#16A34A', whiteSpace: 'nowrap' }}>
                        {fmtCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.mode} 
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: theme.palette.mode === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.05)'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {payment.reference || payment.notes || '—'}
                      </TableCell>
                      <TableCell>{payment.receivedBy}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {payment.receipt && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {payment.receipt}
                            </Typography>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePayment(payment.id)}
                            sx={{ 
                              color: '#DC2626',
                              '&:hover': { backgroundColor: 'rgba(220,38,38,0.1)' }
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

        </CardContent>
      </SectionCard>

      {/* Record Payment Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        closeAfterTransition
        container={() => document.body}
        disablePortal={false}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
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
          zIndex: 1401,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ModalBox>
          {/* Modal Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconWrapper sx={{ backgroundColor: '#16A34A20', color: '#16A34A' }}>
                <IndianRupee size={24} />
              </IconWrapper>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Record Payment
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Add full or partial installment for {studentName}
                  {registrationNumber && ` #${registrationNumber}`}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={closeModal} size="small">
              <X size={20} />
            </IconButton>
          </Box>

          {/* Modal Body */}
          <Box sx={{ p: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              
              {/* Current Balance Due */}
              <BalanceDueBox isPaid={balanceDue === 0}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Current Balance Due
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: balanceDue > 0 ? '#DC2626' : '#16A34A', mt: 0.5 }}>
                    {fmtCurrency(balanceDue)}
                  </Typography>
                </Box>
                {balanceDue > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handlePayFullDue}
                    sx={{
                      borderColor: '#DC2626',
                      color: '#DC2626',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#B91C1C',
                        backgroundColor: 'rgba(220,38,38,0.04)'
                      }
                    }}
                  >
                    Pay Full Due
                  </Button>
                )}
              </BalanceDueBox>

              {/* Form Fields */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Row 1: Amount & Payment Mode */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <TextField
                    label="Amount Paid (₹) *"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 5000"
                    slotProps={{
                      input: {
                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                      }
                    }}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Payment Mode *"
                    value={formData.mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                    fullWidth
                    slotProps={{
                      select: {
                        MenuProps: {
                          sx: { zIndex: 1600 },
                          slotProps: {
                            paper: {
                              sx: { maxHeight: 300 }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Online Payment">Online Payment</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>

                {/* Row 2: Reference & Date */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <TextField
                    label="Reference / Transaction ID"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="e.g. UPI Ref / UTR / Cheque #"
                    fullWidth
                  />
                  <DateTimePicker
                    label="Payment Date"
                    value={formData.date}
                    onChange={(newValue) => setFormData(prev => ({ ...prev, date: newValue }))}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true 
                      },
                      popper: {
                        sx: { zIndex: 1600 }
                      },
                      dialog: {
                        sx: { zIndex: 1600 }
                      }
                    }}
                  />
                </Box>

                {/* Receipt Upload */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Payment Receipt / Screenshot (Optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      py: 1.5,
                      color: 'text.secondary',
                      borderColor: theme.palette.divider
                    }}
                  >
                    {receiptFileName || 'Choose file'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>

                {/* Notes */}
                <TextField
                  label="Notes / Remarks (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={3}
                  placeholder="e.g. First installment paid in cash, remaining balance promised next week..."
                  fullWidth
                />

              </Box>

            </LocalizationProvider>
          </Box>

          {/* Modal Footer */}
          <Box sx={{ 
            p: 3, 
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2
          }}>
            <Button
              variant="outlined"
              onClick={closeModal}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderColor: theme.palette.divider,
                color: 'text.secondary'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePayment}
              disabled={saving}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                backgroundColor: '#16A34A',
                '&:hover': { backgroundColor: '#15803D' },
                boxShadow: 'none'
              }}
            >
              {saving ? 'Saving...' : 'Save Payment Record'}
            </Button>
          </Box>

        </ModalBox>
      </Modal>
    </>
  );
}
