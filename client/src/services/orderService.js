import api from './api.js';

const unwrap = async (request) => (await request).data.data;
export const checkout = (input, idempotencyKey) => unwrap(api.post('/orders/checkout', input, { headers: { 'Idempotency-Key': idempotencyKey } }));
export const getOrders = (params) => unwrap(api.get('/orders', { params }));
export const getOrder = (id) => unwrap(api.get(`/orders/${id}`));
export const retryOrderPayment = (id, input, idempotencyKey) => unwrap(api.post(`/orders/${id}/pay-retry`, input, { headers: { 'Idempotency-Key': idempotencyKey } }));
export const cancelOrder = (id, reason) => unwrap(api.post(`/orders/${id}/cancel`, { reason }));
