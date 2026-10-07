import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { protect, restrictTo } from '../middleware/auth';

const r = Router();
r.post('/login', login);
r.get('/me', protect, me);
r.post('/register', protect, restrictTo('admin'), register);
export default r;
