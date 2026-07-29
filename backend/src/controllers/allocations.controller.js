import { sequelize } from '../config/database.js';
import { BedAllocation, Room, Student } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const updateRoomStatus = async (room, transaction) => {
  if (room.status === 'Maintenance') return;
  const occupiedBeds = await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction });
  const status = occupiedBeds >= room.capacity ? 'Full' : occupiedBeds > 0 ? 'Occupied' : 'Available';
  await room.update({ status }, { transaction });
};

export const allocateBed = asyncHandler(async (req, res) => {
  const { studentId, roomId, bedNumber, allocatedAt } = req.body;
  if (!studentId || !roomId || !bedNumber) return res.status(400).json({ message: 'Student, room, and bed number are required.' });

  const allocation = await sequelize.transaction(async (transaction) => {
    const [student, room] = await Promise.all([
      Student.findByPk(studentId, { transaction, lock: transaction.LOCK.UPDATE }),
      Room.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE }),
    ]);
    if (!student) throw Object.assign(new Error('Student not found.'), { status: 404 });
    if (!room) throw Object.assign(new Error('Room not found.'), { status: 404 });
    if (room.status === 'Maintenance') throw Object.assign(new Error('Maintenance rooms cannot receive allocations.'), { status: 409 });

    const activeStudentAllocation = await BedAllocation.findOne({ where: { studentId, status: 'active' }, transaction, lock: transaction.LOCK.UPDATE });
    if (activeStudentAllocation) throw Object.assign(new Error('Student already has an active room allocation.'), { status: 409 });

    const occupiedBeds = await BedAllocation.count({ where: { roomId, status: 'active' }, transaction });
    if (occupiedBeds >= room.capacity) throw Object.assign(new Error('Room is already full.'), { status: 409 });

    const occupiedBed = await BedAllocation.findOne({ where: { roomId, bedNumber, status: 'active' }, transaction, lock: transaction.LOCK.UPDATE });
    if (occupiedBed) throw Object.assign(new Error('This bed is already allocated.'), { status: 409 });

    const created = await BedAllocation.create({ studentId, roomId, bedNumber, allocatedAt }, { transaction });
    await updateRoomStatus(room, transaction);
    return created;
  });

  res.status(201).json({ data: allocation });
});

export const vacateBed = asyncHandler(async (req, res) => {
  const allocation = await BedAllocation.findByPk(req.params.allocationId);
  if (!allocation || allocation.status !== 'active') return res.status(404).json({ message: 'Active allocation not found.' });

  await sequelize.transaction(async (transaction) => {
    const room = await Room.findByPk(allocation.roomId, { transaction, lock: transaction.LOCK.UPDATE });
    await allocation.update({ status: 'vacated', vacatedAt: req.body.vacatedAt || new Date() }, { transaction });
    await updateRoomStatus(room, transaction);
  });

  res.status(204).send();
});
