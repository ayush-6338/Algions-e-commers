import { Link } from 'react-router-dom';
import { ErrorState } from '../catalogue/CatalogueComponents.jsx';
import SafeImage from '../common/SafeImage.jsx';

export default function CategoryTiles({ categories = [], loading, error, onRetry }) {
  if (!loading && !error && !categories.length) return null;
  return <section aria-labelledby="category-tiles-title" className="mt-14">
    <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Find your next favourite</p><h2 id="category-tiles-title" className="mt-2 text-2xl font-medium text-stone-900 sm:text-3xl">Shop by category</h2></div></div>
    {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[3/2] animate-pulse rounded-2xl bg-stone-200" />)}</div> : error ? <ErrorState message={error} onRetry={onRetry} /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.map((category) => <Link key={category._id} to={`/shop?category=${encodeURIComponent(category.slug)}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><div className="aspect-[3/2] overflow-hidden bg-stone-100"><SafeImage src={category.image} alt={category.name} width={600} height={400} className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" /></div><h3 className="px-3 py-3 text-sm font-medium text-stone-900">{category.name}</h3></Link>)}</div>}
  </section>;
}
