import { Link } from 'react-router-dom';

const actions = [
  { title: 'My Orders', description: 'See order updates and history.', to: '/orders', icon: 'box' },
  { title: 'Cart', description: 'Your shopping list is ready.', to: '/cart', icon: 'cart' },
  { title: 'Profile & Addresses', description: 'Manage your account details.', to: '/profile', icon: 'user' },
  { title: 'Continue shopping', description: 'Browse everyday essentials.', to: '/shop', icon: 'bag' },
];

function ActionIcon({ type }) {
  const paths = {
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
    cart: <><path d="M3 4h2l2 12h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-sky-700">{paths[type]}</svg>;
}

export default function QuickActions() {
  return <section aria-labelledby="quick-actions-title" className="mt-8">
    <h2 id="quick-actions-title" className="mb-4 text-xl font-medium text-stone-900">Quick actions</h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{actions.map((action) => <Link key={action.to} to={action.to} className="flex min-h-32 items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 hover:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50"><ActionIcon type={action.icon} /></span><span><span className="block font-medium text-stone-900">{action.title}</span><span className="mt-1 block text-sm leading-5 text-stone-600">{action.description}</span></span></Link>)}</div>
  </section>;
}
