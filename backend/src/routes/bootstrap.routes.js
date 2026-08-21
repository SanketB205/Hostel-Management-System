import { Router } from 'express';
import { importLocalStorage, clearTodayAttendance } from '../controllers/bootstrap.controller.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

export const bootstrapRouter = Router();
bootstrapRouter.use(authenticate);
bootstrapRouter.post('/local-storage', importLocalStorage);

// Demo utility — admin only: wipe today's attendance so all students revert to "Not Marked"
bootstrapRouter.delete('/attendance/today', authorize('admin'), clearTodayAttendance);
