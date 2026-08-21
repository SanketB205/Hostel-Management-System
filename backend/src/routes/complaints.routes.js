import { Router } from 'express';
import {
  raiseComplaint,
  listMyComplaints,
  getMyComplaint,
  listAllComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
} from '../controllers/complaints.controller.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

export const complaintsRouter = Router();

// All routes require authentication
complaintsRouter.use(authenticate);

// ── Student-facing routes ─────────────────────────────────────────────────────
// POST   /api/complaints/my         — raise a new complaint
// GET    /api/complaints/my         — list own complaints (with filters)
// GET    /api/complaints/my/:id     — view a single own complaint
complaintsRouter.post('/my',      authorize('student', 'rector'), raiseComplaint);
complaintsRouter.get('/my',       authorize('student', 'rector'), listMyComplaints);
complaintsRouter.get('/my/:id',   authorize('student', 'rector'), getMyComplaint);

// ── Admin / Rector routes ─────────────────────────────────────────────────────
// GET    /api/complaints             — list all complaints (with filters)
// GET    /api/complaints/:id         — get any complaint by id
// PATCH  /api/complaints/:id         — update status / assign / resolve
// DELETE /api/complaints/:id         — delete a complaint
complaintsRouter.get('/',         authorize('admin', 'rector'), listAllComplaints);
complaintsRouter.get('/:id',      authorize('admin', 'rector'), getComplaint);
complaintsRouter.patch('/:id',    authorize('admin', 'rector'), updateComplaint);
complaintsRouter.delete('/:id',   authorize('admin', 'rector'), deleteComplaint);
