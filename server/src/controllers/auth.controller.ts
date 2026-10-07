import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const sign = (id: string) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'teacher']).default('teacher'),
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.active || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }
  res.json({
    token: sign(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export const me = asyncHandler(async (req, res) => {
  const u = req.user!;
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
});

// Admin-only: create teacher/admin accounts. The first admin comes from `npm run seed`.
export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await User.create(data);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
