import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Chip, Button, Drawer, IconButton,
  useTheme, styled, Radio, RadioGroup, FormControlLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Divider, Modal, Backdrop, CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { students as studentsApi } from '../api';
import {
  IndianRupee, CheckCircle2, Clock, Calendar, CreditCard, X, Eye, Receipt, ArrowLeft
} from 'lucide-react';

// ─── Design tokens (matching HostelSpace design system) ───────────────────────
const INDIGO = '#4F46E5';
const INDIGO_HOVER = '#4338CA';

// ─── Styled helpers ────────────────────────────────────────────────────────────
const SectionCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  overflow: 'visible',
}));

const SectionHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
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

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_STUDENT_FINANCE = {
  studentName: 'Sanket Bhujbal',
  registrationNo: 'CSE23001',
  academicYear: '2026-27',
  feeType: 'Hostel Fee',
  totalFee: 40000,
  paid: 20000,
  pending: 20000,
  dueDate: '30 Sep 2026',
  status: 'Partial', // 'Partial' | 'Paid' | 'Pending'
  paymentHistory: [
    {
      receiptNo: 'REC001',
      date: '20 Aug 2026',
      amount: 20000,
      paymentMode: 'UPI',
      status: 'Success',
      transactionId: 'TXN20260820123456',
    },
  ],
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────
function FinanceSummaryCards({ data }) {
  const cards = [
    {
      id: 'total',
      title: 'Total Fees',
      icon: IndianRupee,
      value: `₹${data.totalFee.toLocaleString('en-IN')}`,
      subtitle: 'Total assigned fee',
      color: '#4F46E5',
      bg: 'rgba(79,70,229,0.1)',
    },
    {
      id: 'paid',
      title: 'Paid Amount',
      icon: CheckCircle2,
      value: `₹${data.paid.toLocaleString('en-IN')}`,
      subtitle: 'Amount already paid',
      color: '#16A34A',
      bg: 'rgba(22,163,74,0.1)',
    },
    {
      id: 'pending',
      title: 'Pending Amount',
      icon: Clock,
      value: `₹${data.pending.toLocaleString('en-IN')}`,
      subtitle: 'Remaining amount',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.1)',
    },
    {
      id: 'due',
      title: 'Due Date',
      icon: Calendar,
      value: data.dueDate,
      subtitle: 'Next payment due date',
      color: '#DC2626',
      bg: 'rgba(220,38,38,0.1)',
    },
  ];

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      gap: 3,
      mb: 4,
    }}>
      {cards.map(({ id, title, icon: Icon, value, subtitle, color, bg }) => (
        <Card key={id} sx={{
          p: 3, display: 'flex', flexDirection: 'column', height: '100%',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              backgroundColor: bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color, mr: 2,
            }}>
              <Icon size={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>{title}</Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '28px', sm: '32px' } }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}

// ─── Payment Due Section ───────────────────────────────────────────────────────
function PaymentDueSection({ data, onPayNow }) {
  const theme = useTheme();
  
  const isPaid = data.pending === 0;
  const isNotPaid = data.paid === 0;
  const statusColor = isPaid ? '#16A34A' : isNotPaid ? '#DC2626' : data.status === 'Partial' ? '#F59E0B' : '#DC2626';
  const statusBg = isPaid ? 'rgba(22,163,74,0.1)' : isNotPaid ? 'rgba(220,38,38,0.1)' : data.status === 'Partial' ? 'rgba(245,158,11,0.1)' : 'rgba(220,38,38,0.1)';

  return (
    <SectionCard sx={{ mb: 4 }}>
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <SectionHeaderBox>
          <IconWrapper>
            {isPaid ? <CheckCircle2 size={24} /> : <CreditCard size={24} />}
          </IconWrapper>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isPaid ? 'Fees Fully Paid' : 'Payment Due'}
          </Typography>
        </SectionHeaderBox>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 3,
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary"
              sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fee Type
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
              {data.feeType}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary"
              sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Fee
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
              ₹{data.totalFee.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary"
              sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Paid
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#16A34A', mt: 0.5 }}>
              ₹{data.paid.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary"
              sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Remaining
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: isPaid ? '#16A34A' : '#F59E0B', mt: 0.5 }}>
              ₹{data.pending.toLocaleString('en-IN')}
            </Typography>
          </Box>
          {!isPaid && (
            <Box>
              <Typography variant="caption" color="text.secondary"
                sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Due Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                {data.dueDate}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary"
              sx={{ mb: 0.5, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Status
            </Typography>
            <Chip 
              label={isPaid ? 'Paid' : isNotPaid ? 'Not paid' : data.status}
              size="small"
              sx={{ 
                fontWeight: 600, 
                mt: 0.5,
                backgroundColor: statusBg, 
                color: statusColor,
              }} 
            />
          </Box>
        </Box>

        {isPaid ? (
          <Box sx={{
            p: 3, borderRadius: 2, textAlign: 'center',
            backgroundColor: 'rgba(22,163,74,0.05)',
            border: `1px solid rgba(22,163,74,0.2)`,
          }}>
            <CheckCircle2 size={48} color="#16A34A" style={{ marginBottom: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#16A34A', mb: 1 }}>
              All Fees Paid!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your hostel fees are fully paid. Thank you!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CreditCard size={20} />}
              onClick={onPayNow}
              sx={{
                backgroundColor: INDIGO,
                '&:hover': { backgroundColor: INDIGO_HOVER },
                px: 4, py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(79,70,229,0.3)',
              }}
            >
              Pay Now
            </Button>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}

// ─── Payment Amount Selection Drawer ───────────────────────────────────────────
function PaymentSelectionModal({ open, onClose, data, onContinue }) {
  const theme = useTheme();
  const [selectedOption, setSelectedOption] = useState('full');

  const fullAmount = data.pending;
  const halfAmount = Math.floor(data.totalFee * 0.5);
  
  // If already paid more than 50%, don't allow 50% option
  const allow50Percent = data.paid < halfAmount;

  const amountToPay = selectedOption === 'full' ? fullAmount : halfAmount;
  const remainingAfterPayment = data.pending - amountToPay;

  const handleContinue = () => {
    onContinue(amountToPay);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
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
      <Box sx={{
        position: 'relative',
        width: { xs: '90%', sm: '520px', md: '580px' },
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        outline: 'none',
        zIndex: 1401,
      }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Pay Hostel Fee
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose how much you want to pay
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Remaining Amount Display */}
          <Box sx={{
            p: 3, borderRadius: 2, mb: 3,
            backgroundColor: 'rgba(79,70,229,0.08)',
            border: `1px solid rgba(79,70,229,0.2)`,
            textAlign: 'center',
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Remaining Amount
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: INDIGO, fontSize: { xs: '32px', sm: '36px' } }}>
              ₹{fullAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>

          {/* Payment Options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {/* Full Payment Option */}
            <Box
              onClick={() => setSelectedOption('full')}
              sx={{
                p: 2.5, borderRadius: 2,
                border: `2px solid ${selectedOption === 'full' ? INDIGO : theme.palette.divider}`,
                backgroundColor: selectedOption === 'full' ? 'rgba(79,70,229,0.05)' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { 
                  borderColor: INDIGO,
                  backgroundColor: 'rgba(79,70,229,0.03)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Radio
                      checked={selectedOption === 'full'}
                      value="full"
                      sx={{
                        p: 0,
                        color: theme.palette.divider,
                        '&.Mui-checked': { color: INDIGO },
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Pay Full / Remaining Amount
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: INDIGO, ml: 4 }}>
                    ₹{fullAmount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 50% Payment Option */}
            {allow50Percent && (
              <Box
                onClick={() => setSelectedOption('half')}
                sx={{
                  p: 2.5, borderRadius: 2,
                  border: `2px solid ${selectedOption === 'half' ? INDIGO : theme.palette.divider}`,
                  backgroundColor: selectedOption === 'half' ? 'rgba(79,70,229,0.05)' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    borderColor: INDIGO,
                    backgroundColor: 'rgba(79,70,229,0.03)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Radio
                        checked={selectedOption === 'half'}
                        value="half"
                        sx={{
                          p: 0,
                          color: theme.palette.divider,
                          '&.Mui-checked': { color: INDIGO },
                        }}
                      />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Pay 50%
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: INDIGO, ml: 4 }}>
                      ₹{halfAmount.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Payment Summary */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Amount to Pay
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: INDIGO }}>
                ₹{amountToPay.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Remaining After Payment
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: remainingAfterPayment === 0 ? '#16A34A' : '#F59E0B' }}>
                ₹{remainingAfterPayment.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 3,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 2,
        }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              py: 1.5,
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.primary', backgroundColor: 'action.hover' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleContinue}
            sx={{
              py: 1.5,
              backgroundColor: INDIGO,
              '&:hover': { backgroundColor: INDIGO_HOVER },
              fontWeight: 600,
            }}
          >
            Continue to Payment
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── QR Payment Drawer ─────────────────────────────────────────────────────────
function QRPaymentModal({ open, onClose, onBack, amount }) {
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
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
      <Box sx={{
        position: 'relative',
        width: { xs: '90%', sm: '480px', md: '540px' },
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        outline: 'none',
        zIndex: 1401,
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          },
        },
        // Firefox scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: theme.palette.mode === 'light' 
          ? 'rgba(0, 0, 0, 0.2) transparent' 
          : 'rgba(255, 255, 255, 0.2) transparent',
      }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Scan & Pay
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your payment using UPI
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          {/* Amount Display */}
          <Box sx={{
            p: 3, borderRadius: 2, mb: 3,
            backgroundColor: 'rgba(79,70,229,0.08)',
            border: `1px solid rgba(79,70,229,0.2)`,
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Amount
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: INDIGO, fontSize: { xs: '32px', sm: '36px' } }}>
              ₹{amount.toLocaleString('en-IN')}
            </Typography>
          </Box>

          {/* QR Code Placeholder */}
          <Box sx={{
            width: { xs: 240, sm: 280 },
            height: { xs: 240, sm: 280 },
            margin: '0 auto',
            borderRadius: 3,
            border: `2px dashed ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            mb: 3,
            p: 2,
          }}>
            <Box sx={{
              width: { xs: 180, sm: 220 },
              height: { xs: 180, sm: 220 },
              backgroundColor: theme.palette.mode === 'light' ? '#E5E7EB' : 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                QR CODE
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
            Scan this QR code using your UPI app
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Google Pay, PhonePe, Paytm, or any UPI app
          </Typography>

          {/* Payment Status */}
          <Box sx={{
            p: 2.5, borderRadius: 2,
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: `1px solid rgba(245,158,11,0.2)`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: '#F59E0B',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#D97706' }}>
                Waiting for Payment
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Please complete the payment using your UPI app
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 3,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowLeft size={18} />}
            onClick={onBack}
            sx={{
              py: 1.5,
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.primary', backgroundColor: 'action.hover' },
            }}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              py: 1.5,
              borderColor: '#DC2626',
              color: '#DC2626',
              '&:hover': { 
                borderColor: '#B91C1C',
                backgroundColor: 'rgba(220,38,38,0.05)',
              },
            }}
          >
            Cancel Payment
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ─── Payment History Table ─────────────────────────────────────────────────────
function PaymentHistorySection({ history, onViewReceipt }) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paged = history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <SectionCard>
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <SectionHeaderBox>
          <IconWrapper><Receipt size={24} /></IconWrapper>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Payment History</Typography>
        </SectionHeaderBox>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">No payment history found.</Typography>
                  </TableCell>
                </TableRow>
              ) : paged.map((row, i) => (
                <TableRow key={row.receiptNo} hover
                  sx={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{row.receiptNo}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: INDIGO }}>
                    ₹{row.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>{row.paymentMode}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status}
                      size="small"
                      sx={{ 
                        fontWeight: 600, 
                        backgroundColor: row.status === 'Success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', 
                        color: row.status === 'Success' ? '#16A34A' : '#DC2626',
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => onViewReceipt(row)}
                      sx={{ color: 'text.secondary', '&:hover': { color: INDIGO, backgroundColor: 'rgba(79,70,229,0.1)' } }}>
                      <Eye size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {history.length > 10 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={history.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        )}
      </Box>
    </SectionCard>
  );
}

// ─── Receipt Details Drawer ────────────────────────────────────────────────────
function ReceiptDetailsDrawer({ open, onClose, receipt, studentData }) {
  const theme = useTheme();
  if (!receipt) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '500px' },
          maxWidth: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Payment Receipt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {receipt.receiptNo}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {/* Receipt Card */}
          <Box sx={{
            p: 3, borderRadius: 2, mb: 3,
            backgroundColor: 'background.default',
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ textAlign: 'center', mb: 3, pb: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <CheckCircle2 size={48} color="#16A34A" style={{ marginBottom: 12 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#16A34A', mb: 1 }}>
                Payment Successful
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thank you for your payment
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {[
                { label: 'Receipt Number', value: receipt.receiptNo },
                { label: 'Student Name', value: studentData.studentName },
                { label: 'Registration Number', value: studentData.registrationNo },
                { label: 'Fee Type', value: studentData.feeType },
                { label: 'Amount Paid', value: `₹${receipt.amount.toLocaleString('en-IN')}` },
                { label: 'Payment Date', value: receipt.date },
                { label: 'Payment Method', value: receipt.paymentMode },
                { label: 'Transaction ID', value: receipt.transactionId },
                { label: 'Payment Status', value: receipt.status },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'right' }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{
            p: 2.5, borderRadius: 2,
            backgroundColor: 'rgba(79,70,229,0.05)',
            border: `1px solid rgba(79,70,229,0.2)`,
            textAlign: 'center',
          }}>
            <Typography variant="caption" color="text.secondary">
              This is a computer-generated receipt and does not require a signature.
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 2,
        }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              py: 1.5,
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.primary' },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentFinancePage() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [paymentSelectionOpen, setPaymentSelectionOpen] = useState(false);
  const [qrPaymentOpen, setQRPaymentOpen] = useState(false);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!user || !user.studentId) {
      setLoading(false);
      setError('Student profile not associated with this account or not found.');
      return;
    }

    let active = true;
    const fetchStudentFinance = async () => {
      try {
        const res = await studentsApi.getById(user.studentId);
        if (active) {
          const s = res.data;
          setStudentData({
            studentName: `${s.firstName} ${s.lastName}`,
            registrationNo: s.registrationNumber,
            academicYear: '2026-27',
            feeType: 'Hostel Fee',
            totalFee: s.totalFees || 0,
            paid: s.initialDeposit || 0,
            pending: Math.max(0, (s.totalFees || 0) - (s.initialDeposit || 0)),
            dueDate: '30 Sep 2026',
            status: s.paymentStatus || 'Pending',
            paymentHistory: s.payments && s.payments.length > 0
              ? s.payments.map(p => ({
                  receiptNo: p.receiptNo,
                  date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                  amount: p.amount,
                  paymentMode: p.paymentMode,
                  status: p.status,
                  transactionId: p.transactionId || '—',
                }))
              : (s.initialDeposit > 0
                  ? [{
                      receiptNo: 'REC_INIT',
                      date: new Date(s.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                      amount: s.initialDeposit,
                      paymentMode: 'Deposit',
                      status: 'Success',
                      transactionId: 'INIT_DEP',
                    }]
                  : []
                ),
          });
        }
      } catch (err) {
        console.error('Failed to load student finance details:', err);
        if (active) {
          setError(err.message || 'Failed to load finance details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStudentFinance();
    return () => { active = false; };
  }, [user]);

  const handlePayNow = () => {
    setPaymentSelectionOpen(true);
  };

  const handleContinueToPayment = async (amount) => {
    setPaymentSelectionOpen(false);
    setLoading(true);
    try {
      const res = await studentsApi.createPaymentOrder(user.studentId, amount);
      const { orderId, key, currency } = res;

      const options = {
        key: key,
        amount: amount * 100,
        currency: currency,
        name: 'HostelSpace',
        description: 'Hostel Fee Payment',
        order_id: orderId,
        handler: async function (response) {
          setLoading(true);
          try {
            await studentsApi.verifyPayment(user.studentId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            });

            const updatedRes = await studentsApi.getById(user.studentId);
            const s = updatedRes.data;
            setStudentData({
              studentName: `${s.firstName} ${s.lastName}`,
              registrationNo: s.registrationNumber,
              academicYear: '2026-27',
              feeType: 'Hostel Fee',
              totalFee: s.totalFees || 0,
              paid: s.initialDeposit || 0,
              pending: Math.max(0, (s.totalFees || 0) - (s.initialDeposit || 0)),
              dueDate: '30 Sep 2026',
              status: s.paymentStatus || 'Pending',
              paymentHistory: s.payments && s.payments.length > 0
                ? s.payments.map(p => ({
                    receiptNo: p.receiptNo,
                    date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    amount: p.amount,
                    paymentMode: p.paymentMode,
                    status: p.status,
                    transactionId: p.transactionId || '—',
                  }))
                : (s.initialDeposit > 0
                    ? [{
                        receiptNo: 'REC_INIT',
                        date: new Date(s.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        amount: s.initialDeposit,
                        paymentMode: 'Deposit',
                        status: 'Success',
                        transactionId: 'INIT_DEP',
                      }]
                    : []
                  ),
            });

            alert('Payment successful and verified!');
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert('Payment succeeded but verification failed: ' + err.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: studentData.studentName,
          email: user.email,
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error('Failed to initiate payment:', err);
      alert('Failed to initiate payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setQRPaymentOpen(false);
    setPaymentSelectionOpen(true);
  };

  const handleClosePayment = () => {
    setQRPaymentOpen(false);
    setPaymentSelectionOpen(false);
    setSelectedAmount(0);
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptDrawerOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  if (error || !studentData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
          {error || 'Unable to load finance details.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My Finance</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          View and manage your hostel fee payments
        </Typography>
      </Box>

      {/* Summary Cards */}
      <FinanceSummaryCards data={studentData} />

      {/* Payment Due / Fully Paid Section */}
      <PaymentDueSection data={studentData} onPayNow={handlePayNow} />

      {/* Payment History */}
      <PaymentHistorySection history={studentData.paymentHistory} onViewReceipt={handleViewReceipt} />

      {/* Payment Selection Modal */}
      <PaymentSelectionModal
        open={paymentSelectionOpen}
        onClose={() => setPaymentSelectionOpen(false)}
        data={studentData}
        onContinue={handleContinueToPayment}
      />

      {/* QR Payment Modal */}
      <QRPaymentModal
        open={qrPaymentOpen}
        onClose={handleClosePayment}
        onBack={handleBackToSelection}
        amount={selectedAmount}
      />

      {/* Receipt Details Drawer */}
      <ReceiptDetailsDrawer
        open={receiptDrawerOpen}
        onClose={() => setReceiptDrawerOpen(false)}
        receipt={selectedReceipt}
        studentData={studentData}
      />
    </Box>
  );
}
