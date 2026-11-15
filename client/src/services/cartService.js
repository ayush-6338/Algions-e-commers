import api from './api.js';

const unwrap = async (request) => (await request).data.data;
export const getCart = () => unwrap(api.get('/cart'));
export const addCartItem = (item) => unwrap(api.post('/cart/items', item));
export const updateCartItem = ({ productId, variantId, quantity }) => unwrap(api.patch(`/cart/items/${productId}/${variantId || 'base'}`, { quantity }));
export const removeCartItem = ({ productId, variantId }) => unwrap(api.delete(`/cart/items/${productId}/${variantId || 'base'}`));
export const applyCartCoupon = (code) => unwrap(api.post('/cart/coupon', { code }));
export const removeCartCoupon = () => unwrap(api.delete('/cart/coupon'));
