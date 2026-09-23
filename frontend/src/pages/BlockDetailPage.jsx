import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Alert
} from '@mui/material';
import { ArrowLeft, Building, Trash2 } from 'lucide-react';
import FloorSummary from '../components/rooms/FloorSummary';
import RoomCard from '../components/rooms/RoomCard';
import { useRoomContext } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { hostel } from '../api';

export default function BlockDetailPage() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { blocks, fetchBlockDetails, fetchBlocks, loading, getStudentsForRoom } = useRoomContext();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [blockStudents, setBlockStudents] = useState([]);

  // Find the block by ID (blockId can be UUID string or number)
  const block = blocks.find(b => String(b.id) === String(blockId));

  // Debug logging
  useEffect(() => {
    console.log('BlockDetailPage - blockId from URL:', blockId);
    console.log('BlockDetailPage - blocks:', blocks);
    console.log('BlockDetailPage - found block:', block);
  }, [blockId, blocks, block]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    // Load block details if not already loaded
    const loadDetails = async () => {
      if (block && (!block.floors || block.floors.length === 0)) {
        setLoadingDetails(true);
        setError(null);
        try {
          await fetchBlockDetails(block.id);
        } catch (err) {
          console.error(err);
          setError('Failed to load block details. Please try again.');
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    loadDetails();
  }, [block?.id, fetchBlockDetails]);

  useEffect(() => {
    if (block?.floors && selectedFloorIndex >= block.floors.length) {
      setSelectedFloorIndex(0);
    }
  }, [block?.floors?.length, selectedFloorIndex]);

  const handleTabChange = (event, newValue) => {
    setSelectedFloorIndex(newValue);
  };

  const handleBackToBlocks = () => {
    navigate('/rooms');
  };

  const handleDeleteBlock = async () => {
    // Check if block has any occupied rooms
    if (block.occupied > 0) {
      // Load all students in this block
      const students = [];
      for (const floor of block.floors || []) {
        for (const room of floor.rooms || []) {
          if (room.status === 'Occupied' || room.status === 'Full') {
            try {
              const roomStudents = await getStudentsForRoom(room.id);
              roomStudents.forEach(student => {
                students.push({
                  ...student,
                  roomNumber: room.number
                });
              });
            } catch (err) {
              console.error('Failed to load students for room', room.number, err);
            }
          }
        }
      }
      setBlockStudents(students);
      setDeleteWarningOpen(true);
    } else {
      // Block is empty, allow deletion
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteBlock = async () => {
    try {
      const blockName = block.name;
      await hostel.deleteBlock(block.id);
      setDeleteConfirmOpen(false);
      // Refresh blocks data to remove the deleted block from cache
      await fetchBlocks(true);
      // Navigate back to rooms page with success message
      navigate('/rooms', { 
        state: { 
          successMessage: `${blockName} deleted successfully.` 
        } 
      });
    } catch (err) {
      console.error('Failed to delete block:', err);
      setError(err.message || 'Failed to delete block.');
      setDeleteConfirmOpen(false);
    }
  };

  // Loading state
  if (loading || loadingDetails) {
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
      </Box>
    );
  }

  // Block not found
  if (!block) {
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Block not found
        </Alert>
        <Button 
          startIcon={<ArrowLeft size={20} />}
          onClick={handleBackToBlocks}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Back to Blocks
        </Button>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowLeft size={20} />}
          onClick={handleBackToBlocks}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Back to Blocks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Breadcrumb Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          startIcon={<ArrowLeft size={20} />}
          onClick={handleBackToBlocks}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            color: '#6366F1',
            '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' }
          }}
        >
          Back to Blocks
        </Button>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Rooms → {block.name}
        </Typography>
      </Box>

      {/* Block Header Card */}
      <Card sx={{ mb: 4, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 2, 
                  backgroundColor: '#6366F1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building size={24} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{block.name}</Typography>
            </Box>

            {/* Delete Button - Only for Admin */}
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={handleDeleteBlock}
                sx={{
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  '&:hover': {
                    borderColor: '#B91C1C',
                    backgroundColor: 'rgba(220, 38, 38, 0.04)',
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                }}
              >
                Delete Block
              </Button>
            )}
          </Box>

          {/* Statistics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Rooms</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{block.totalRooms}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Available</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#22C55E' }}>{block.available}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Occupied</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B' }}>{block.occupied}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Maintenance</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B' }}>{block.maintenance}</Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Floor Summary and Block Details */}
      {block.floors && block.floors.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, gap: 3 }}>
          {/* Left Column: Static Floor Summary */}
          <Box sx={{ 
            width: { xs: '100%', xl: '300px' }, 
            flexShrink: 0,
            position: { xl: 'sticky' },
            top: { xl: '96px' },
            alignSelf: 'flex-start'
          }}>
            <FloorSummary block={block} />
          </Box>

          {/* Right Column: Floor Rooms Grid with Tabs */}
          <Box sx={{ flexGrow: 1 }}>
            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <Box sx={{ p: 3 }}>
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
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                          gap: 2
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
            </Card>
          </Box>
        </Box>
      ) : (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="h6" color="text.secondary">No floor details available for this block.</Typography>
        </Card>
      )}

      {/* Delete Confirmation Modal - UI Only */}
      {deleteConfirmOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '90%', sm: '450px' },
              maxWidth: '95vw',
              backgroundColor: 'background.paper',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              outline: 'none',
              zIndex: 1401,
              p: 3,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Delete {block.name}?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Are you sure you want to delete <strong>{block.name}</strong>? This action cannot be undone.
              All floors and rooms in this block will be permanently removed.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="text"
                onClick={() => setDeleteConfirmOpen(false)}
                sx={{ 
                  color: 'text.secondary', 
                  textTransform: 'none', 
                  fontWeight: 600 
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={confirmDeleteBlock}
                sx={{
                  backgroundColor: '#DC2626',
                  '&:hover': { backgroundColor: '#B91C1C' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Delete Block
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Cannot Delete Block Warning Modal */}
      {deleteWarningOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setDeleteWarningOpen(false)}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '90%', sm: '600px' },
              maxWidth: '95vw',
              maxHeight: '85vh',
              backgroundColor: 'background.paper',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              outline: 'none',
              zIndex: 1401,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: '#EF4444'
              }}>
                <Trash2 size={20} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Cannot Delete {block.name}
              </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ px: 3, pb: 3, overflowY: 'auto', flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                This block currently has <strong>{block.occupied} occupied rooms</strong> with students allocated. 
                Transfer all students before deleting this block.
              </Typography>

              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>Total Students:</strong> {blockStudents.length} student{blockStudents.length !== 1 ? 's' : ''} need to be transferred
              </Alert>

              {blockStudents.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {blockStudents.map((student, index) => (
                    <Box 
                      key={`${student.id}-${index}`} 
                      sx={{
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0,0,0,0.01)'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {student.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Reg No: {student.regNo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Current Room: {student.roomNumber}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          setDeleteWarningOpen(false);
                          navigate(`/students/edit/${student.id}?focus=hostel`);
                        }}
                        sx={{
                          backgroundColor: '#4F46E5',
                          '&:hover': { backgroundColor: '#4338CA' },
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: '6px',
                          px: 2
                        }}
                      >
                        Transfer
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                fullWidth
                onClick={() => setDeleteWarningOpen(false)} 
                sx={{ 
                  color: 'text.secondary', 
                  textTransform: 'none', 
                  fontWeight: 600 
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
