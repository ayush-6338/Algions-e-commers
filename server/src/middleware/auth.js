import jwt from 'jsonwebtoken';
import { User } from '../../../database/models/index.js';
import { AppError } from './errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
});

export function requireRole(...roles) {
  return (req, _res, next) => req.user && roles.includes(req.user.role) ? next() : next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
}
