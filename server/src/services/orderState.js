export { canTransition, transition } from './orderStateMachine.js';
import { transition } from './orderStateMachine.js';
export function assertTransition(from, to) { transition(from, to); }
