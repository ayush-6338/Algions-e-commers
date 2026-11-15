import { Link } from 'react-router-dom';
import SafeImage from '../common/SafeImage.jsx';
export default function HeroSection({ featured = [] }) {
  return <section aria-labelledby="home-hero-title" className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10 lg:p-12">
    <div className="py-3 lg:py-8">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-sky-700">Objects with purpose</p>
      <h1 id="home-hero-title" className="mt-4 max-w-xl text-4xl font-medium leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">Small upgrades for the everyday.</h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-stone-600">Thoughtful essentials for home, work and everything in between. Find a little more ease in your everyday routines.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link to="/shop" className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Shop now</Link><Link to="/register" className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-900 hover:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Create account</Link></div>
    </div>
    <div aria-label="Featured products" className="mt-7 grid grid-cols-2 gap-3 lg:mt-0 lg:gap-4">{[0, 1, 2, 3].map((index) => { const product = featured[index]; return <Link key={index} to={product ? `/products/${product.slug}` : '/shop'} aria-label={product ? `View ${product.name}` : 'Shop featured products'} className="group aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><SafeImage src={`/images/hero/hero-${index + 1}.svg`} alt="" loading="eager" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" /></Link>; })}</div>
  </section>;
}
