import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { BedAllocation, Floor, HostelBlock, Room, Staff, Student, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createToken = (user) => jwt.sign({ role: user.role }, env.jwtSecret, {
  subject: user.id,
  expiresIn: env.jwtExpiresIn,
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.isActive || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  let studentId = null;
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { userId: user.id } });
    if (student) studentId = student.id;
  }

  return res.json({
    token: createToken(user),
    user: { id: user.id, email: user.email, role: user.role, studentId },
  });
});

export const me = asyncHandler(async (req, res) => {
  const { id, email, role, lastLoginAt, createdAt } = req.user;

  let profile = null;

  if (role === 'student') {
    const student = await Student.findOne({
      where: { userId: id },
      include: [
        {
          model: BedAllocation,
          as: 'allocations',
          required: false,
          where: { status: 'active' },
          include: [{
            model: Room,
            as: 'room',
            attributes: ['id', 'number', 'type', 'capacity'],
            include: [{
              model: Floor,
              as: 'floor',
              attributes: ['floorNumber'],
              include: [{
                model: HostelBlock,
                as: 'block',
                attributes: ['name'],
              }],
            }],
          }],
          order: [['allocatedAt', 'DESC']],
          limit: 1,
        },
      ],
    });
    if (student) {
      const sJson = student.toJSON();
      const activeAllocation = (sJson.allocations || [])[0];
      profile = {
        studentId: student.id,
        registrationNumber: student.registrationNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`,
        phone: student.phone || null,
        address: student.address || null,
        gender: student.gender || null,
        dateOfBirth: student.dateOfBirth || null,
        studentEmail: student.email || null,
        department: student.department || null,
        course: student.course || null,
        year: student.year || null,
        yearOfStudy: student.yearOfStudy || null,
        admissionDate: student.admissionDate || null,
        guardianName: student.guardianName || null,
        guardianRelationship: student.guardianRelationship || null,
        guardianPhone: student.guardianPhone || null,
        guardianEmail: student.guardianEmail || null,
        status: student.status || 'Not Marked',
        username: student.registrationNumber,
        createdAt: student.createdAt || createdAt,
        // Room info
        room: activeAllocation?.room?.number || null,
        roomType: activeAllocation?.room?.type || null,
        bedNumber: activeAllocation?.bedNumber || null,
        floor: activeAllocation?.room?.floor?.floorNumber != null
          ? `Floor ${activeAllocation.room.floor.floorNumber}` : null,
        block: activeAllocation?.room?.floor?.block?.name || null,
        allocatedAt: activeAllocation?.allocatedAt || null,
      };
    }
  } else if (role === 'rector' || role === 'admin') {
    const staffMember = await Staff.findOne({ where: { userId: id } });
    if (staffMember) {
      profile = {
        staffId: staffMember.id,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        phone: staffMember.phone || null,
        address: staffMember.address || null,
        gender: staffMember.gender || null,
        dateOfBirth: staffMember.dateOfBirth || null,
        username: staffMember.staffId,
        designation: staffMember.designation || (role === 'admin' ? 'System Administrator' : 'Warden / Rector'),
        employmentType: staffMember.employmentType || 'Full-time',
        joiningDate: staffMember.joiningDate || staffMember.createdAt,
        assignedArea: staffMember.assignedArea || 'Hostel Block',
        assignedBlock: staffMember.assignedBlock || null,
        shift: staffMember.shift || 'Regular Shift',
        emergencyContactName: staffMember.emergencyContactName || null,
        emergencyRelationship: staffMember.relationship || null,
        emergencyPhone: staffMember.emergencyPhone || null,
        createdAt: staffMember.createdAt || createdAt,
      };
    } else {
      // Fallback for seeded or standalone admin/rector accounts without staff row
      const namePart = email.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const isAdm = role === 'admin';
      profile = {
        name: isAdm ? 'System Administrator' : displayName,
        firstName: isAdm ? 'System' : displayName,
        lastName: isAdm ? 'Administrator' : 'Rector',
        username: isAdm ? 'ADMIN-SYS' : 'RECTOR-SYS',
        designation: isAdm ? 'System Administrator' : 'Warden / Rector',
        employmentType: isAdm ? 'Permanent / Global Admin' : 'Full-time',
        joiningDate: createdAt || null,
        assignedArea: isAdm ? 'Campus-Wide (All Blocks)' : 'Hostel Block',
        assignedBlock: isAdm ? 'All Blocks' : 'Assigned Hostel Block',
        shift: isAdm ? 'Administrative (24/7 Global Access)' : 'Regular Shift',
        phone: null,
        address: isAdm ? 'Central Administration Office, HostelSpace Campus' : 'Hostel Warden Office',
        createdAt,
      };
    }
  }

  res.json({
    user: {
      id,
      email,
      role,
      lastLoginAt,
      createdAt,
      ...(profile || {}),
    },
  });
});

export const logout = (req, res) => res.status(204).send();

/**
 * POST /api/auth/change-password
 * Student-facing: verify email + DOB, then set a new password.
 * Body: { email, dateOfBirth (DDMMYYYY), newPassword, confirmPassword }
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { email, dateOfBirth, newPassword, confirmPassword } = req.body;

  if (!email || !dateOfBirth || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Email, date of birth, new password and confirmation are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  // dateOfBirth can arrive as DDMMYYYY (8 digits) or YYYY-MM-DD from the Student record
  // Normalise both to DDMMYYYY for comparison
  const normInput = String(dateOfBirth).replace(/\D/g, '');  // strip non-digits

  const user = await User.scope('withPassword').findOne({
    where: { email: email.trim().toLowerCase(), role: 'student' },
    include: [{ model: Student, as: 'student' }],
  });

  if (!user || !user.student) {
    return res.status(404).json({ message: 'No student account found with that email.' });
  }

  // Build expected DDMMYYYY from stored dateOfBirth (stored as YYYY-MM-DD)
  const stored = String(user.student.dateOfBirth || '');   // e.g. "2005-02-20"
  const [yr, mo, dy] = stored.split('-');
  const expectedDob = dy && mo && yr ? `${dy}${mo}${yr}` : '';

  if (normInput !== expectedDob) {
    return res.status(401).json({ message: 'Date of birth does not match our records.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ message: 'Password changed successfully. You can now log in with your new password.' });
});
