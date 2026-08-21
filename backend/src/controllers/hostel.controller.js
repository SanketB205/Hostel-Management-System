import { BedAllocation, Floor, HostelBlock, Room, Student, Staff, Complaint, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';

// ── helpers ─────────────────────────────────────────────────────────────────

const buildBlockTree = async (blocks) => {
  return Promise.all(blocks.map(async (block) => {
    const blockJson = block.toJSON();
    let totalRooms = 0, available = 0, occupied = 0, maintenance = 0;
    let totalCapacity = 0, totalBeds = 0;

    const floors = await Promise.all((blockJson.floors || []).map(async (floor) => {
      let fAvailable = 0, fOccupied = 0;

      const rooms = await Promise.all((floor.rooms || []).map(async (room) => {
        const bedsOccupied = await BedAllocation.count({ where: { roomId: room.id, status: 'active' } });
        totalCapacity += room.capacity;
        totalBeds += bedsOccupied;
        totalRooms++;

        // Derive live status from real-time bed count — never trust the stored value
        // (Maintenance is the only status set manually; everything else is computed)
        let liveStatus;
        if (room.status === 'Maintenance') {
          liveStatus = 'Maintenance';
          maintenance++;
        } else if (bedsOccupied === 0) {
          liveStatus = 'Available';
          available++; fAvailable++;
        } else if (bedsOccupied >= room.capacity) {
          liveStatus = 'Full';
          occupied++; fOccupied++;
        } else {
          liveStatus = 'Occupied';
          occupied++; fOccupied++;
        }

        return { ...room, bedsOccupied, status: liveStatus };
      }));

      // Natural sort: A101, A102, A103 … A110
      rooms.sort((a, b) =>
        String(a.number).localeCompare(String(b.number), undefined, { numeric: true, sensitivity: 'base' })
      );

      return {
        ...floor,
        name: `Floor ${floor.floorNumber}`,
        rooms,
        totalRooms: rooms.length,
        available: fAvailable,
        occupied: fOccupied,
      };
    }));

    const occupancyRate = totalCapacity > 0 ? Math.round((totalBeds / totalCapacity) * 100) : 0;
    return {
      ...blockJson,
      floors,
      totalRooms,
      available,
      occupied,
      maintenance,
      occupancyRate,
      totalFloors: floors.length,
      totalCapacity,
      totalBeds
    };
  }));
};

// ── blocks ───────────────────────────────────────────────────────────────────

export const listBlocks = asyncHandler(async (req, res) => {
  const withDetails = req.query.withDetails === 'true';

  const blocks = await HostelBlock.findAll({
    include: [{
      model: Floor, as: 'floors',
      include: [{
        model: Room, as: 'rooms',
        order: [['number', 'ASC']],
      }],
    }],
    order: [
      ['name', 'ASC'],
      [{ model: Floor, as: 'floors' }, 'floorNumber', 'ASC'],
      [{ model: Floor, as: 'floors' }, { model: Room, as: 'rooms' }, 'number', 'ASC'],
    ],
  });

  const data = await buildBlockTree(blocks);

  if (withDetails) {
    res.json({ data });
  } else {
    // Strip floors to keep response lightweight
    const summaryData = data.map(({ floors, ...rest }) => rest);
    res.json({ data: summaryData });
  }
});

export const getBlockDetails = asyncHandler(async (req, res) => {
  const block = await HostelBlock.findByPk(req.params.blockId, {
    include: [{
      model: Floor, as: 'floors',
      include: [{
        model: Room, as: 'rooms',
        order: [['number', 'ASC']],
      }],
    }],
    order: [
      [{ model: Floor, as: 'floors' }, 'floorNumber', 'ASC'],
      [{ model: Floor, as: 'floors' }, { model: Room, as: 'rooms' }, 'number', 'ASC'],
    ],
  });

  if (!block) return res.status(404).json({ message: 'Block not found.' });

  const [data] = await buildBlockTree([block]);
  res.json({ data });
});

export const createBlock = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: 'Block name is required.' });
  const block = await HostelBlock.create({ name: req.body.name });
  res.status(201).json({ data: block });
});

