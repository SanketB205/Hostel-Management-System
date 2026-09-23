import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  Typography, 
  IconButton,
  LinearProgress
} from '@mui/material';
import { ChevronRight, Building } from 'lucide-react';

export default function BlockCard({ block }) {
  const navigate = useNavigate();

  const handleViewBlock = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/rooms/block/${block.id}`);
  };

  return (
    <Card 
      sx={{ 
        mb: 3, 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': { 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={handleViewBlock}
    >
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box 
            sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: 2, 
              backgroundColor: '#6366F1',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{block.name}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, display: { xs: 'none', md: 'flex' } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Rooms</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{block.totalRooms}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Available</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#22C55E' }}>{block.available}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Occupied</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F59E0B' }}>{block.occupied}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Maintenance</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F59E0B' }}>{block.maintenance}</Typography>
          </Box>

          <Box sx={{ width: 150, ml: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Occupancy Rate</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{block.occupancyRate}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={block.occupancyRate} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.05)',
                '& .MuiLinearProgress-bar': { backgroundColor: '#6366F1', borderRadius: 3 }
              }}
            />
          </Box>
        </Box>

        <IconButton 
          size="small"
          sx={{ 
            color: '#6366F1',
            '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' }
          }}
        >
          <ChevronRight />
        </IconButton>
      </Box>
    </Card>
  );
}
