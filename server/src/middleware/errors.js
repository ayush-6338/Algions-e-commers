export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST', details) { super(message); this.status = status; this.code = code; this.details = details; }
}
export function notFound(req, res, next) { next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND')); }
export function errorHandler(err, req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  const message = err.code === 11000 ? 'A record with that value already exists' : err.message || 'Internal server error';
  res.status(status).json({ success: false, message: status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message, code: err.code || 'INTERNAL_ERROR', details: err.details });
}
