import { asyncHandler } from '../utils/asyncHandler.js';
import * as addresses from '../services/addressService.js';
import * as orders from '../services/orderService.js';

export const listAddresses = asyncHandler(async (req, res) => res.json({ success: true, data: await addresses.listAddresses(req.user._id) }));
export const addAddress = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await addresses.addAddress(req.user._id, req.body) }));
export const updateAddress = asyncHandler(async (req, res) => res.json({ success: true, data: await addresses.updateAddress(req.user._id, req.params.id, req.body) }));
export const deleteAddress = asyncHandler(async (req, res) => res.json({ success: true, data: await addresses.deleteAddress(req.user._id, req.params.id) }));
export const setDefaultAddress = asyncHandler(async (req, res) => res.json({ success: true, data: await addresses.setDefaultAddress(req.user._id, req.params.id) }));

export const checkout = asyncHandler(async (req, res) => {
  const result = await orders.checkout({ userId: req.user._id, body: req.body, key: req.get('Idempotency-Key'), res });
  return res.status(result.replayed ? 200 : 201).json({ success: true, data: { order: result.order } });
});
export const retryPayment = asyncHandler(async (req, res) => {
  const order = await orders.retryPayment({ userId: req.user._id, orderId: req.params.id, key: req.get('Idempotency-Key'), simulateFailure: req.body.simulateFailure, res });
  return res.json({ success: true, data: { order } });
});
export const listOrders = asyncHandler(async (req, res) => res.json({ success: true, data: await orders.listOrders(req.user._id, req.query) }));
export const getOrder = asyncHandler(async (req, res) => res.json({ success: true, data: await orders.getOrder(req.user._id, req.params.id) }));
export const cancelOrder = asyncHandler(async (req, res) => res.json({ success: true, data: { order: await orders.cancelOrder({ userId: req.user._id, orderId: req.params.id, reason: req.body.reason }) } }));
