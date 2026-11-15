import { describe, expect, test } from '@jest/globals';
import { calculateTotals } from '../services/pricing.js';
import { assertTransition } from '../services/orderState.js';

describe('server pricing', () => {
  test('computes subtotal, percent coupon, tax, shipping and total', () => {
    expect(calculateTotals([{ unitPrice: 20, quantity: 2 }], { active: true, type: 'percent', value: 10, minimumSubtotal: 0 })).toEqual({ subtotal: 40, discount: 4, tax: 1.8, shipping: 49, total: 86.8 });
  });
  test('does not apply a coupon below its minimum', () => {
    expect(calculateTotals([{ unitPrice: 10, quantity: 1 }], { active: true, type: 'fixed', value: 5, minimumSubtotal: 25 }).discount).toBe(0);
  });
});

describe('order state machine', () => {
  test('rejects invalid transitions with a clear conflict error', () => {
    expect(() => assertTransition('placed', 'shipped')).toThrow('Order cannot transition from placed to shipped');
    try { assertTransition('placed', 'shipped'); } catch (error) { expect(error.message).toBe('Order cannot transition from placed to shipped'); expect(error.code).toBe('INVALID_STATE_TRANSITION'); }
  });
});
