import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as cartApi from '../services/cartService.js';

const CartContext = createContext(null);
const emptyCart = { items: [], couponCode: undefined, totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 } };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const refreshCart = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!user?.id) { setCart(emptyCart); setLoadedUserId(null); setError(''); setLoading(false); return emptyCart; }
    setLoading(true);
    try { const next = await cartApi.getCart(); if (version === requestVersion.current) { setCart(next); setLoadedUserId(user.id); setError(''); } return next; }
    catch (requestError) { if (version === requestVersion.current) { setCart(emptyCart); setError(requestError.response?.data?.message || 'Could not load your cart.'); } throw requestError; }
    finally { if (version === requestVersion.current) { setLoadedUserId(user.id); setLoading(false); } }
  }, [user?.id]);
  useEffect(() => { refreshCart().catch(() => {}); }, [refreshCart]);
  const mutateCart = useCallback(async (request) => {
    try {
      const next = await request;
      setCart(next);
      setError('');
      return next;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update your cart.');
      throw requestError;
    }
  }, []);
  const addItem = useCallback((item) => mutateCart(cartApi.addCartItem(item)), [mutateCart]);
  const updateItem = useCallback((item) => mutateCart(cartApi.updateCartItem(item)), [mutateCart]);
  const removeItem = useCallback((item) => mutateCart(cartApi.removeCartItem(item)), [mutateCart]);
  const applyCoupon = useCallback((code) => mutateCart(cartApi.applyCartCoupon(code)), [mutateCart]);
  const clearCoupon = useCallback(() => mutateCart(cartApi.removeCartCoupon()), [mutateCart]);
  const visibleCart = user?.id && loadedUserId === user.id ? cart : emptyCart;
  const itemCount = visibleCart.items.reduce((total, item) => total + item.quantity, 0);
  const isLoading = loading || Boolean(user?.id && loadedUserId !== user.id);
  const value = useMemo(() => ({ cart: visibleCart, itemCount, loading: isLoading, error, refreshCart, addItem, updateItem, removeItem, applyCoupon, clearCoupon }), [visibleCart, itemCount, isLoading, error, refreshCart, addItem, updateItem, removeItem, applyCoupon, clearCoupon]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { return useContext(CartContext); }
