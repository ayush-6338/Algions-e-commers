import { AppError } from './errors.js';

export const authorize = (...roles) => (req, _res, next) => (
  req.user && roles.includes(req.user.role)
    ? next()
    : next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
);
