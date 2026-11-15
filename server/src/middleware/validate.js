import { AppError } from './errors.js';
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true, convert: true });
    if (error) return next(new AppError('Input validation failed', 400, 'VALIDATION_ERROR', error.details.map(({ message, path }) => ({ message, path }))));
    req[source] = value;
    next();
  };
}
