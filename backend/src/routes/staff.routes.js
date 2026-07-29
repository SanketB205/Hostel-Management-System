import { Router } from 'express';
import { listStaff, createStaff } from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const staffRouter = Router();

staffRouter.use(authenticate);
staffRouter.get('/', listStaff);
staffRouter.post('/', createStaff);