// ── floors ───────────────────────────────────────────────────────────────────

export const createFloor = asyncHandler(async (req, res) => {
  const { floorNumber } = req.body;
  if (!Number.isInteger(Number(floorNumber))) return res.status(400).json({ message: 'A valid floor number is required.' });
  const block = await HostelBlock.findByPk(req.params.blockId);
  if (!block) return res.status(404).json({ message: 'Block not found.' });
  const floor = await Floor.create({ blockId: block.id, floorNumber: Number(floorNumber) });
  res.status(201).json({ data: floor });
});

// ── rooms (single) ───────────────────────────────────────────────────────────

export const createRoom = asyncHandler(async (req, res) => {
  const { number, type, capacity, status, remarks } = req.body;
  if (!number?.trim() || !capacity) return res.status(400).json({ message: 'Room number and capacity are required.' });
  const floor = await Floor.findByPk(req.params.floorId);
  if (!floor) return res.status(404).json({ message: 'Floor not found.' });
  const room = await Room.create({ floorId: floor.id, number, type, capacity: Number(capacity), status, remarks });
  res.status(201).json({ data: room });
});

// ── rooms (bulk) ─────────────────────────────────────────────────────────────

export const bulkCreateRooms = asyncHandler(async (req, res) => {
  /**
   * Expects:
   * {
   *   blockName: "A",
   *   totalFloors: 3,
   *   roomsPerFloor: 5,
   *   startingRoomNumber: "101",
   *   roomNumberFormat: "Block + Floor + Room Number" | "Numeric Only",
   *   roomType: "Standard",
   *   capacity: 4,
   *   defaultStatus: "Available"
   * }
   */
  const { blockName, totalFloors, roomsPerFloor, startingRoomNumber, roomNumberFormat, roomType, capacity, defaultStatus } = req.body;
  if (!blockName || !totalFloors || !roomsPerFloor || !startingRoomNumber) {
    return res.status(400).json({ message: 'blockName, totalFloors, roomsPerFloor and startingRoomNumber are required.' });
  }

  const blockPrefix = String(blockName).replace(/^block\s*/i, '').trim().toUpperCase();
  const baseSuffix = parseInt(startingRoomNumber, 10) % 100;
  const report = { rooms: 0, skipped: [] };

  await sequelize.transaction(async (t) => {
    // find-or-create the block
    const [block] = await HostelBlock.findOrCreate({ where: { name: `BLOCK ${blockPrefix}` }, defaults: { name: `BLOCK ${blockPrefix}` }, transaction: t });

    for (let i = 1; i <= Number(totalFloors); i++) {
      const [floor] = await Floor.findOrCreate({ where: { blockId: block.id, floorNumber: i }, defaults: { blockId: block.id, floorNumber: i }, transaction: t });
      const floorBase = i * 100 + baseSuffix;

      for (let j = 0; j < Number(roomsPerFloor); j++) {
        const currentNum = floorBase + j;
        const roomNumber = roomNumberFormat === 'Block + Floor + Room Number'
          ? `${blockPrefix}${currentNum}`
          : `${currentNum}`;

        const existing = await Room.findOne({ where: { number: roomNumber }, transaction: t });
        if (existing) { report.skipped.push(roomNumber); continue; }

        await Room.create({ floorId: floor.id, number: roomNumber, type: roomType || 'Standard', capacity: Number(capacity) || 1, status: defaultStatus || 'Available' }, { transaction: t });
        report.rooms++;
      }
    }
  });

  res.status(201).json({ message: `Created ${report.rooms} rooms.`, data: report });
});

// ── list all rooms ────────────────────────────────────────────────────────────

