import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../database/models/User.js';
import { AppError } from '../middleware/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const tokenFor = (user) => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
const response = (res, user, status = 200) => res.status(status).json({ success: true, data: { user: safeUser(user), token: tokenFor(user) } });
const genericResetMessage = 'If an account exists for that email, a password reset link has been sent.';

export const register = asyncHandler(async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  try {
    const user = await User.create({ name: req.body.name, email: req.body.email, passwordHash });
    response(res, user, 201);
  } catch (error) {
    if (error.code === 11000) throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  response(res, user);
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, data: safeUser(req.user) }));

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const resetUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/reset-password/${token}`;
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: user.email, subject: 'Reset your SkyKart password', text: `Reset your password within 15 minutes: ${resetUrl}` });
    } else {
      console.info(`Password reset link for ${user.email}: ${resetUrl}`);
    }
  }
  res.json({ success: true, message: genericResetMessage });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } }).select('+passwordResetTokenHash +passwordResetExpires');
  if (!user) throw new AppError('This password reset link is invalid or has expired', 400, 'RESET_TOKEN_INVALID');
  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful. You can now sign in.' });
});
