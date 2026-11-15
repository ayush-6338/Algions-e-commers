import { Link } from 'react-router-dom';
import { ErrorState, ProductCard, Skeleton } from '../catalogue/CatalogueComponents.jsx';

export default function ProductRow({ id, title, products = [], loading, error, onRetry, viewAll = '/shop', horizontal = false, extraAction = null }) {
  if (!loading && !error && !products.length) return null;
  return <section aria-labelledby={`${id}-title`} className="mt-14 rounded-3xl bg-stone-50 py-1">
    <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">SkyKart picks</p><h2 id={`${id}-title`} className="mt-2 text-2xl font-medium text-stone-900 sm:text-3xl">{title}</h2></div><div className="flex shrink-0 items-center gap-4">{extraAction}<Link to={viewAll} className="text-sm font-medium text-stone-800 underline decoration-sky-600 underline-offset-4 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">View all</Link></div></div>
    {loading ? <Skeleton count={horizontal ? 4 : 8} /> : error ? <ErrorState message={error} onRetry={onRetry} /> : <div className={horizontal ? 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] md:grid md:grid-cols-2 lg:grid-cols-4' : ''}>{horizontal ? products.map((product) => <div key={product._id} className="min-w-[78%] snap-start sm:min-w-[44%] md:min-w-0"><ProductCard product={product} /></div>) : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}</div>}
  </section>;
}
