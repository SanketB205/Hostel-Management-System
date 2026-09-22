import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { allocationsRouter } from './routes/allocations.routes.js';
import { hostelRouter } from './routes/hostel.routes.js';
import { studentsRouter } from './routes/students.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { bootstrapRouter } from './routes/bootstrap.routes.js';
import { complaintsRouter } from './routes/complaints.routes.js';
import { departmentsRouter } from './routes/departments.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'hostelspace-api' }));
app.use('/api/auth', authRouter);
app.use('/api/hostel', hostelRouter);
app.use('/api/students', studentsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/bootstrap', bootstrapRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/departments', departmentsRouter);

app.use(notFound);
app.use(errorHandler);
