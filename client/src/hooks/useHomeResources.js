import { useCallback, useEffect, useState } from 'react';
import { getBestSellers, getCategories, getFeatured, getNewArrivals } from '../services/productService.js';

const loaders = { categories: getCategories, featured: getFeatured, newArrivals: getNewArrivals, bestSellers: getBestSellers };
const emptyResource = () => ({ data: [], loading: false, error: '' });

export default function useHomeResources(keys) {
  const keyList = keys.join('|');
  const [resources, setResources] = useState(() => Object.fromEntries(Object.keys(loaders).map((key) => [key, emptyResource()])));
  const load = useCallback(async (requestedKeys) => {
    setResources((previous) => ({ ...previous, ...Object.fromEntries(requestedKeys.map((key) => [key, { ...previous[key], loading: true, error: '' }])) }));
    const results = await Promise.allSettled(requestedKeys.map((key) => loaders[key]()));
    setResources((previous) => {
      const next = { ...previous };
      results.forEach((result, index) => {
        const key = requestedKeys[index];
        next[key] = result.status === 'fulfilled'
          ? { data: result.value, loading: false, error: '' }
          : { data: [], loading: false, error: result.reason?.response?.data?.message || 'Could not load this section.' };
      });
      return next;
    });
  }, []);

  useEffect(() => { load(keyList.split('|')); }, [keyList, load]);
  const retry = useCallback((key) => load([key]), [load]);
  return { resources, retry };
}
