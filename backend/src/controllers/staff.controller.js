import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';
import { Staff, User, Complaint } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── List all staff ────────────────────────────────────────────────────────────
export const listStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'role', 'isActive'],
    }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ data: staff });
});

// ── Create staff record ────────────────────────────────────────────────────────
export const createStaff = asyncHandler(async (req, res) => {
  // Only administrators are allowed to register staff
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators are allowed to register staff.' });
  }

  const { 
    staffId, firstName, lastName, gender, dateOfBirth, email, phone, address, 
    designation, joiningDate, employmentType, assignedArea, shift, 
    emergencyContactName, relationship, emergencyPhone,
    provideSystemAccess, giveSystemAccess,
    loginEmail, username, password, confirmPassword
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

  const hasSystemAccess = Boolean(provideSystemAccess ?? giveSystemAccess);
  const accountEmail = (loginEmail || username || '').trim().toLowerCase();

  // Validate System Access credentials when toggle is ON
  if (hasSystemAccess) {
    if (!accountEmail) {
      return res.status(400).json({ message: 'Login email is required when system access is enabled.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountEmail)) {
      return res.status(400).json({ message: 'Please provide a valid login email address.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required when system access is enabled.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }
  }

  const result = await sequelize.transaction(async (transaction) => {
    // 1. Check duplicate staffId
    const existingStaffId = await Staff.findOne({ where: { staffId }, transaction });
    if (existingStaffId) {
      throw Object.assign(new Error(`Staff ID ${staffId} is already assigned.`), { status: 409 });
    }

    // 2. Check duplicate staff contact email
    const existingStaffEmail = await Staff.findOne({ where: { email: email.trim().toLowerCase() }, transaction });
    if (existingStaffEmail) {
      throw Object.assign(new Error('A staff member with this contact email is already registered.'), { status: 409 });
    }

    let userId = null;

    if (hasSystemAccess) {
      // 3. Check duplicate user login email in users table
      const existingUser = await User.findOne({ where: { email: accountEmail }, transaction });
      if (existingUser) {
        throw Object.assign(new Error('A user account with this login email already exists.'), { status: 409 });
      }

      // 4. Create User with role 'rector' (server-enforced role, cannot be manipulated by client)
      const user = await User.create({
        email: accountEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'rector',
        isActive: true,
      }, { transaction });

      userId = user.id;
    }

    // Determine assignedBlock value
    const assignedBlockVal = assignedArea === 'Hostel Block' ? req.body.assignedBlock : assignedArea;

    // 5. Create Staff record (userId linked if system access enabled, null if not)
    const staff = await Staff.create({
      staffId,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email: email.trim().toLowerCase(),
      phone,
      address,
      designation,
      joiningDate,
      employmentType,
      assignedArea,
      assignedBlock: assignedBlockVal,
      shift,
      emergencyContactName,
      relationship,
      emergencyPhone,
      uploadedFiles: req.body.uploadedFiles || null,
      userId,
    }, { transaction });

    return staff;
  });

  const message = hasSystemAccess
    ? 'Staff registered successfully with system access.'
    : 'Staff registered successfully. No system access was created.';

  res.status(201).json({
    message,
    data: result
  });
});

// ── Get single staff member ───────────────────────────────────────────────────
export const getStaff = asyncHandler(async (req, res) => {
  let staffMember = await Staff.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'role', 'isActive'],
    }],
  });

  if (!staffMember) {
    staffMember = await Staff.findOne({
      where: { staffId: req.params.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role', 'isActive'],
      }],
    });
  }

  if (!staffMember) return res.status(404).json({ message: 'Staff member not found.' });
  res.json({ data: staffMember });
});

