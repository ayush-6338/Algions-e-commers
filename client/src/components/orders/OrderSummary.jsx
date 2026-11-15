import SafeImage from '../common/SafeImage.jsx';
import { Badge, money } from '../catalogue/CatalogueComponents.jsx';

export function StatusBadge({ status }) {
  const tones = { placed: 'sky', paid: 'teal', packed: 'indigo', shipped: 'violet', delivered: 'green', cancelled: 'stone' };
  return <Badge tone={tones[status] || 'stone'}>{status}</Badge>;
}

export function OrderItems({ items }) {
  return <ul className="divide-y divide-stone-200">{items.map((item, index) => <li key={`${item.product}-${index}`} className="flex gap-3 py-4 first:pt-0 last:pb-0"><SafeImage src={item.image} alt={item.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg border border-stone-200 object-cover" /><div className="min-w-0 flex-1"><p className="font-medium">{item.name}</p>{item.variantLabel && <p className="mt-1 text-xs text-stone-500">{item.variantLabel}</p>}<p className="mt-1 text-sm text-stone-600">Qty {item.quantity} · {money(item.unitPrice)} each</p></div><p className="whitespace-nowrap text-sm font-semibold">{money(item.lineTotal)}</p></li>)}</ul>;
}

export function PriceBreakdown({ pricing = {} }) {
  return <dl className="space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(pricing.subtotal)}</dd></div><div className="flex justify-between"><dt>Discount</dt><dd>{pricing.discount ? `−${money(pricing.discount)}` : money(0)}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{money(pricing.tax)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{pricing.shipping ? money(pricing.shipping) : 'Free'}</dd></div><div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold"><dt>Total</dt><dd>{money(pricing.total)}</dd></div></dl>;
}

export function ShippingAddress({ address }) {
  if (!address) return null;
  return <address className="not-italic text-sm leading-6 text-stone-600"><span className="font-medium text-stone-900">{address.fullName}</span><br />{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</address>;
}

export function orderDate(date) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)); }
