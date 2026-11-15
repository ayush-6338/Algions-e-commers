import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCategories } from '../../services/productService.js';
import useScrollPosition from '../../hooks/useScrollPosition.js';
import AccountMenu from './AccountMenu.jsx';
import AnnouncementBar from './AnnouncementBar.jsx';
import CartButton from './CartButton.jsx';
import CategoryStrip from './CategoryStrip.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import SearchBar from './SearchBar.jsx';
import { MenuIcon, SearchIcon } from './Icons.jsx';

export default function Navbar() {
  const scrolled = useScrollPosition(10);
  const location = useLocation();
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getCategories().then((rows) => { if (active) setCategories(rows); })
      .catch(() => { if (active) setCategories([]); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { setDrawerOpen(false); setMobileSearchOpen(false); }, [location.pathname, location.search]);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return <>
    {!announcementDismissed && <AnnouncementBar hidden={false} onDismiss={() => setAnnouncementDismissed(true)} />}
    <header className="sticky top-0 z-50 bg-white">
      <div className={`border-b border-stone-200 bg-white transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[40px_1fr_auto] items-center gap-2 px-4 sm:px-6 md:grid-cols-[auto_minmax(160px,1fr)_auto] lg:px-8">
          <div className="flex items-center md:justify-start">
            <button type="button" aria-label="Open navigation menu" aria-expanded={drawerOpen} aria-controls="mobile-navigation" onClick={() => setDrawerOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-900 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:hidden"><MenuIcon /></button>
            <Link to="/" className="hidden text-xl font-semibold tracking-tight text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:inline">SkyKart<span className="text-sky-600">.</span></Link>
          </div>
          <Link to="/" className="justify-self-center text-xl font-semibold tracking-tight text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:hidden">SkyKart<span className="text-sky-600">.</span></Link>
          <div className="hidden justify-self-center md:block md:w-full"><SearchBar /></div>
          <nav aria-label="Main" className="flex items-center justify-end gap-1 sm:gap-3">
            <Link to="/shop" className="hidden rounded-md px-2 py-2 text-sm font-medium text-stone-900 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:inline">Shop</Link>
            <AccountMenu />
            <button type="button" aria-label={mobileSearchOpen ? 'Close search' : 'Open search'} aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-900 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 md:hidden"><SearchIcon /></button>
            <CartButton />
          </nav>
        </div>
        {mobileSearchOpen && <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden"><SearchBar mobile autoFocus /></div>}
      </div>
      <CategoryStrip categories={categories} loading={categoriesLoading} />
    </header>
    <MobileDrawer open={drawerOpen} categories={categories} onClose={closeDrawer} />
  </>;
}
