import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import SearchBar from './SearchBar.jsx';
import { CloseIcon } from './Icons.jsx';

export default function MobileDrawer({ open, categories, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('button, input, a')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const nodes = [...(dialogRef.current?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])') || [])];
      if (!nodes.length) return;
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  function signOut() { logout(); onClose(); navigate('/', { replace: true }); }
  const linkClass = 'block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';
  return <div className="fixed inset-0 z-[100] md:hidden" role="presentation">
    <button type="button" aria-label="Close navigation drawer" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/50" />
    <aside id="mobile-navigation" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Mobile navigation" className="absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col overflow-y-auto bg-white p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between"><Link to="/" onClick={onClose} className="text-xl font-semibold">SkyKart<span className="text-sky-600">.</span></Link><button type="button" onClick={onClose} aria-label="Close menu" className="rounded-full p-2 text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><CloseIcon /></button></div>
      <SearchBar mobile onNavigate={onClose} />
      <nav aria-label="Mobile main" className="mt-5"><Link to="/shop" onClick={onClose} className={linkClass}>Shop all</Link>{categories.map((category) => <Link key={category._id} to={`/shop?category=${encodeURIComponent(category.slug)}`} onClick={onClose} className={linkClass}>{category.name}</Link>)}</nav>
      <div className="my-4 border-t border-stone-200" />
      <nav aria-label="Mobile account" className="space-y-1">
        {user ? <><Link to="/orders" onClick={onClose} className={linkClass}>My Orders</Link><Link to="/profile" onClick={onClose} className={linkClass}>Profile &amp; Addresses</Link>{user.role === 'admin' && <Link to="/admin" onClick={onClose} className={linkClass}>Admin Dashboard</Link>}<button type="button" onClick={signOut} className={`${linkClass} w-full text-left`}>Logout</button></> : <><Link to="/login" onClick={onClose} className={linkClass}>Sign in</Link><Link to="/register" onClick={onClose} className={linkClass}>Sign up</Link></>}
      </nav>
    </aside>
  </div>;
}
