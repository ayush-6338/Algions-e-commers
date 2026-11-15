import Joi from 'joi';

export const passwordSchema = Joi.string().min(8).max(100).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain at least one letter and one number' });
export const registerSchema = Joi.object({ name: Joi.string().trim().min(2).max(100).required(), email: Joi.string().trim().email().lowercase().required(), password: passwordSchema });
export const loginSchema = Joi.object({ email: Joi.string().trim().email().lowercase().required(), password: Joi.string().required() });
export const forgotPasswordSchema = Joi.object({ email: Joi.string().trim().email().lowercase().required() });
export const resetPasswordSchema = Joi.object({ password: passwordSchema });
export const addressSchema = Joi.object({ label: Joi.string().trim().max(40).default('Home'), fullName: Joi.string().trim().min(2).max(100).required(), phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number' }), line1: Joi.string().trim().min(3).max(150).required(), line2: Joi.string().trim().allow('').max(150).default(''), city: Joi.string().trim().min(2).max(80).required(), state: Joi.string().trim().min(2).max(80).required(), pincode: Joi.string().pattern(/^\d{6}$/).required().messages({ 'string.pattern.base': 'Pincode must contain exactly 6 digits' }), country: Joi.string().trim().default('India'), isDefault: Joi.boolean() });
export const productSchema = Joi.object({ name: Joi.string().min(2).required(), slug: Joi.string().min(2).required(), description: Joi.string().allow(''), category: Joi.string().required(), price: Joi.number().min(0).required(), compareAtPrice: Joi.number().min(0), images: Joi.array().items(Joi.string()), stock: Joi.number().integer().min(0), variants: Joi.array().items(Joi.object({ sku: Joi.string().required(), options: Joi.object(), price: Joi.number().min(0), stock: Joi.number().integer().min(0) })) });
export const cartItemSchema = Joi.object({ productId: Joi.string().required(), variantId: Joi.string().allow(null, ''), quantity: Joi.number().integer().min(1).max(100).required() });
export const checkoutSchema = Joi.object({ addressId: Joi.string().pattern(/^[a-f\d]{24}$/i).required(), paymentMethod: Joi.string().valid('card_sandbox', 'upi_sandbox', 'cod').required(), couponCode: Joi.string().trim().uppercase().max(40).allow(''), simulateFailure: Joi.boolean().default(false) });
export const paymentRetrySchema = Joi.object({ simulateFailure: Joi.boolean().default(false) });
export const cancelOrderSchema = Joi.object({ reason: Joi.string().trim().max(300).allow('').default('') });
export const orderListSchema = Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(50).default(10), status: Joi.string().valid('placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled') });
export const statusSchema = Joi.object({ status: Joi.string().valid('paid', 'packed', 'shipped', 'delivered', 'cancelled').required(), note: Joi.string().max(300) });
export const categorySchema = Joi.object({ name: Joi.string().min(2).max(80).required(), slug: Joi.string().min(2).max(100).required(), description: Joi.string().max(500).allow(''), active: Joi.boolean() });
export const productPatchSchema = productSchema.fork(['name', 'slug', 'category', 'price'], (schema) => schema.optional()).min(1);
export const profileSchema = Joi.object({ name: Joi.string().min(2).max(100).required() });
export const quantitySchema = Joi.object({ quantity: Joi.number().integer().min(1).max(100).required() });
export const couponSchema = Joi.object({ code: Joi.string().min(2).max(40).required() });
export const productQuerySchema = Joi.object({
  q: Joi.string().trim().max(120).allow(''),
  category: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice', { adjust: (value) => value ?? 0 })),
  inStock: Joi.boolean(),
  featured: Joi.boolean(),
  sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'name_asc', 'rating', 'bestselling').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(48).default(12),
}).messages({
  'number.base': 'Price, page, and limit filters must be valid numbers',
  'number.min': 'Prices must be non-negative and maxPrice must be at least minPrice',
  'number.max': 'limit must be 48 or less',
  'any.only': 'sort must be newest, price_asc, price_desc, name_asc, rating, or bestselling',
});
export const productIdsSchema = Joi.object({ ids: Joi.string().required().custom((value, helpers) => {
  const ids = value.split(',');
  if (ids.length > 12) return helpers.error('ids.tooMany');
  if (ids.some((id) => !/^[a-f\d]{24}$/i.test(id))) return helpers.error('ids.invalid');
  return value;
}).messages({
  'ids.tooMany': 'ids must contain no more than 12 product IDs',
  'ids.invalid': 'ids must be comma-separated valid 24-character ObjectIds',
}) });
