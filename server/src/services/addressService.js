import mongoose from 'mongoose';
import { Address, User } from '../../../database/models/index.js';
import { AppError } from '../middleware/errors.js';
import auditService from './auditService.js';

const missing = () => new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
const validId = (id) => mongoose.isValidObjectId(id);

async function runLocked(userId, callback) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      await User.updateOne({ _id: userId }, { $inc: { addressBookRevision: 1 } }, { session });
      return callback(session);
    });
  } finally { await session.endSession(); }
}

export async function listAddresses(userId) {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: 1 }).lean();
}

export async function addAddress(userId, input) {
  const address = await runLocked(userId, async (session) => {
    const count = await Address.countDocuments({ user: userId }).session(session);
    if (count >= 10) throw new AppError('You can save up to 10 addresses', 400, 'ADDRESS_LIMIT_REACHED');
    const makeDefault = count === 0 || input.isDefault === true;
    if (makeDefault) await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } }, { session });
    const [created] = await Address.create([{ ...input, user: userId, isDefault: makeDefault }], { session });
    return created;
  });
  await auditService.log({ actor: userId, action: 'address.created', entityType: 'Address', entityId: address._id });
  return address;
}

export async function updateAddress(userId, id, input) {
  if (!validId(id)) throw missing();
  const address = await runLocked(userId, async (session) => {
    const current = await Address.findOne({ _id: id, user: userId }).session(session);
    if (!current) throw missing();
    if (input.isDefault === true) await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } }, { session });
    const wasDefault = current.isDefault;
    Object.assign(current, input);
    await current.save({ session });
    if (wasDefault && input.isDefault === false) {
      const next = await Address.findOne({ user: userId, _id: { $ne: current._id } }).sort({ createdAt: 1 }).session(session);
      if (next) { next.isDefault = true; await next.save({ session }); }
    }
    return current;
  });
  await auditService.log({ actor: userId, action: 'address.updated', entityType: 'Address', entityId: address._id });
  return address;
}

export async function deleteAddress(userId, id) {
  if (!validId(id)) throw missing();
  const deleted = await runLocked(userId, async (session) => {
    const address = await Address.findOne({ _id: id, user: userId }).session(session);
    if (!address) throw missing();
    await address.deleteOne({ session });
    if (address.isDefault) {
      const next = await Address.findOne({ user: userId }).sort({ createdAt: 1 }).session(session);
      if (next) { next.isDefault = true; await next.save({ session }); }
    }
    return address;
  });
  await auditService.log({ actor: userId, action: 'address.deleted', entityType: 'Address', entityId: deleted._id });
  return { deleted: true };
}

export async function setDefaultAddress(userId, id) {
  if (!validId(id)) throw missing();
  const address = await runLocked(userId, async (session) => {
    const current = await Address.findOne({ _id: id, user: userId }).session(session);
    if (!current) throw missing();
    await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } }, { session });
    current.isDefault = true;
    await current.save({ session });
    return current;
  });
  await auditService.log({ actor: userId, action: 'address.default_changed', entityType: 'Address', entityId: address._id });
  return address;
}
