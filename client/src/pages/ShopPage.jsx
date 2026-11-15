import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce.js';
import { getCategories, getProducts } from '../services/productService.js';
import { EmptyState, ErrorState, FilterBar, Pagination, ProductGrid, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';

function getValues(params) {
  return {
    q: params.get('q') || '', category: params.get('category') || '',
    sort: params.get('sort') || 'newest', minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '', inStock: params.get('inStock') === 'true',
  };
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ products: [], pagination: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  const debouncedSearch = useDebounce(searchDraft, 400);
  const values = useMemo(() => getValues(searchParams), [searchParams]);
  const queryQ = searchParams.get('q') || '';
  const paramsRef = useRef(searchParams);
  useEffect(() => { paramsRef.current = searchParams; }, [searchParams]);
  const queryString = searchParams.toString();

  useEffect(() => { setSearchDraft(queryQ); }, [queryQ]);
  useEffect(() => {
    const current = paramsRef.current;
    if (debouncedSearch === (current.get('q') || '')) return;
    const next = new URLSearchParams(current);
    debouncedSearch ? next.set('q', debouncedSearch) : next.delete('q');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  useEffect(() => {
    let active = true;
    getCategories().then((data) => { if (active) setCategories(data); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    let active = true;
    setResult((previous) => ({ ...previous, loading: true, error: '' }));
    getProducts(Object.fromEntries(new URLSearchParams(queryString).entries()))
      .then((response) => { if (active) setResult({ products: response.data, pagination: response.pagination, loading: false, error: '' }); })
      .catch((error) => { if (active) setResult((previous) => ({ ...previous, loading: false, error: error.response?.data?.message || 'Could not load products.' })); });
    return () => { active = false; };
  }, [queryString, retry]);

  const updateFilter = useCallback((key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value !== '' && value !== false) next.set(key, String(value));
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);
  const clearFilters = useCallback(() => { setSearchDraft(''); setSearchParams({}); }, [setSearchParams]);
  const setPage = useCallback((page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  return <>
    <section className="mb-9 rounded-3xl bg-[#e9e9de] px-6 py-11 md:px-14 md:py-16">
      <p className="mb-3 text-xs uppercase tracking-[.24em] text-teal-800">Objects with purpose</p>
      <h1 className="max-w-xl text-4xl font-medium leading-tight tracking-tight md:text-6xl">Small upgrades for the everyday.</h1>
      <p className="mt-4 max-w-lg text-stone-600">Thoughtful essentials, chosen to make daily rituals a little better.</p>
    </section>
    <section aria-label="Shop products">
      <FilterBar values={{ ...values, q: searchDraft }} categories={categories} onChange={(key, value) => key === 'q' ? setSearchDraft(value) : updateFilter(key, value)} onClear={clearFilters} />
      <p className="sr-only" aria-live="polite" aria-atomic="true">{result.loading ? 'Loading products' : `${result.pagination?.total || 0} products found`}</p>
      <div className="mt-6">
        {result.loading ? <Skeleton /> : result.error ? <ErrorState message={result.error} onRetry={() => setRetry((value) => value + 1)} /> : result.products.length ? <><ProductGrid products={result.products} /><Pagination pagination={result.pagination} onPage={setPage} /></> : <EmptyState title="No products match your filters" message="Try adjusting your search or clearing some filters." onClear={clearFilters} />}
      </div>
    </section>
  </>;
}