export const listRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.findAll({
    include: [{
      model: Floor, as: 'floor',
      include: [{ model: HostelBlock, as: 'block' }],
    }],
    order: [['number', 'ASC']],
  });

  const data = await Promise.all(rooms.map(async (room) => ({
    ...room.toJSON(),
    bedsOccupied: await BedAllocation.count({ where: { roomId: room.id, status: 'active' } }),
  })));
  res.json({ data });
});

// ── students allocated to a room ─────────────────────────────────────────────

export const getRoomStudents = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found.' });

  const allocations = await BedAllocation.findAll({
    where: { roomId: room.id, status: 'active' },
    include: [{ model: Student, as: 'student' }],
  });

  const students = allocations.map(a => {
    const s = a.student;
    return {
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      regNo: s.registrationNumber,
      course: s.course,
      year: s.year,
      status: s.status,
      bedNumber: a.bedNumber,
    };
  });

  res.json({ data: students });
});

// ── delete room ──────────────────────────────────────────────────────────────

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByPk(req.params.roomId);
  if (!room) return res.status(404).json({ message: 'Room not found.' });

  // Check if room has active student allocations
  const activeAllocCount = await BedAllocation.count({
    where: { roomId: room.id, status: 'active' }
  });

  if (activeAllocCount > 0) {
    return res.status(400).json({ message: 'Cannot Delete Room. This room currently has students allocated. Transfer all students before deleting this room.' });
  }

  await sequelize.transaction(async (transaction) => {
    // Delete non-active allocations for this room
    await BedAllocation.destroy({ where: { roomId: room.id }, transaction });
    // Delete the room
    await room.destroy({ transaction });
  });

  res.json({ message: `Room ${room.number} deleted successfully.` });
});

// ── dashboard stats ──────────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Total counts
  const totalStudents = await Student.count({
    include: [{
      model: User,
      as: 'user',
      where: { role: 'student' }
    }]
  });
  const totalStaff = await Staff.count();
  const pendingComplaints = await Complaint.count({
    where: {
      status: { [Op.in]: ['Pending', 'In Progress'] }
    }
  });

  // 2. Room Status counts
  const rooms = await Room.findAll({
    include: [{
      model: BedAllocation,
      as: 'allocations',
      where: { status: 'active' },
      required: false
    }]
  });

  let occupiedRooms = 0;
  let availableRooms = 0;
  let maintenanceRooms = 0;

  rooms.forEach(r => {
    const bedsOccupied = r.allocations?.length || 0;
    if (r.status === 'Maintenance') {
      maintenanceRooms++;
    } else if (bedsOccupied === 0) {
      availableRooms++;
    } else {
      occupiedRooms++;
    }
  });

  // 3. Monthly revenue calculation based on active bed allocations
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let m = 0; m < 12; m++) {
    const startOfMonth = new Date(currentYear, m, 1);
    const endOfMonth = new Date(currentYear, m + 1, 0); // last day of month
    
    const startStr = startOfMonth.toISOString().slice(0, 10);
    const endStr = endOfMonth.toISOString().slice(0, 10);

    const activeCount = await BedAllocation.count({
      where: {
        allocatedAt: { [Op.lte]: endStr },
        [Op.or]: [
          { vacatedAt: null },
          { vacatedAt: { [Op.gte]: startStr } }
        ]
      }
    });

    monthlyRevenue.push({
      name: monthNames[m],
      value: activeCount * 2000 // Each active allocation pays 2000 per month
    });
  }

  res.json({
    data: {
      stats: {
        totalStudents,
        totalStaff,
        pendingComplaints,
        occupiedRooms,
        availableRooms,
        maintenanceRooms
      },
      roomStatusChart: [
        { name: 'Occupied', value: occupiedRooms, color: '#F59E0B' },
        { name: 'Available', value: availableRooms, color: '#22C55E' },
        { name: 'Maintenance', value: maintenanceRooms, color: '#EF4444' }
      ],
      revenueChart: monthlyRevenue
    }
  });
});
