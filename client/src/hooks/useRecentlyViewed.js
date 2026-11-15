import { useCallback, useEffect, useRef, useState } from 'react';

function storageKey(userId) { return userId ? `skykart:recent:${userId}` : null; }

function readHistory(key) {
  if (!key) return { ids: [], lastCategorySlug: '' };
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      ids: Array.isArray(saved.ids) ? saved.ids.filter((id) => typeof id === 'string').slice(0, 8) : [],
      lastCategorySlug: typeof saved.lastCategorySlug === 'string' ? saved.lastCategorySlug : '',
    };
  } catch {
    return { ids: [], lastCategorySlug: '' };
  }
}

export default function useRecentlyViewed(user) {
  const userId = user?.id || user?._id || '';
  const key = storageKey(userId);
  const [history, setHistory] = useState(() => readHistory(key));
  const historyRef = useRef(history);

  useEffect(() => {
    const next = readHistory(key);
    historyRef.current = next;
    setHistory(next);
  }, [key]);

  const addRecentlyViewed = useCallback((product) => {
    if (!key || !product?._id) return;
    const current = historyRef.current;
    const next = {
      ids: [String(product._id), ...current.ids.filter((id) => id !== String(product._id))].slice(0, 8),
      lastCategorySlug: product.category?.slug || current.lastCategorySlug,
    };
    historyRef.current = next;
    setHistory(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* Storage can be unavailable or full. */ }
  }, [key]);

  const clearRecentlyViewed = useCallback(() => {
    const next = { ids: [], lastCategorySlug: '' };
    historyRef.current = next;
    setHistory(next);
    if (key) {
      try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ }
    }
  }, [key]);

  return { ...history, addRecentlyViewed, clearRecentlyViewed };
}
