import { Router } from 'express';
import { allocateBed, vacateBed } from '../controllers/allocations.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const allocationsRouter = Router();

allocationsRouter.use(authenticate);
allocationsRouter.post('/', allocateBed);
allocationsRouter.patch('/:allocationId/vacate', vacateBed);
