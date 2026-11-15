import { AppError } from '../middleware/errors.js';

const transitions = { placed: ['paid', 'cancelled'], paid: ['packed', 'cancelled'], packed: ['shipped'], shipped: ['delivered'], delivered: [], cancelled: [] };

export function canTransition(from, to) {
  return Boolean(transitions[from]?.includes(to));
}

export function transition(from, to) {
  if (!canTransition(from, to)) throw new AppError(`Order cannot transition from ${from} to ${to}`, 409, 'INVALID_STATE_TRANSITION', { from, to });
  return to;
}
