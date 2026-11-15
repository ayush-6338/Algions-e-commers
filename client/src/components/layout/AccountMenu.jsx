import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useClickOutside from '../../hooks/useClickOutside.js';
import { ChevronIcon } from './Icons.jsx';

export default function AccountMenu() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  useEffect(() => { close(); }, [location.pathname, location.search, close]);
  useEffect(() => {
    if (!open) return undefined;
    rootRef.current?.querySelector('[role="menuitem"]')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); triggerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  if (loading) return <span aria-label="Loading account" className="hidden h-9 w-32 animate-pulse rounded-full bg-stone-100 md:block" />;
  if (!user) return <div className="hidden items-center gap-3 md:flex">
    <Link to="/login" className="whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium text-stone-900 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Sign in</Link>
    <Link to="/register" className="whitespace-nowrap rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Sign up</Link>
  </div>;

  const firstName = user.name.trim().split(/\s+/)[0] || 'Account';
  async function signOut() { logout(); close(); navigate('/', { replace: true }); }
  const itemClass = 'block w-full rounded-md px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';
  return <div ref={rootRef} className="relative hidden md:block">
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700">{firstName[0].toUpperCase()}</span><span className="max-w-28 truncate">{firstName}</span><ChevronIcon />
    </button>
    {open && <div id="account-menu" role="menu" aria-label="Account" className="absolute right-0 top-full z-[70] mt-2 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-md">
      <Link role="menuitem" tabIndex={0} to="/orders" onClick={close} className={itemClass}>My Orders</Link>
      <Link role="menuitem" tabIndex={0} to="/profile" onClick={close} className={itemClass}>Profile &amp; Addresses</Link>
      {user.role === 'admin' && <Link role="menuitem" tabIndex={0} to="/admin" onClick={close} className={itemClass}>Admin Dashboard</Link>}
      <div role="separator" className="my-1 border-t border-stone-200" />
      <button role="menuitem" type="button" onClick={signOut} className={itemClass}>Logout</button>
    </div>}
  </div>;
}
