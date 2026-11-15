import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  return <div className="min-h-screen bg-stone-50 text-stone-900">
    <a href="#main-content" className="fixed left-3 top-3 z-[120] -translate-y-20 rounded-lg bg-white px-4 py-2 font-medium text-stone-900 shadow focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Skip to main content</a>
    <Navbar />
    <main id="main-content" tabIndex="-1" className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-8"><Outlet /></main>
    <Footer />
  </div>;
}
