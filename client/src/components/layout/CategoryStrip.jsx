import { Link, useSearchParams } from 'react-router-dom';

export default function CategoryStrip({ categories, loading, onSelect }) {
  const [params] = useSearchParams();
  if (loading) return <div aria-label="Loading categories" className="border-b border-stone-200 bg-white"><div className="mx-auto flex h-11 max-w-7xl items-center gap-7 overflow-hidden px-4 sm:px-6 lg:px-8">{[1, 2, 3, 4, 5].map((item) => <span key={item} className="h-3 w-16 shrink-0 animate-pulse rounded bg-stone-200" />)}</div></div>;
  if (!categories?.length) return null;
  const active = params.get('category') || '';
  const linkClass = (selected) => `whitespace-nowrap border-b-2 px-1 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${selected ? 'border-sky-600 font-medium text-sky-600' : 'border-transparent text-stone-700 hover:text-sky-600'}`;
  return <nav aria-label="Categories" className="border-b border-stone-200 bg-white">
    <div className="mx-auto flex h-11 max-w-7xl items-stretch gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-8">
      <Link to="/shop" onClick={onSelect} className={linkClass(!active)}>All</Link>
      {categories.map((category) => <Link key={category._id} to={`/shop?category=${encodeURIComponent(category.slug)}`} onClick={onSelect} aria-current={active === category.slug ? 'page' : undefined} className={linkClass(active === category.slug)}>{category.name}</Link>)}
    </div>
  </nav>;
}
