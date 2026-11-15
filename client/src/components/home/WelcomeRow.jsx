import { Link } from 'react-router-dom';

export default function WelcomeRow({ user }) {
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  return <section aria-labelledby="member-welcome-title" className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
    <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Your SkyKart home</p><h1 id="member-welcome-title" className="mt-2 text-3xl font-medium text-stone-900">Welcome back, {firstName}</h1><p className="mt-2 text-stone-600">Pick up where you left off or find something useful for today.</p></div>
    {user?.role === 'admin' && <Link to="/admin" className="inline-flex w-fit rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Go to Admin Dashboard</Link>}
  </section>;
}
