import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/productService.js';

export default function Footer() {
  const [categories, setCategories] = useState([]);
  useEffect(() => { let active = true; getCategories().then((rows) => { if (active) setCategories(rows.slice(0, 4)); }).catch(() => {}); return () => { active = false; }; }, []);
  const linkClass = 'block w-fit rounded-sm text-sm text-stone-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';
  return <footer className="bg-stone-900 text-stone-100">
    <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      <section><Link to="/" className="text-xl font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">SkyKart<span className="text-sky-600">.</span></Link><p className="mt-3 max-w-xs text-sm leading-6 text-stone-300">Considered finds for everyday living.</p></section>
      <nav aria-label="Shop footer"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Shop</h2><div className="space-y-3"><Link to="/shop" className={linkClass}>All products</Link>{categories.map((category) => <Link key={category._id} to={`/shop?category=${encodeURIComponent(category.slug)}`} className={linkClass}>{category.name}</Link>)}</div></nav>
      <nav aria-label="Account footer"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Account</h2><div className="space-y-3"><Link to="/login" className={linkClass}>Sign in</Link><Link to="/orders" className={linkClass}>My Orders</Link><Link to="/profile" className={linkClass}>Profile</Link></div></nav>
      <nav aria-label="Help footer"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Help</h2><div className="space-y-3"><a href="#shipping" className={linkClass}>Shipping</a><a href="#returns" className={linkClass}>Returns</a><a href="#contact" className={linkClass}>Contact</a></div></nav>
    </div>
    <div className="border-t border-stone-700"><p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-stone-400 sm:px-6 lg:px-8">© 2026 SkyKart. Built as a demo project.</p></div>
  </footer>;
}
