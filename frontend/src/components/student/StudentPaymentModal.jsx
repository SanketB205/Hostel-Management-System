import React, { useState } from 'react';
import {
  Modal,
  Backdrop,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { students as studentsApi } from '../../api';

const INDIGO = '#4F46E5';
const INDIGO_HOVER = '#4338CA';

export default function StudentPaymentModal({
  open,
  onClose,
  studentId,
  studentName = 'Student',
  userEmail = '',
  balanceDue = 0,
  onPaymentSuccess,
}) {
  const theme = useTheme();
  const [customAmount, setCustomAmount] = useState(balanceDue ? String(balanceDue) : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setCustomAmount(balanceDue > 0 ? String(balanceDue) : '');
      setError('');
      setLoading(false);
    }
  }, [open, balanceDue]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Allow numbers and decimal points only
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setCustomAmount(val);
      setError('');
    }
  };

  const handlePay = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (amount > balanceDue) {
      setError(`Amount cannot exceed balance due of ₹${balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    if (!window.Razorpay) {
      setError('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create payment order via existing API
      const res = await studentsApi.createPaymentOrder(studentId, amount);
      const { orderId, key, currency } = res;

      // 2. Open standard Razorpay Checkout
      const options = {
        key,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'HostelSpace',
        description: 'Hostel Fee Payment',
        order_id: orderId,
        handler: async function (response) {
          setLoading(true);
          try {
            // 3. Verify payment via existing backend API
            const verifyRes = await studentsApi.verifyPayment(studentId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            });

            const msg = verifyRes.data?.alreadyProcessed
              ? 'Payment was already processed successfully!'
              : 'Payment successful and verified!';
            alert(msg);
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            onClose();
          } catch (err) {
            console.error('Payment verification failed:', err);
            setError('Payment succeeded with Razorpay but verification failed: ' + err.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: studentName,
          email: userEmail,
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError('Payment failed: ' + (response.error?.description || 'Transaction declined'));
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Failed to initiate payment:', err);
      setError(err.message || 'Failed to initiate payment order.');
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1400,
          },
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '92%', sm: '500px' },
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          outline: 'none',
          p: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: 'rgba(79,70,229,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: INDIGO,
              }}
            >
              <CreditCard size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Pay Hostel Fee
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter amount to pay via Razorpay
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={loading}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Balance Due Display */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              mb: 3,
              backgroundColor: 'rgba(79,70,229,0.08)',
              border: `1px solid rgba(79,70,229,0.2)`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Outstanding Balance Due
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: INDIGO, fontSize: { xs: '2rem', sm: '2.4rem' } }}>
              ₹{Number(balanceDue).toLocaleString('en-IN')}
            </Typography>
          </Box>

          {/* Amount Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Amount to Pay (INR)
            </Typography>
            <TextField
              fullWidth
              value={customAmount}
              onChange={handleAmountChange}
              disabled={loading}
              placeholder="Enter amount"
              InputProps={{
                startAdornment: (
                  <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 700 }}>
                    ₹
                  </Typography>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  borderRadius: 2.5,
                  '&.Mui-focused fieldset': {
                    borderColor: INDIGO,
                  },
                },
              }}
            />
          </Box>

          {/* Quick Amount Suggestions */}
          {balanceDue > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                Quick Select
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { label: '25%', amount: Math.round(balanceDue * 0.25) },
                  { label: '50%', amount: Math.round(balanceDue * 0.5) },
                  { label: '75%', amount: Math.round(balanceDue * 0.75) },
                  { label: 'Full Due', amount: balanceDue },
                ].map((item, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    onClick={() => setCustomAmount(String(item.amount))}
                    sx={{
                      borderColor: theme.palette.divider,
                      color: 'text.primary',
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: INDIGO,
                        backgroundColor: 'rgba(79,70,229,0.05)',
                      },
                    }}
                  >
                    {item.label} (₹{item.amount.toLocaleString('en-IN')})
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            disabled={loading}
            onClick={onClose}
            sx={{
              py: 1.25,
              borderRadius: 2.5,
              borderColor: theme.palette.divider,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={loading || !customAmount || parseFloat(customAmount) <= 0}
            onClick={handlePay}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CreditCard size={18} />}
            sx={{
              py: 1.25,
              borderRadius: 2.5,
              backgroundColor: INDIGO,
              '&:hover': { backgroundColor: INDIGO_HOVER },
              fontWeight: 600,
            }}
          >
            {loading ? 'Processing...' : 'Proceed to Pay'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
