import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import { IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentFinanceCard({ financeStats }) {
  const navigate = useNavigate();

  const {
    totalBillable = 0,
    totalPaid = 0,
    balanceDue = 0,
    paymentStatus = 'Pending',
  } = financeStats || {};

  const isPaid = paymentStatus === 'Paid';
  const isPartial = paymentStatus === 'Partial';
  const statusColor = isPaid ? '#16A34A' : isPartial ? '#D97706' : '#DC2626';
  const statusBg = isPaid ? 'rgba(22, 163, 74, 0.1)' : isPartial ? 'rgba(245, 158, 11, 0.1)' : 'rgba(220, 38, 38, 0.1)';

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <Card
      onClick={() => navigate('/finances')}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706',
          }}
        >
          <IndianRupee size={22} />
        </Box>
        <Chip
          label={paymentStatus}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            backgroundColor: statusBg,
            color: statusColor,
          }}
        />
      </Box>

      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
        MY FINANCE
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.4rem' } }}>
        {formatINR(totalBillable)} Total
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {formatINR(totalPaid)} Paid • {formatINR(balanceDue)} Due
      </Typography>
    </Card>
  );
}
