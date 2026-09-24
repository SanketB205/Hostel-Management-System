import React, { useState } from 'react';
import {
  Box, Typography, Button, useTheme, styled, TextField, MenuItem,
  Modal, Backdrop, IconButton
} from '@mui/material';
import { IndianRupee, X } from 'lucide-react';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// ── Styled Components ─────────────────────────────────────────────────────────

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

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: '#16A34A20',
  color: '#16A34A',
  padding: theme.spacing(1),
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

export default function RecordPaymentModal({ 
  open, 
  onClose, 
  onSave,
  balanceDue = 0,
  studentName = 'Student',
  registrationNumber = ''
}) {
  const theme = useTheme();

  const [formData, setFormData] = useState({
    amount: '',
    mode: 'Cash',
    reference: '',
    date: dayjs(),
    receipt: null,
    notes: '',
  });
  const [receiptFileName, setReceiptFileName] = useState('');

  // Lock body scroll when modal open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        amount: '',
        mode: 'Cash',
        reference: '',
        date: dayjs(),
        receipt: null,
        notes: '',
      });
      setReceiptFileName('');
    }
  }, [open]);

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

  const handleSave = () => {
    // Validate amount
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Don't allow exceeding balance due
    if (amountNum > balanceDue) {
      alert(`Amount cannot exceed balance due of ₹${balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    // Create payment object with backend-compatible field names
    const payment = {
      id: Date.now(),
      paymentDate: (formData.date && dayjs.isDayjs(formData.date) && formData.date.isValid())
        ? formData.date.toISOString()
        : new Date().toISOString(),
      amount: amountNum,
      paymentMode: formData.mode, // Backend expects 'paymentMode'
      transactionId: formData.reference || '', // Backend expects 'transactionId'
      notes: formData.notes || '',
      receivedBy: 'Admin', // Mock current user
      receipt: receiptFileName || null,
    };

    onSave(payment);
    onClose();
  };

  const fmtCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
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
            <IconWrapper>
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
          <IconButton onClick={onClose} size="small">
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
            onClick={onClose}
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
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: '#16A34A',
              '&:hover': { backgroundColor: '#15803D' },
              boxShadow: 'none'
            }}
          >
            Save Payment Record
          </Button>
        </Box>

      </ModalBox>
    </Modal>
  );
}
