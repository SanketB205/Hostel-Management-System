import { Router } from 'express';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment,
  listCourses,
  createCourse,
  updateCourse,
  toggleCourseStatus,
  deleteCourse,
} from '../controllers/departments.controller.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

export const departmentsRouter = Router();

departmentsRouter.use(authenticate);

// ── Department routes ─────────────────────────────────────────────────────────
departmentsRouter.get('/', listDepartments);
departmentsRouter.get('/:id', getDepartment);
departmentsRouter.post('/', authorize('admin'), createDepartment);
departmentsRouter.put('/:id', authorize('admin'), updateDepartment);
departmentsRouter.patch('/:id/status', authorize('admin'), toggleDepartmentStatus);
departmentsRouter.delete('/:id', authorize('admin'), deleteDepartment);

// ── Course routes (nested under departments) ──────────────────────────────────
departmentsRouter.get('/:departmentId/courses', listCourses);
departmentsRouter.post('/:departmentId/courses', authorize('admin'), createCourse);
departmentsRouter.put('/courses/:courseId', authorize('admin'), updateCourse);
departmentsRouter.patch('/courses/:courseId/status', authorize('admin'), toggleCourseStatus);
departmentsRouter.delete('/courses/:courseId', authorize('admin'), deleteCourse);
