import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getStudentPayments,
  createPayment,
  deletePayment
} from '../controllers/payments.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get payment summary and history for a student
router.get('/student/:studentId', getStudentPayments);

// Create new payment (Admin only enforced by frontend, backend accepts authenticated users)
router.post('/', createPayment);

// Delete payment (Admin only enforced by frontend, backend accepts authenticated users)
router.delete('/:id', deletePayment);

export default router;
