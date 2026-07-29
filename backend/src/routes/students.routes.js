import { Router } from 'express';
import { createStudent, getStudent, listStudents, resetStudentPassword, updateStudentStatus } from '../controllers/students.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const studentsRouter = Router();

studentsRouter.use(authenticate);
studentsRouter.get('/', listStudents);
studentsRouter.get('/:id', getStudent);
studentsRouter.post('/', createStudent);
studentsRouter.patch('/:id/status', updateStudentStatus);
studentsRouter.post('/:id/reset-password', resetStudentPassword);
