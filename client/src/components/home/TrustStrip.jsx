const benefits = [
  ['truck', 'Free shipping above ₹999'], ['return', '7-day easy returns'], ['lock', 'Secure checkout'], ['support', 'Customer support'],
];

function TrustIcon({ name }) {
  const paths = {
    truck: <><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /></>,
    return: <><path d="M4 11a8 8 0 1 1 1 5M4 5v6h6" /><path d="M12 8v5l3 2" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 20c-1 1-2 1-4 1" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 shrink-0 text-sky-700">{paths[name]}</svg>;
}

export default function TrustStrip() {
  return <section aria-labelledby="trust-strip-title" className="mt-6 rounded-2xl border border-stone-200 bg-white"><h2 id="trust-strip-title" className="sr-only">Shopping benefits</h2><ul className="grid grid-cols-2 divide-stone-200 md:grid-cols-4 md:divide-x">{benefits.map(([icon, label], index) => <li key={icon} className={`flex min-h-16 items-center justify-center gap-2 px-3 py-3 text-center text-xs font-medium text-stone-800 sm:text-sm ${index % 2 === 0 ? 'border-r md:border-r-0' : ''} ${index > 1 ? 'border-t md:border-t-0' : ''}`}><TrustIcon name={icon} /><span>{label}</span></li>)}</ul></section>;
}
