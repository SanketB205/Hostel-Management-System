import { Router } from 'express';
import {
  bulkCreateRooms,
  createBlock,
  createFloor,
  createRoom,
  getRoomStudents,
  listBlocks,
  listRooms,
  getBlockDetails,
} from '../controllers/hostel.controller.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

export const hostelRouter = Router();

hostelRouter.use(authenticate);

// blocks
hostelRouter.get('/blocks', listBlocks);
hostelRouter.get('/blocks/:blockId', getBlockDetails);
hostelRouter.post('/blocks', authorize('admin'), createBlock);
hostelRouter.post('/blocks/:blockId/floors', authorize('admin'), createFloor);

// rooms
hostelRouter.get('/rooms', listRooms);
hostelRouter.post('/floors/:floorId/rooms', authorize('admin'), createRoom);
hostelRouter.post('/rooms/bulk', authorize('admin'), bulkCreateRooms);
hostelRouter.get('/rooms/:roomId/students', getRoomStudents);
