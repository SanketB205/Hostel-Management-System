import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { Staff, Student, User } from '../models/index.js';
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

  return res.json({
    token: createToken(user),
    user: { id: user.id, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req, res) => {
  const { id, email, role, lastLoginAt } = req.user;

  let profile = null;

  if (role === 'student') {
    const student = await Student.findOne({ where: { userId: id } });
    if (student) {
      profile = {
        name: `${student.firstName} ${student.lastName}`,
        phone: student.phone || null,
        username: student.registrationNumber,
      };
    }
  } else if (role === 'rector' || role === 'admin') {
    const staff = await Staff.findOne({ where: { userId: id } });
    if (staff) {
      profile = {
        name: `${staff.firstName} ${staff.lastName}`,
        phone: staff.phone || null,
        username: staff.staffId,
        designation: staff.designation,
      };
    }
  }

  res.json({
    user: {
      id,
      email,
      role,
      lastLoginAt,
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
