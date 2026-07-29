import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { BedAllocation, Floor, HostelBlock, Room, Student, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizeRoom = (value) => String(value || '').replace(/^BLOCK\s*/i, '').replace(/[-\s]/g, '').toUpperCase().replace(/^([A-Z])\1(?=\d)/, '$1');
const dobPassword = (dob) => { const [year, month, day] = String(dob).slice(0, 10).split('-'); return year && month && day ? `${day}${month}${year}` : null; };

export const importLocalStorage = asyncHandler(async (req, res) => {
  const { blocks = [], students = [] } = req.body;
  const report = { blocks: 0, rooms: 0, students: 0, skippedStudents: 0, allocations: 0 };

  await sequelize.transaction(async (transaction) => {
    for (const savedBlock of blocks) {
      const [block, created] = await HostelBlock.findOrCreate({ where: { name: savedBlock.name }, defaults: { name: savedBlock.name }, transaction });
      if (created) report.blocks += 1;
      for (const savedFloor of savedBlock.floors || []) {
        const floorNumber = Number(String(savedFloor.name || savedFloor.floorNumber || '').match(/\d+/)?.[0]);
        if (!Number.isInteger(floorNumber)) continue;
        const [floor] = await Floor.findOrCreate({ where: { blockId: block.id, floorNumber }, defaults: { blockId: block.id, floorNumber }, transaction });
        for (const savedRoom of savedFloor.rooms || []) {
          const number = normalizeRoom(savedRoom.number);
          if (!number) continue;
          const [room, roomCreated] = await Room.findOrCreate({ where: { number }, defaults: { floorId: floor.id, number, type: savedRoom.type || 'Standard', capacity: Number(savedRoom.capacity) || 1, status: savedRoom.status || 'Available', remarks: savedRoom.remarks }, transaction });
          if (roomCreated) report.rooms += 1;
          if (room.floorId !== floor.id) await room.update({ floorId: floor.id }, { transaction });
        }
      }
    }

    for (const savedStudent of students) {
      const [firstName, ...lastNameParts] = String(savedStudent.name || '').trim().split(/\s+/);
      const dateOfBirth = String(savedStudent.dob || '').slice(0, 10);
      const registrationNumber = savedStudent.regNo || savedStudent.registrationNumber;
      if (!firstName || !lastNameParts.length || !registrationNumber || !savedStudent.email || !dobPassword(dateOfBirth) || !savedStudent.course || !savedStudent.year) { report.skippedStudents += 1; continue; }
      const existingStudent = await Student.findOne({ where: { registrationNumber }, transaction });
      if (existingStudent) continue;
      const [user] = await User.scope('withPassword').findOrCreate({ where: { email: savedStudent.email.toLowerCase() }, defaults: { email: savedStudent.email, passwordHash: await bcrypt.hash(savedStudent.password || dobPassword(dateOfBirth), 12), role: 'student' }, transaction });
      const student = await Student.create({ userId: user.id, registrationNumber, firstName, lastName: lastNameParts.join(' '), dateOfBirth, email: savedStudent.email, course: savedStudent.course, year: savedStudent.year, status: savedStudent.status || 'Present' }, { transaction });
      report.students += 1;
      const room = await Room.findOne({ where: { number: normalizeRoom(savedStudent.room) }, transaction });
      if (!room || room.status === 'Maintenance' || await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction }) >= room.capacity) continue;
      const occupied = await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction });
      await BedAllocation.create({ studentId: student.id, roomId: room.id, bedNumber: `Bed ${occupied + 1}` }, { transaction });
      await room.update({ status: occupied + 1 >= room.capacity ? 'Full' : 'Occupied' }, { transaction });
      report.allocations += 1;
    }
  });
  res.json({ message: 'Local data import completed. LocalStorage was not changed.', data: report });
});
