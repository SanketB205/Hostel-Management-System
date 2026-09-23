import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Card, Divider, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useRoomContext } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { hostel } from '../api';

import RoomStats from '../components/rooms/RoomStats';
import RoomFilters from '../components/rooms/RoomFilters';
import BlockCard from '../components/rooms/BlockCard';
import AddRoomDrawer from '../components/rooms/AddRoomDrawer';
import BulkRoomDrawer from '../components/rooms/BulkRoomDrawer';

export default function RoomsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { blocks, loading, error, fetchBlocks, fetchBlockDetails } = useRoomContext();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState({
    search: '',
    block: 'All Blocks',
    floor: 'All Floors',
    roomType: 'All Types',
    status: 'All Status',
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Show success message from navigation state (e.g., after block deletion)
  useEffect(() => {
    if (location.state?.successMessage) {
      setSnackbar({
        open: true,
        message: location.state.successMessage,
        severity: 'success'
      });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleResetFilters = () =>
    setFilters({ search: '', block: 'All Blocks', floor: 'All Floors', roomType: 'All Types', status: 'All Status' });

  // ── Save single room via API ────────────────────────────────────────────────
  const handleSaveRoom = async (roomData) => {
    try {
      const blockName = roomData.block.toUpperCase().includes('BLOCK')
        ? roomData.block.toUpperCase()
        : `BLOCK ${roomData.block.toUpperCase()}`;

      let block = blocks.find(b => b.name === blockName);
      if (!block) {
        const res = await hostel.createBlock(blockName);
        block = res.data;
      }

      const floorNumber = Number(roomData.floorNumber);
      let floor = (block.floors || []).find(f => f.floorNumber === floorNumber);
      if (!floor) {
        const res = await hostel.createFloor(block.id, floorNumber);
        floor = res.data;
      }

      const blockPrefix = blockName.replace('BLOCK', '').trim();
      let inputRoom = roomData.roomNumber.trim().toUpperCase();
      if (inputRoom.startsWith(blockPrefix)) inputRoom = inputRoom.substring(blockPrefix.length).trim();
      if (/^\d{1,2}$/.test(inputRoom)) inputRoom = `${floorNumber}${inputRoom.padStart(2, '0')}`;
      const formattedNumber = `${blockPrefix}${inputRoom}`.toUpperCase();

      await hostel.createRoom(floor.id, {
        number: formattedNumber,
        type: roomData.roomType,
        capacity: Number(roomData.capacity),
        status: roomData.status,
        remarks: roomData.remarks,
      });

      await fetchBlocks();
      if (block && block.id) {
        await fetchBlockDetails(block.id);
      }
      setFilters(f => ({ ...f, block: blockName, floor: `Floor ${floorNumber}` }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // ── Save bulk rooms via API ─────────────────────────────────────────────────
  const handleSaveBulkRooms = async (bulkData) => {
    try {
      const res = await hostel.bulkCreateRooms({
        blockName: bulkData.blockName,
        totalFloors: bulkData.totalFloors,
        roomsPerFloor: bulkData.roomsPerFloor,
        startingRoomNumber: bulkData.startingRoomNumber,
        roomNumberFormat: bulkData.roomNumberFormat,
        roomType: bulkData.roomType,
        capacity: bulkData.capacity,
        defaultStatus: bulkData.defaultStatus,
      });

      await fetchBlocks();
      const existingBlock = blocks.find(b => b.name === `BLOCK ${bulkData.blockName.toUpperCase()}`);
      if (existingBlock) {
        await fetchBlockDetails(existingBlock.id);
      }
      setIsBulkDrawerOpen(false);

      if (res?.data?.skipped?.length) {
        return {
          success: false,
          message: `${res.data.rooms} rooms created. Skipped existing: ${res.data.skipped.slice(0, 5).join(', ')}${res.data.skipped.length > 5 ? '...' : ''}`,
        };
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // ── Client-side filter ──────────────────────────────────────────────────────
  const filteredBlocks = useMemo(() => {
    return blocks.map(block => {
      if (filters.block !== 'All Blocks' && block.name.toLowerCase() !== filters.block.toLowerCase()) return null;

      const hasFloorsLoaded = block.floors && block.floors.length > 0;
      if (!hasFloorsLoaded) {
        return block;
      }

      const filteredFloors = block.floors.map(floor => {
        if (filters.floor !== 'All Floors' && floor.name !== filters.floor) return null;

        const filteredRooms = (floor.rooms || []).filter(room => {
          const matchesSearch = room.number.toLowerCase().includes(filters.search.toLowerCase());
          const matchesType = filters.roomType === 'All Types' || room.type === filters.roomType;
          const matchesStatus = filters.status === 'All Status' || room.status === filters.status;
          return matchesSearch && matchesType && matchesStatus;
        });

        if (filteredRooms.length === 0) return null;

        let fAvailable = 0, fOccupied = 0;
        filteredRooms.forEach(r => {
          if (r.status === 'Available') fAvailable++;
          else if (['Occupied', 'Full', 'Reserved'].includes(r.status)) fOccupied++;
        });

        return { ...floor, rooms: filteredRooms, totalRooms: filteredRooms.length, available: fAvailable, occupied: fOccupied };
      }).filter(Boolean);

      if (filteredFloors.length === 0) return null;

      let bAvailable = 0, bOccupied = 0, bMaintenance = 0, totalCapacity = 0, totalBedsOccupied = 0, bTotalRooms = 0;
      filteredFloors.forEach(floor => {
        bTotalRooms += floor.totalRooms;
        bAvailable += floor.available;
        bOccupied += floor.occupied;
        floor.rooms.forEach(r => {
          if (r.status === 'Maintenance') bMaintenance++;
          totalCapacity += r.capacity;
          totalBedsOccupied += r.bedsOccupied || 0;
        });
      });

      return {
        ...block,
        floors: filteredFloors,
        totalRooms: bTotalRooms,
        available: bAvailable,
        occupied: bOccupied,
        maintenance: bMaintenance,
        occupancyRate: totalCapacity > 0 ? Math.round((totalBedsOccupied / totalCapacity) * 100) : 0,
      };
    }).filter(Boolean);
  }, [blocks, filters]);

  const quickStats = useMemo(() => {
    let tFloors = 0, tBeds = 0, oBeds = 0;
    filteredBlocks.forEach(block => {
      tFloors += block.totalFloors || 0;
      tBeds += block.totalCapacity || 0;
      oBeds += block.totalBeds || 0;
    });
    return { blocks: filteredBlocks.length, floors: tFloors, beds: tBeds, occupied: oBeds, available: tBeds - oBeds };
  }, [filteredBlocks]);

  const LEGEND = [
    { color: '#22C55E', label: 'Available', desc: 'No students' },
    { color: '#F59E0B', label: 'Occupied', desc: 'Partially filled' },
    { color: '#EF4444', label: 'Full', desc: 'No beds available' },
    { color: '#F97316', label: 'Maintenance', desc: 'Under repair' },
    { color: '#3B82F6', label: 'Reserved', desc: 'Allocated' },
  ];

  const STATS = [
    { label: 'Total Blocks', value: quickStats.blocks },
    { label: 'Total Floors', value: quickStats.floors },
    { label: 'Total Beds', value: quickStats.beds },
    { label: 'Occupied Beds', value: quickStats.occupied, color: '#EF4444' },
    { label: 'Available Beds', value: quickStats.available, color: '#22C55E' },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Rooms Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error} — Check that the backend server is running.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
      ) : (
        <>
          <RoomStats blocks={filteredBlocks} />

          <RoomFilters
            filters={filters}
            setFilters={setFilters}
            onReset={handleResetFilters}
            onAddClick={() => setIsDrawerOpen(true)}
            onBulkAddClick={() => setIsBulkDrawerOpen(true)}
            blocks={blocks}
            isAdmin={isAdmin}
          />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, gap: 3 }}>
            {/* Blocks grid */}
            <Box sx={{ flexGrow: 1 }}>
              {filteredBlocks.length > 0 ? (
                filteredBlocks.map(block => <BlockCard key={block.name} block={block} />)
              ) : (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                  <Typography variant="h6" color="text.secondary">No rooms match your search filters.</Typography>
                </Card>
              )}
            </Box>

            {/* Right sidebar */}
            <Box sx={{ 
              width: { xs: '100%', xl: '280px' }, 
              flexShrink: 0,
              position: { xl: 'sticky' },
              top: { xl: '96px' },
              alignSelf: 'flex-start'
            }}>
              {/* Legend */}
              <Card sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Room Status Legend</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {LEGEND.map(({ color, label, desc }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong>{label}:</strong> {desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>

              {/* Quick stats */}
              <Card sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Quick Statistics</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {STATS.map(({ label, value, color }, i) => (
                    <React.Fragment key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: color || 'text.primary' }}>{value}</Typography>
                      </Box>
                      {i < STATS.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Box>
              </Card>
            </Box>
          </Box>
        </>
      )}

      {isAdmin && (
        <>
          <AddRoomDrawer
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSave={handleSaveRoom}
          />
          <BulkRoomDrawer
            open={isBulkDrawerOpen}
            onClose={() => setIsBulkDrawerOpen(false)}
            onSave={handleSaveBulkRooms}
          />
        </>
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ width: '100%' }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
