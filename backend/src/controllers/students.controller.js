import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { BedAllocation, Room, Student, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Converts any date string (YYYY-MM-DD or ISO) → DDMMYYYY password
const dobPassword = (dateOfBirth) => {
  // Slice first 10 chars handles both "2005-02-20" and "2005-02-20T00:00:00.000Z"
  const dateStr = String(dateOfBirth).slice(0, 10);
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr; // fallback — won't match but avoids crash
  return `${day}${month}${year}`;
};

// ── List all students ─────────────────────────────────────────────────────────

export const listStudents = asyncHandler(async (req, res) => {
  const students = await Student.findAll({
    include: [{
      model: BedAllocation,
      as: 'allocations',
      where: { status: 'active' },
      required: false,
      include: [{ model: Room, as: 'room' }],
    }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ data: students });
});

// ── Get single student ────────────────────────────────────────────────────────

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, {
    include: [{
      model: BedAllocation,
      as: 'allocations',
      required: false,
      include: [{ model: Room, as: 'room' }],
      order: [['allocatedAt', 'DESC']],
    }],
  });
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json({ data: student });
});

// ── Create student ────────────────────────────────────────────────────────────

export const createStudent = asyncHandler(async (req, res) => {
  const { registrationNumber, firstName, lastName, dateOfBirth, email, course, year } = req.body;
  if (!registrationNumber || !firstName || !lastName || !dateOfBirth || !email || !course || !year) {
    return res.status(400).json({ message: 'Registration number, name, date of birth, email, course, and year are required.' });
  }

  const result = await sequelize.transaction(async (transaction) => {
    // Password is always DDMMYYYY derived from date of birth — no overrides
    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(dobPassword(dateOfBirth), 12),
      role: 'student',
    }, { transaction });

    const student = await Student.create({
      ...req.body,
      userId: user.id,
    }, { transaction });

    const allocationData = req.body.allocation;
    if (!allocationData) return student;

    const roomNumber = String(allocationData.roomNumber || '').trim().toUpperCase();
    const room = await Room.findOne({ where: { number: roomNumber }, transaction, lock: transaction.LOCK.UPDATE });
    if (!room) throw Object.assign(new Error('Selected room was not found in the database.'), { status: 404 });
    if (room.status === 'Maintenance') throw Object.assign(new Error('Maintenance rooms cannot receive allocations.'), { status: 409 });

    const occupiedBeds = await BedAllocation.count({ where: { roomId: room.id, status: 'active' }, transaction });
    if (occupiedBeds >= room.capacity) throw Object.assign(new Error('Selected room is already full.'), { status: 409 });

    const occupiedBed = await BedAllocation.findOne({
      where: { roomId: room.id, bedNumber: allocationData.bedNumber, status: 'active' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (occupiedBed) throw Object.assign(new Error('Selected bed is already allocated.'), { status: 409 });

    await BedAllocation.create({
      studentId: student.id,
      roomId: room.id,
      bedNumber: allocationData.bedNumber,
      allocatedAt: allocationData.allocatedAt || new Date(),
    }, { transaction });

    await room.update({
      status: occupiedBeds + 1 >= room.capacity ? 'Full' : 'Occupied',
    }, { transaction });

    return student;
  });

  res.status(201).json({ data: result });
});

// ── Update student status (rector attendance) ─────────────────────────────────

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Present', 'Absent', 'Outing', 'Leave', 'Late'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}.` });
  }

  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  await student.update({ status });
  res.json({ data: { id: student.id, status: student.status } });
});

export const resetStudentPassword = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });

  const user = await User.scope('withPassword').findByPk(student.userId);
  if (!user) return res.status(404).json({ message: 'No login account linked to this student.' });

  // Always recompute from stored dateOfBirth (YYYY-MM-DD → DDMMYYYY)
  user.passwordHash = await bcrypt.hash(dobPassword(student.dateOfBirth), 12);
  await user.save();

  res.json({
    message: `Password reset to DOB format (DDMMYYYY) for ${student.firstName} ${student.lastName}.`,
  });
});
