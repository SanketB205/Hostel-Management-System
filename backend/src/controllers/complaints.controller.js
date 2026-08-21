import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { BedAllocation, Complaint, ComplaintTimeline, Room, Staff, Student, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate next complaint number: CMP001, CMP002, …
 * Locks the table inside a transaction to prevent duplicates under concurrency.
 */
async function generateComplaintNumber(transaction) {
  const last = await Complaint.findOne({
    attributes: ['complaintNumber'],
    order: [['createdAt', 'DESC']],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (!last) return 'CMP001';
  const match = last.complaintNumber.match(/^CMP(\d+)$/);
  const num = match ? parseInt(match[1], 10) : 0;
  return `CMP${String(num + 1).padStart(3, '0')}`;
}

/** Standard include for complaint detail queries */
const detailIncludes = [
  {
    model: Student,
    as: 'student',
    attributes: ['id', 'userId', 'firstName', 'lastName', 'registrationNumber', 'email', 'phone'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['role'],
      },
      {
        model: BedAllocation,
        as: 'allocations',
        where: { status: 'active' },
        required: false,
        limit: 1,
        include: [{ model: Room, as: 'room', attributes: ['id', 'number'] }],
      },
    ],
  },
  {
    model: Staff,
    as: 'assignedTo',
    attributes: ['id', 'firstName', 'lastName', 'designation'],
    required: false,
  },
  {
    model: Staff,
    as: 'resolvedBy',
    attributes: ['id', 'firstName', 'lastName', 'designation'],
    required: false,
  },
  {
    model: ComplaintTimeline,
    as: 'timeline',
    attributes: ['id', 'label', 'note', 'createdAt'],
  },
];

// ── Student: raise a new complaint ───────────────────────────────────────────

export const raiseComplaint = asyncHandler(async (req, res) => {
  const { category, title, description, priority, attachmentName } = req.body;

  if (!category || !title || !description || !priority) {
    return res.status(400).json({ message: 'Category, title, description, and priority are required.' });
  }

  const VALID_CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'Internet', 'Cleaning', 'Other'];
  const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
  }

  // Resolve the Student record linked to the logged-in user
  let student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) {
    if (req.user.role === 'rector') {
      // Auto-create a student profile for Rector so they can raise complaints
      const staff = await Staff.findOne({ where: { userId: req.user.id } }) || {};
      student = await Student.create({
        userId: req.user.id,
        registrationNumber: `RECTOR_${req.user.id.substring(0, 8).toUpperCase()}`,
        firstName: staff.firstName || 'Rector',
        lastName: staff.lastName || 'User',
        email: req.user.email || `rector_${Date.now()}@example.com`,
        course: 'N/A',
        year: 'N/A',
        dateOfBirth: new Date(),
      });
    } else {
      return res.status(404).json({ message: 'No student profile found for this account.' });
    }
  }

  const complaint = await sequelize.transaction(async (t) => {
    const complaintNumber = await generateComplaintNumber(t);

    const created = await Complaint.create({
      complaintNumber,
      studentId: student.id,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      attachmentName: attachmentName || null,
      status: 'Pending',
    }, { transaction: t });

    // Seed the initial timeline entry
    await ComplaintTimeline.create({
      complaintId: created.id,
      label: 'Complaint Submitted',
      actorId: req.user.id,
    }, { transaction: t });

    return created;
  });

  // Return with full detail
  const full = await Complaint.findByPk(complaint.id, { include: detailIncludes });
  res.status(201).json({ data: full });
});

// ── Student: list own complaints ─────────────────────────────────────────────

export const listMyComplaints = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  // If no student profile yet (e.g. rector who hasn't raised a complaint), return empty list
  if (!student) return res.json({ data: [] });

  const { status, category, priority, search } = req.query;

  const where = { studentId: student.id };
  if (status   && status   !== 'All') where.status   = status;
  if (category && category !== 'All') where.category = category;
  if (priority && priority !== 'All') where.priority = priority;
  if (search) {
    where[Op.or] = [
      { title:           { [Op.like]: `%${search}%` } },
      { complaintNumber: { [Op.like]: `%${search}%` } },
      { category:        { [Op.like]: `%${search}%` } },
    ];
  }

  const complaints = await Complaint.findAll({
    where,
    include: detailIncludes,
    order: [['createdAt', 'DESC']],
  });

  res.json({ data: complaints });
});

// ── Student: get single own complaint ────────────────────────────────────────

export const getMyComplaint = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) return res.status(404).json({ message: 'No student profile found for this account.' });

  const complaint = await Complaint.findOne({
    where: { id: req.params.id, studentId: student.id },
    include: detailIncludes,
  });

  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  res.json({ data: complaint });
});

