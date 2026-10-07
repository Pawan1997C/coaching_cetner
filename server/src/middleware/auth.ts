import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { env } from '../config/env';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const protect: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Not authenticated');
  let payload: { id: string };
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { id: string };
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new ApiError(401, 'Account not found or disabled');
  req.user = user;
  next();
});

export const restrictTo =
  (...roles: Array<'admin' | 'teacher'>): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role as 'admin' | 'teacher')) {
      return next(new ApiError(403, 'You do not have permission to do this'));
    }
    next();
  };
