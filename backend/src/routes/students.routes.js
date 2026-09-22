import { Router } from 'express';
import { createStudent, getStudent, listStudents, resetStudentPassword, updateStudentStatus, getAttendanceAnalytics, getFinanceAnalytics, deleteStudent, updateStudent, createPaymentOrder, verifyPayment, getNextRegistrationNumberPreview } from '../controllers/students.controller.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

export const studentsRouter = Router();

studentsRouter.use(authenticate);
studentsRouter.get('/attendance/analytics', getAttendanceAnalytics);
studentsRouter.get('/finance/analytics', getFinanceAnalytics);
studentsRouter.get('/next-registration-number', authorize('admin'), getNextRegistrationNumberPreview);
studentsRouter.get('/', listStudents);
studentsRouter.get('/:id', getStudent);
studentsRouter.post('/:id/payment/order', createPaymentOrder);
studentsRouter.post('/:id/payment/verify', verifyPayment);
studentsRouter.post('/',              authorize('admin'),         createStudent);
studentsRouter.put('/:id',             authorize('admin'),         updateStudent);
studentsRouter.patch('/:id/status',   authorize('admin', 'rector'), updateStudentStatus);
studentsRouter.post('/:id/reset-password', authorize('admin'),   resetStudentPassword);
studentsRouter.delete('/:id',         authorize('admin'),         deleteStudent);
