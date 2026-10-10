import React from 'react';
import { Card, Box, Typography, Button, LinearProgress, Chip } from '@mui/material';
import { IndianRupee, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INDIGO = '#4F46E5';
const INDIGO_HOVER = '#4338CA';

export default function StudentFinanceSummary({ financeStats, onPayNow }) {
  const navigate = useNavigate();

  const {
    totalBillable = 0,
    totalPaid = 0,
    balanceDue = 0,
    paymentStatus = 'Pending',
  } = financeStats || {};

  const isPaid = paymentStatus === 'Paid' || balanceDue === 0;
  const isPartial = paymentStatus === 'Partial';
  const percentagePaid = totalBillable > 0 ? Math.min(Math.round((totalPaid / totalBillable) * 100), 100) : 0;

  const statusColor = isPaid ? '#16A34A' : isPartial ? '#D97706' : '#DC2626';
  const statusBg = isPaid ? 'rgba(22, 163, 74, 0.1)' : isPartial ? 'rgba(245, 158, 11, 0.1)' : 'rgba(220, 38, 38, 0.1)';

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: INDIGO,
            }}
          >
            <IndianRupee size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Finance Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hostel fee payments & ledger
            </Typography>
          </Box>
        </Box>
        <Chip
          label={isPaid ? 'Paid in Full' : paymentStatus}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: statusBg,
            color: statusColor,
          }}
        />
      </Box>

      {/* Main Metric Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Total Billable */}
        <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
            Total Billable
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {formatINR(totalBillable)}
          </Typography>
        </Box>

        {/* Total Paid */}
        <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
            Total Paid
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: '#16A34A', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {formatINR(totalPaid)}
          </Typography>
        </Box>

        {/* Balance Due */}
        <Box sx={{ p: 2, borderRadius: 2.5, backgroundColor: isPaid ? 'rgba(22, 163, 74, 0.05)' : 'rgba(220, 38, 38, 0.05)', border: isPaid ? '1px solid rgba(22, 163, 74, 0.15)' : '1px solid rgba(220, 38, 38, 0.15)', gridColumn: { xs: 'span 2', sm: 'auto' } }}>
          <Typography variant="caption" sx={{ color: isPaid ? '#16A34A' : '#DC2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
            Balance Due
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: isPaid ? '#16A34A' : '#DC2626', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {formatINR(balanceDue)}
          </Typography>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Payment Completed
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: INDIGO }}>
            {percentagePaid}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentagePaid}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: isPaid ? '#16A34A' : INDIGO,
            },
          }}
        />
      </Box>

      {/* Actions */}
      <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pt: 1 }}>
        <Button
          size="small"
          onClick={() => navigate('/finances')}
          endIcon={<ArrowRight size={16} />}
          sx={{
            color: INDIGO,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.08)' },
          }}
        >
          View Full Ledger
        </Button>

        {isPaid ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#16A34A' }}>
            <CheckCircle2 size={18} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
              Paid in Full
            </Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            onClick={onPayNow}
            startIcon={<CreditCard size={18} />}
            sx={{
              backgroundColor: INDIGO,
              '&:hover': { backgroundColor: INDIGO_HOVER },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2.5,
            }}
          >
            Pay Now
          </Button>
        )}
      </Box>
    </Card>
  );
}
