import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { hostel } from '../api';

const RoomContext = createContext();

export const useRoomContext = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlocks = useCallback(async (withDetails = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await hostel.listBlocks(withDetails);
      setBlocks(res.data || []);
    } catch (err) {
      console.error('Failed to load blocks:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlockDetails = useCallback(async (blockId) => {
    try {
      const res = await hostel.getBlockDetails(blockId);
      const updatedBlock = res.data;
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updatedBlock } : b));
      return updatedBlock;
    } catch (err) {
      console.error('Failed to load block details:', err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBlocks(false);
  }, [fetchBlocks]);

  /**
   * Returns students currently allocated to a room.
   * roomId is the database UUID of the room.
   */
  const getStudentsForRoom = useCallback(async (roomId) => {
    try {
      const res = await hostel.getRoomStudents(roomId);
      return res.data || [];
    } catch (err) {
      console.error('Failed to load room students:', err.message);
      return [];
    }
  }, []);

  return (
    <RoomContext.Provider value={{ blocks, loading, error, setBlocks, fetchBlocks, fetchBlockDetails, getStudentsForRoom }}>
      {children}
    </RoomContext.Provider>
  );
};
