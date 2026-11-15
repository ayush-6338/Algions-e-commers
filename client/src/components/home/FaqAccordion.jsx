import { useState } from 'react';

const questions = [
  ['How long does shipping take?', 'Orders are prepared promptly. Delivery timing depends on your location and will be shown with your order updates.'],
  ['Can I return an item?', 'Yes. Eligible items can be returned within 7 days of delivery.'],
  ['Which payment methods are available?', 'This demo uses a simulated checkout outcome; it does not process real payments.'],
  ['Where can I track an order?', 'Sign in and visit My Orders to see order tracking information as it becomes available.'],
  ['Do I need an account to shop?', 'You can browse the catalogue without an account. An account will support faster checkout and order tracking.'],
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(-1);
  return <section aria-labelledby="faq-title" className="mt-14 rounded-3xl bg-stone-100 px-5 py-8 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Helpful details</p><h2 id="faq-title" className="mt-2 text-2xl font-medium text-stone-900 sm:text-3xl">Frequently asked questions</h2>
    <div className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">{questions.map(([question, answer], index) => {
      const expanded = openIndex === index; const panelId = `faq-answer-${index}`;
      return <article key={question} className="px-4 sm:px-5"><h3><button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpenIndex(expanded ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{question}<span aria-hidden="true" className="text-xl text-sky-700">{expanded ? '−' : '+'}</span></button></h3><div id={panelId} hidden={!expanded} className="pb-4 pr-8 text-sm leading-6 text-stone-600">{answer}</div></article>;
    })}</div>
  </section>;
}
