import { Router } from 'express';
import { importLocalStorage } from '../controllers/bootstrap.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const bootstrapRouter = Router();
bootstrapRouter.use(authenticate);
bootstrapRouter.post('/local-storage', importLocalStorage);