// ── Update staff record ───────────────────────────────────────────────────────
export const updateStaff = asyncHandler(async (req, res) => {
  // Only administrators are allowed to update staff
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators are allowed to update staff profiles.' });
  }

  let staffMember = await Staff.findByPk(req.params.id, {
    include: [{ model: User, as: 'user' }],
  });

  if (!staffMember) {
    staffMember = await Staff.findOne({
      where: { staffId: req.params.id },
      include: [{ model: User, as: 'user' }],
    });
  }

  if (!staffMember) {
    return res.status(404).json({ message: 'Staff member not found.' });
  }

  const {
    firstName, lastName, gender, dateOfBirth, email, phone, address,
    designation, joiningDate, employmentType, assignedArea, assignedBlock, shift,
    emergencyContactName, relationship, emergencyPhone,
    uploadedFiles,
    provideSystemAccess, giveSystemAccess,
    loginEmail, username, password, confirmPassword
  } = req.body;

  // Basic validation of required fields if provided
  if (!firstName || !lastName || !gender || !dateOfBirth || !email || !phone || !address ||
      !designation || !joiningDate || !employmentType || !assignedArea || !shift ||
      !emergencyContactName || !relationship || !emergencyPhone) {
    return res.status(400).json({ message: 'All required staff fields must be provided.' });
  }

  if (assignedArea === 'Hostel Block' && !assignedBlock && !req.body.assignedBlock) {
    return res.status(400).json({ message: 'Assigned Block is required when Assigned Area is Hostel Block.' });
  }

  // Check email uniqueness if email changed
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== staffMember.email) {
    const existingStaffEmail = await Staff.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: staffMember.id }
      }
    });
    if (existingStaffEmail) {
      return res.status(409).json({ message: 'A staff member with this contact email is already registered.' });
    }
  }

  const hasSystemAccess = provideSystemAccess !== undefined
    ? Boolean(provideSystemAccess)
    : (giveSystemAccess !== undefined ? Boolean(giveSystemAccess) : undefined);

  const accountEmail = (loginEmail || username || '').trim().toLowerCase();

  // Validate System Access credentials if toggled ON
  if (hasSystemAccess === true) {
    if (!accountEmail && (!staffMember.user || !staffMember.user.email)) {
      return res.status(400).json({ message: 'Login email is required when system access is enabled.' });
    }
    if (accountEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(accountEmail)) {
        return res.status(400).json({ message: 'Please provide a valid login email address.' });
      }
    }
    // If staff does not already have an account, password is required
    if (!staffMember.userId && !password) {
      return res.status(400).json({ message: 'Password is required when creating system access credentials.' });
    }
    // If password provided (either new account or password update)
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      if (confirmPassword !== undefined && confirmPassword !== password) {
        return res.status(400).json({ message: 'Passwords do not match.' });
      }
    }
  }

  await sequelize.transaction(async (transaction) => {
    // Handle User account
    if (hasSystemAccess !== undefined) {
      if (staffMember.userId) {
        // Staff has an existing User account
        const user = await User.findByPk(staffMember.userId, { transaction });
        if (user) {
          if (hasSystemAccess === true) {
            user.isActive = true;
            if (accountEmail && accountEmail !== user.email) {
              const duplicateUser = await User.findOne({
                where: {
                  email: accountEmail,
                  id: { [Op.ne]: user.id }
                },
                transaction
              });
              if (duplicateUser) {
                throw Object.assign(new Error('A user account with this login email already exists.'), { status: 409 });
              }
              user.email = accountEmail;
            }
            if (password) {
              user.passwordHash = await bcrypt.hash(password, 12);
            }
            await user.save({ transaction });
          } else {
            // Admin disabled system access: deactivate user account to prevent login while preserving audit trails
            user.isActive = false;
            await user.save({ transaction });
          }
        }
      } else if (hasSystemAccess === true) {
        // Staff does not have a User account yet -> create one
        const duplicateUser = await User.findOne({ where: { email: accountEmail }, transaction });
        if (duplicateUser) {
          throw Object.assign(new Error('A user account with this login email already exists.'), { status: 409 });
        }

        const newUser = await User.create({
          email: accountEmail,
          passwordHash: await bcrypt.hash(password, 12),
          role: 'rector',
          isActive: true,
        }, { transaction });

        staffMember.userId = newUser.id;
      }
    }

    // Determine assigned block
    const assignedBlockVal = assignedArea === 'Hostel Block'
      ? (assignedBlock || req.body.assignedBlock)
      : assignedArea;

    // Update staff fields
    await staffMember.update({
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email: normalizedEmail,
      phone,
      address,
      designation,
      joiningDate,
      employmentType,
      assignedArea,
      assignedBlock: assignedBlockVal,
      shift,
      emergencyContactName,
      relationship,
      emergencyPhone,
      uploadedFiles: uploadedFiles !== undefined ? uploadedFiles : staffMember.uploadedFiles,
      userId: staffMember.userId,
    }, { transaction });
  });

  // Re-fetch updated staff member with associated safe user attributes
  const updatedStaff = await Staff.findByPk(staffMember.id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'role', 'isActive'],
    }],
  });

  res.json({
    message: 'Staff profile updated successfully.',
    data: updatedStaff,
  });
});

// ── Delete staff record ───────────────────────────────────────────────────────
export const deleteStaff = asyncHandler(async (req, res) => {
  // Only administrators are allowed to delete staff
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators are allowed to remove staff.' });
  }

  let staffMember = await Staff.findByPk(req.params.id);
  if (!staffMember) {
    staffMember = await Staff.findOne({ where: { staffId: req.params.id } });
  }
  if (!staffMember) {
    return res.status(404).json({ message: 'Staff member not found.' });
  }

  await sequelize.transaction(async (transaction) => {
    // 1. Unassign from any complaints
    await Complaint.update(
      { assignedToId: null },
      { where: { assignedToId: staffMember.id }, transaction }
    );
    await Complaint.update(
      { resolvedById: null },
      { where: { resolvedById: staffMember.id }, transaction }
    );

    // 2. Delete linked User account if exists
    if (staffMember.userId) {
      await User.destroy({ where: { id: staffMember.userId }, transaction });
    }

    // 3. Delete Staff record
    await staffMember.destroy({ transaction });
  });

  res.json({ message: 'Staff profile and linked login credentials removed successfully.' });
});


