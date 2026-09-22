import { Department, Course } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── List all departments (with courses) ───────────────────────────────────────
export const listDepartments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;

  const departments = await Department.findAll({
    where,
    include: [
      {
        model: Course,
        as: 'courses',
        where: status ? { status } : undefined,
        required: false,
        order: [['name', 'ASC']],
      },
    ],
    order: [['name', 'ASC']],
  });

  res.json({ data: departments });
});

// ── Get single department ─────────────────────────────────────────────────────
export const getDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id, {
    include: [{ model: Course, as: 'courses', order: [['name', 'ASC']] }],
  });
  if (!dept) return res.status(404).json({ message: 'Department not found.' });
  res.json({ data: dept });
});

// ── Create department ─────────────────────────────────────────────────────────
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Department name is required.' });
  }
  if (!code || !code.trim()) {
    return res.status(400).json({ message: 'Department code is required.' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const existing = await Department.findOne({ where: { code: normalizedCode } });
  if (existing) {
    return res.status(409).json({ message: `Department code "${normalizedCode}" already exists.` });
  }

  const dept = await Department.create({ name: name.trim(), code: normalizedCode, status: 'Active' });
  res.status(201).json({ data: dept });
});

// ── Update department ─────────────────────────────────────────────────────────
export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });

  const { name, code, status } = req.body;
  if (code) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await Department.findOne({ where: { code: normalizedCode } });
    if (existing && existing.id !== dept.id) {
      return res.status(409).json({ message: `Department code "${normalizedCode}" already exists.` });
    }
  }

  await dept.update({
    ...(name && { name: name.trim() }),
    ...(code && { code: code.trim().toUpperCase() }),
    ...(status && { status }),
  });

  const updated = await Department.findByPk(dept.id, {
    include: [{ model: Course, as: 'courses', order: [['name', 'ASC']] }],
  });
  res.json({ data: updated });
});

// ── Toggle department status ──────────────────────────────────────────────────
export const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });

  const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
  await dept.update({ status: newStatus });
  res.json({ data: { id: dept.id, status: newStatus } });
});

// ── List courses for a department ─────────────────────────────────────────────
export const listCourses = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.departmentId);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });

  const { status } = req.query;
  const where = { departmentId: req.params.departmentId };
  if (status) where.status = status;

  const courses = await Course.findAll({ where, order: [['name', 'ASC']] });
  res.json({ data: courses });
});

// ── Create course under a department ─────────────────────────────────────────
export const createCourse = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.departmentId);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });

  const { name, code } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Course name is required.' });
  }
  if (!code || !code.trim()) {
    return res.status(400).json({ message: 'Course code is required.' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const existing = await Course.findOne({
    where: { departmentId: req.params.departmentId, code: normalizedCode },
  });
  if (existing) {
    return res.status(409).json({
      message: `Course code "${normalizedCode}" already exists in this department.`,
    });
  }

  const course = await Course.create({
    name: name.trim(),
    code: normalizedCode,
    departmentId: req.params.departmentId,
    status: 'Active',
  });
  res.status(201).json({ data: course });
});

// ── Update course ─────────────────────────────────────────────────────────────
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  const { name, code, status } = req.body;
  if (code) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await Course.findOne({
      where: { departmentId: course.departmentId, code: normalizedCode },
    });
    if (existing && existing.id !== course.id) {
      return res.status(409).json({
        message: `Course code "${normalizedCode}" already exists in this department.`,
      });
    }
  }

  await course.update({
    ...(name && { name: name.trim() }),
    ...(code && { code: code.trim().toUpperCase() }),
    ...(status && { status }),
  });

  res.json({ data: course });
});

// ── Toggle course status ──────────────────────────────────────────────────────
export const toggleCourseStatus = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  const newStatus = course.status === 'Active' ? 'Inactive' : 'Active';
  await course.update({ status: newStatus });
  res.json({ data: { id: course.id, status: newStatus } });
});

// ── Delete course ─────────────────────────────────────────────────────────────
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });
  await course.destroy();
  res.json({ message: 'Course deleted successfully.' });
});

// ── Delete department ─────────────────────────────────────────────────────────
export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found.' });
  await dept.destroy();
  res.json({ message: 'Department deleted successfully.' });
});
