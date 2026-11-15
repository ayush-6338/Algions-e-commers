import { Link } from 'react-router-dom';
import SafeImage from '../common/SafeImage.jsx';

export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);

export function Badge({ children, tone = 'stone' }) {
  const tones = { stone: 'bg-stone-100 text-stone-700', amber: 'bg-amber-100 text-amber-900', red: 'bg-red-100 text-red-800', teal: 'bg-teal-100 text-teal-900', sky: 'bg-sky-100 text-sky-900', green: 'bg-green-100 text-green-900', indigo: 'bg-indigo-100 text-indigo-900', violet: 'bg-violet-100 text-violet-900' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.stone}`}>{children}</span>;
}

export function ProductCard({ product }) {
  const out = product.totalStock <= 0;
  const image = product.images?.[0];
  return <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <Link to={`/products/${product.slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
      <div className="relative aspect-square overflow-hidden bg-[#e8e5dc]">
        <SafeImage src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        {out ? <span className="absolute left-3 top-3"><Badge tone="red">Out of stock</Badge></span> : product.totalStock <= 5 ? <span className="absolute left-3 top-3"><Badge tone="amber">Only {product.totalStock} left</Badge></span> : null}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-stone-500">{product.category?.name}</p>
        <h2 className="mt-1 font-medium text-stone-900">{product.name}</h2>
        <p className="mt-2 text-xs text-stone-600" aria-label={`${product.ratingAverage || 0} out of 5 stars`}>★ {Number(product.ratingAverage || 0).toFixed(1)} <span className="text-stone-400">({product.ratingCount || 0})</span></p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2"><span className="font-semibold">{money(product.price)}</span>{product.compareAtPrice > product.price && <del className="text-sm text-stone-400">{money(product.compareAtPrice)}</del>}</div>
      </div>
    </Link>
  </article>;
}

export function ProductGrid({ products }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>;
}

export function FilterBar({ values, categories, onChange, onClear }) {
  return <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
    <label className="text-sm lg:col-span-2">Search products<input className="mt-1 w-full rounded-xl border border-stone-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" type="search" value={values.q} onChange={(event) => onChange('q', event.target.value)} placeholder="Try ‘lamp’ or ‘travel’" /></label>
    <label className="text-sm">Category<select className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" value={values.category} onChange={(event) => onChange('category', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}</select></label>
    <label className="text-sm">Sort by<select className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" value={values.sort} onChange={(event) => onChange('sort', event.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A to Z</option><option value="rating">Top rated</option></select></label>
    <div className="grid grid-cols-2 gap-2"><label className="text-sm">Min ₹<input className="mt-1 w-full rounded-xl border border-stone-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" type="number" min="0" value={values.minPrice} onChange={(event) => onChange('minPrice', event.target.value)} /></label><label className="text-sm">Max ₹<input className="mt-1 w-full rounded-xl border border-stone-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" type="number" min="0" value={values.maxPrice} onChange={(event) => onChange('maxPrice', event.target.value)} /></label></div>
    <div className="flex items-end justify-between gap-3 lg:col-span-6"><label className="inline-flex min-h-11 items-center gap-2 text-sm"><input className="h-4 w-4 accent-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" type="checkbox" checked={values.inStock} onChange={(event) => onChange('inStock', event.target.checked ? 'true' : '')} />In stock</label><button type="button" onClick={onClear} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">Clear filters</button></div>
  </div>;
}

export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
  const pages = Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => start + index);
  return <nav aria-label="Product pages" className="mt-9 flex flex-wrap items-center justify-center gap-2">
    <button type="button" disabled={!pagination.hasPrev} onClick={() => onPage(pagination.page - 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">Previous</button>
    {pages.map((page) => <button key={page} type="button" aria-current={page === pagination.page ? 'page' : undefined} onClick={() => onPage(page)} className={`h-10 min-w-10 rounded-lg border px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 ${page === pagination.page ? 'border-stone-900 bg-stone-900 text-white' : 'hover:bg-white'}`}>{page}</button>)}
    <button type="button" disabled={!pagination.hasNext} onClick={() => onPage(pagination.page + 1)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">Next</button>
  </nav>;
}

export function Skeleton({ count = 8, variant = 'products' }) {
  if (variant === 'panel') return <div role="status" aria-label="Loading" className="space-y-4">{Array.from({ length: count }, (_, index) => <div key={index} className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5"><div className="h-4 w-1/3 rounded bg-stone-200" /><div className="mt-4 h-3 w-2/3 rounded bg-stone-100" /><div className="mt-2 h-3 w-1/2 rounded bg-stone-100" /></div>)}</div>;
  return <div aria-label="Loading products" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: count }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-2xl bg-white"><div className="aspect-square bg-stone-200" /><div className="space-y-3 p-4"><div className="h-3 w-1/3 rounded bg-stone-200" /><div className="h-4 w-3/4 rounded bg-stone-200" /><div className="h-4 w-1/2 rounded bg-stone-200" /></div></div>)}</div>;
}

export function EmptyState({ title, message, onClear }) {
  return <section className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm"><h2 className="text-xl font-medium">{title}</h2><p className="mt-2 text-stone-600">{message}</p>{onClear && <button type="button" onClick={onClear} className="mt-5 rounded-xl bg-stone-900 px-5 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Clear filters</button>}</section>;
}

export function ErrorState({ message, onRetry }) {
  return <section role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-red-900"><p>{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl border border-red-300 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Retry</button></section>;
}

export function Breadcrumb({ items }) {
  return <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-500"><ol className="flex flex-wrap items-center gap-2">{items.map((item, index) => <li key={item.label} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.to ? <Link className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" to={item.to}>{item.label}</Link> : <span aria-current="page" className="text-stone-900">{item.label}</span>}</li>)}</ol></nav>;
}
