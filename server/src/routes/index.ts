import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import auth from './auth.routes';
import students from './students.routes';
import batches from './batches.routes';
import subjects from './subjects.routes';
import attendance from './attendance.routes';
import fees from './fees.routes';
import exams from './exams.routes';
import materials from './materials.routes';
import analytics from './analytics.routes';
import publicRoutes from './public.routes';
import site from './site.routes';
import courses from './courses.routes';
import faculty from './faculty.routes';
import reviews from './reviews.routes';
import enquiries from './enquiries.routes';

const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true }));
api.use('/public', publicRoutes); // website visitors: no login
api.use('/auth', auth); // login is public; other auth routes protect themselves

// Everything below requires a valid token.
api.use(protect);
api.use('/students', students);
api.use('/batches', batches);
api.use('/subjects', subjects);
api.use('/attendance', attendance);
api.use('/fees', fees);
api.use('/exams', exams);
api.use('/materials', materials);
api.use('/analytics', analytics);

// Website management is admin-only.
api.use('/site', restrictTo('admin'), site);
api.use('/courses', restrictTo('admin'), courses);
api.use('/faculty', restrictTo('admin'), faculty);
api.use('/reviews', restrictTo('admin'), reviews);
api.use('/enquiries', restrictTo('admin'), enquiries);

export default api;