// ── Admin / Rector: list all complaints ──────────────────────────────────────

export const listAllComplaints = asyncHandler(async (req, res) => {
  const { status, category, priority, search, creatorRole } = req.query;

  const where = {};
  if (status   && status   !== 'All') where.status   = status;
  if (category && category !== 'All') where.category = category;
  if (priority && priority !== 'All') where.priority = priority;
  if (search) {
    where[Op.or] = [
      { title:           { [Op.like]: `%${search}%` } },
      { complaintNumber: { [Op.like]: `%${search}%` } },
    ];
  }

  // Support filtering by creator role (student or rector)
  // If creatorRole is specified and not 'All', filter by the user's role
  const includesWithOptionalRoleFilter = detailIncludes.map(inc => {
    if (inc.as !== 'student') return inc;
    
    const studentInclude = { ...inc, required: true };
    
    // Apply role filter only if creatorRole is specified and not 'All'
    if (creatorRole && creatorRole !== 'All') {
      studentInclude.include = (inc.include || []).map(nested => {
        if (nested.as !== 'user') return nested;
        return { ...nested, where: { role: creatorRole }, required: true };
      });
    }
    
    return studentInclude;
  });

  const complaints = await Complaint.findAll({
    where,
    include: includesWithOptionalRoleFilter,
    order: [['createdAt', 'DESC']],
  });

  res.json({ data: complaints });
});

export const getComplaint = asyncHandler(async (req, res) => {
  // Use the same role filter as listAllComplaints — only student-raised complaints
  const includesWithRoleFilter = detailIncludes.map(inc => {
    if (inc.as !== 'student') return inc;
    return {
      ...inc,
      required: true,
      include: (inc.include || []).map(nested => {
        if (nested.as !== 'user') return nested;
        return { ...nested, where: { role: 'student' }, required: true };
      }),
    };
  });

  const complaint = await Complaint.findByPk(req.params.id, { include: includesWithRoleFilter });
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  res.json({ data: complaint });
});

// ── Admin / Rector: update status / assign / resolve ─────────────────────────

export const updateComplaint = asyncHandler(async (req, res) => {
  // Fetch with role filter so rector-raised complaints can't be found via this route
  const includesWithRoleFilter = detailIncludes.map(inc => {
    if (inc.as !== 'student') return inc;
    return {
      ...inc,
      required: true,
      include: (inc.include || []).map(nested => {
        if (nested.as !== 'user') return nested;
        return { ...nested, where: { role: 'student' }, required: true };
      }),
    };
  });

  const complaint = await Complaint.findByPk(req.params.id, { include: includesWithRoleFilter });
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

  const { status, assignedToId, resolutionNotes } = req.body;

  const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  // Resolve the staff member performing the action
  const staff = await Staff.findOne({ where: { userId: req.user.id } });

  await sequelize.transaction(async (t) => {
    const updates = {};

    if (status && status !== complaint.status) {
      updates.status = status;

      // Track the transition in the timeline
      const TIMELINE_LABELS = {
        'Pending':     'Marked as Pending',
        'In Progress': 'Work Started — In Progress',
        'Resolved':    'Complaint Resolved',
        'Rejected':    'Complaint Rejected',
      };

      await ComplaintTimeline.create({
        complaintId: complaint.id,
        label: TIMELINE_LABELS[status] || status,
        actorId: req.user.id,
      }, { transaction: t });

      // On resolve: capture who resolved it and when
      if (status === 'Resolved') {
        updates.resolvedById = staff?.id || null;
        updates.resolvedAt   = new Date();
        if (resolutionNotes) updates.resolutionNotes = resolutionNotes.trim();
      }
    }

    if (assignedToId !== undefined) {
      updates.assignedToId = assignedToId || null;
      // Add assignment timeline entry only if it's a new assignment
      if (assignedToId && assignedToId !== complaint.assignedToId) {
        await ComplaintTimeline.create({
          complaintId: complaint.id,
          label: 'Assigned to Staff',
          actorId: req.user.id,
        }, { transaction: t });
      }
    }

    if (resolutionNotes && !status) {
      updates.resolutionNotes = resolutionNotes.trim();
    }

    await complaint.update(updates, { transaction: t });
  });

  const updated = await Complaint.findByPk(complaint.id, { include: detailIncludes });
  res.json({ data: updated });
});

// ── Admin / Rector: delete a complaint ───────────────────────────────────────

export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);
  if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
  await complaint.destroy();
  res.status(204).send();
});
