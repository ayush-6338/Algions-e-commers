const values = [
  ['Curated catalogue', 'A considered collection of useful things for everyday life.'],
  ['Honest pricing', 'Clear prices and product details, without surprises at checkout.'],
  ['Fast delivery', 'Free shipping on orders above ₹999, with simple order updates.'],
];

export default function ValueCards() {
  return <section aria-labelledby="why-skykart-title" className="mt-14 rounded-3xl bg-white py-8">
    <p className="text-center text-xs font-semibold uppercase tracking-[.2em] text-sky-700">A little more thought</p><h2 id="why-skykart-title" className="mt-2 text-center text-2xl font-medium text-stone-900 sm:text-3xl">Why SkyKart</h2>
    <div className="mt-6 grid gap-4 md:grid-cols-3">{values.map(([title, body], index) => <article key={title} className={`rounded-2xl border border-stone-200 p-5 ${index === 1 ? 'bg-stone-50' : 'bg-white'}`}><span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">0{index + 1}</span><h3 className="mt-4 font-medium text-stone-900">{title}</h3><p className="mt-2 text-sm leading-6 text-stone-600">{body}</p></article>)}</div>
  </section>;
}
