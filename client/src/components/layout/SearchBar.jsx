import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchIcon } from './Icons.jsx';

export default function SearchBar({ autoFocus = false, onNavigate, mobile = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState(() => new URLSearchParams(location.search).get('q') || '');
  useEffect(() => { setTerm(new URLSearchParams(location.search).get('q') || ''); }, [location.search]);
  function submit(event) {
    event.preventDefault();
    const query = term.trim();
    if (!query) return;
    navigate(`/shop?q=${encodeURIComponent(query)}`);
    onNavigate?.();
  }
  return <form onSubmit={submit} role="search" className={`relative ${mobile ? 'w-full' : 'w-full max-w-xl'}`}>
    <label className="sr-only" htmlFor={mobile ? 'mobile-product-search' : 'desktop-product-search'}>Search for products</label>
    <input id={mobile ? 'mobile-product-search' : 'desktop-product-search'} autoFocus={autoFocus} type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search for products" className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 py-2 pl-4 pr-12 text-sm text-stone-900 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" />
    <button type="submit" aria-label="Search" className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-stone-700 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><SearchIcon /></button>
  </form>;
}
