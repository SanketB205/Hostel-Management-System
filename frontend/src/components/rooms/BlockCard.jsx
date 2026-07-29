import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  IconButton, 
  Collapse,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { ChevronDown, ChevronUp, Building } from 'lucide-react';
import FloorSummary from './FloorSummary';
import RoomCard from './RoomCard';
import { useRoomContext } from '../../contexts/RoomContext';

export default function BlockCard({ block }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const { fetchBlockDetails } = useRoomContext();

  useEffect(() => {
    if (block.floors && selectedFloorIndex >= block.floors.length) {
      setSelectedFloorIndex(0);
    }
  }, [block.floors?.length, selectedFloorIndex]);

  const handleTabChange = (event, newValue) => {
    setSelectedFloorIndex(newValue);
  };

  const handleToggleExpand = async () => {
    if (!expanded) {
      if (!block.floors || block.floors.length === 0) {
        setLoadingDetails(true);
        try {
          await fetchBlockDetails(block.id);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingDetails(false);
        }
      }
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  return (
    <Card sx={{ mb: 4, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: (expanded && block.floors && block.floors.length > 0) ? '1px solid' : 'none',
          borderColor: 'divider',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
        }}
        onClick={handleToggleExpand}
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

        <IconButton size="small">
          {(expanded || loadingDetails) ? <ChevronUp /> : <ChevronDown />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded || loadingDetails} timeout="auto" unmountOnExit>
        {loadingDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
            <CircularProgress size={36} sx={{ color: '#6366F1' }} />
          </Box>
        ) : (
          block.floors && block.floors.length > 0 && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              {/* Left Column: Floor Summary */}
              <Box sx={{ width: { xs: '100%', lg: '300px' }, flexShrink: 0 }}>
                <FloorSummary block={block} />
              </Box>

              {/* Right Column: Floor Rooms Grid with Tabs */}
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs 
                    value={selectedFloorIndex} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem', color: 'text.secondary' },
                      '& .Mui-selected': { color: '#6366F1' },
                      '& .MuiTabs-indicator': { backgroundColor: '#6366F1' }
                    }}
                  >
                    {block.floors.map((floor, index) => (
                      <Tab key={floor.name} label={floor.name} />
                    ))}
                  </Tabs>
                </Box>

                {block.floors.map((floor, index) => (
                  <Box 
                    key={floor.name} 
                    role="tabpanel"
                    hidden={selectedFloorIndex !== index}
                  >
                    {selectedFloorIndex === index && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                              {floor.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1 }}>
                              <span style={{ color: '#22C55E', fontWeight: 500 }}>Available: {floor.available}</span> | 
                              <span style={{ color: '#F59E0B', fontWeight: 500 }}>Occupied: {floor.occupied}</span>
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {floor.totalRooms} Rooms
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: 2,
                          maxHeight: '460px',
                          overflowY: 'auto',
                          pr: 1,
                          '&::-webkit-scrollbar': { width: '6px' },
                          '&::-webkit-scrollbar-track': { background: 'transparent' },
                          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
                          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' }
                        }}>
                          {floor.rooms.map((room) => (
                            <RoomCard key={room.number} room={room} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )
        )}
      </Collapse>
    </Card>
  );
}
