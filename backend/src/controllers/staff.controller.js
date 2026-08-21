import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Staff, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── List all staff ────────────────────────────────────────────────────────────
export const listStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findAll({
    order: [['createdAt', 'DESC']],
  });
  res.json({ data: staff });
});

// ── Create staff record ────────────────────────────────────────────────────────
export const createStaff = asyncHandler(async (req, res) => {
  const { 
    staffId, firstName, lastName, gender, dateOfBirth, email, phone, address, 
    designation, joiningDate, employmentType, assignedArea, shift, 
    emergencyContactName, relationship, emergencyPhone, giveSystemAccess, username, password 
  } = req.body;

  // Basic validation
  if (!staffId || !firstName || !lastName || !gender || !dateOfBirth || !email || !phone || !address || 
      !designation || !joiningDate || !employmentType || !assignedArea || !shift || 
      !emergencyContactName || !relationship || !emergencyPhone) {
    return res.status(400).json({ message: 'All required staff fields must be provided.' });
  }

  // Assigned block conditional validation
  if (assignedArea === 'Hostel Block' && !req.body.assignedBlock) {
    return res.status(400).json({ message: 'Assigned Block is required when Assigned Area is Hostel Block.' });
  }

  // System access validation
  if (giveSystemAccess) {
    if (designation !== 'Warden / Rector') {
      return res.status(400).json({ message: 'System login access can only be granted to Warden / Rector staff.' });
    }
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and Password are required when giving system login access.' });
    }
  }

  // Restrict creating Warden / Rector to admin only
  if (designation === 'Warden / Rector' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators are allowed to register Warden / Rector staff.' });
  }

  const result = await sequelize.transaction(async (transaction) => {
    let userId = null;

    if (giveSystemAccess) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: username.trim().toLowerCase() }, transaction });
      if (existingUser) {
        throw Object.assign(new Error('A user account with this username/email already exists.'), { status: 409 });
      }

      // Hash password and create User
      const user = await User.create({
        email: username.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        role: 'rector',
      }, { transaction });

      userId = user.id;
    }

    // Double check email and staffId duplicate constraints inside transaction
    const existingStaffEmail = await Staff.findOne({ where: { email: email.trim().toLowerCase() }, transaction });
    if (existingStaffEmail) {
      throw Object.assign(new Error('A staff member with this email is already registered.'), { status: 409 });
    }

    const existingStaffId = await Staff.findOne({ where: { staffId }, transaction });
    if (existingStaffId) {
      throw Object.assign(new Error(`Staff ID ${staffId} is already assigned.`), { status: 409 });
    }

    // Determine assignedBlock value
    const assignedBlockVal = assignedArea === 'Hostel Block' ? req.body.assignedBlock : assignedArea;

    // Create Staff
    const staff = await Staff.create({
      ...req.body,
      userId,
      email: email.trim().toLowerCase(),
      assignedBlock: assignedBlockVal,
    }, { transaction });

    return staff;
  });

  res.status(201).json({ data: result });
});

export const getStaff = asyncHandler(async (req, res) => {
  const staffMember = await Staff.findByPk(req.params.id);
  if (!staffMember) return res.status(404).json({ message: 'Staff member not found.' });
  res.json({ data: staffMember });
});

