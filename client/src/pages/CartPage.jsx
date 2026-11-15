import { Link } from 'react-router-dom';
import SafeImage from '../components/common/SafeImage.jsx';
import { EmptyState, ErrorState, money, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function CartPage() {
  const { cart, loading, error, refreshCart, updateItem, removeItem } = useCart();
  if (loading && !cart.items.length) return <Skeleton variant="panel" count={2} />;
  if (error && !cart.items.length) return <ErrorState message={error} onRetry={() => refreshCart().catch(() => {})} />;
  if (!cart.items.length) return <EmptyState title="Your cart is empty" message="Explore the collection and add something useful to your day." />;
  return <div className="space-y-7">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Your basket</p><h1 className="mt-2 text-3xl font-semibold">Shopping cart</h1></header>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Cart items" className="space-y-3">{cart.items.map((item) => <article key={`${item.product._id}-${item.variant?._id || 'base'}`} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:gap-5">
        <Link to={`/products/${item.product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:h-28 sm:w-28"><SafeImage src={item.product.images?.[0]} alt={item.product.name} width={120} height={120} className="h-full w-full object-cover" /></Link>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link to={`/products/${item.product.slug}`} className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{item.product.name}</Link>{item.variant?.label && <p className="mt-1 text-sm text-stone-600">{item.variant.label}</p>}</div><p className="font-semibold">{money(item.unitPrice * item.quantity)}</p></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-stone-600">Qty <select aria-label={`Quantity for ${item.product.name}`} value={item.quantity} onChange={(event) => updateItem({ productId: item.product._id, variantId: item.variant?._id, quantity: Number(event.target.value) }).catch(() => {})} className="min-h-10 rounded-lg border border-stone-300 bg-white px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{Array.from({ length: Math.min(100, Math.max(10, item.quantity)) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><button type="button" onClick={() => removeItem({ productId: item.product._id, variantId: item.variant?._id }).catch(() => {})} className="rounded-md px-2 py-1 text-sm text-stone-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Remove</button></div>
        </div>
      </article>)}</section>
      <aside aria-label="Cart summary" className="rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-28"><h2 className="text-lg font-semibold">Order summary</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(cart.totals.subtotal)}</dd></div>{cart.totals.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount</dt><dd>−{money(cart.totals.discount)}</dd></div>}<div className="flex justify-between"><dt>Tax</dt><dd>{money(cart.totals.tax)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{cart.totals.shipping ? money(cart.totals.shipping) : 'Free'}</dd></div><div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold"><dt>Total</dt><dd>{money(cart.totals.total)}</dd></div></dl><Link to="/checkout" className="mt-5 block rounded-full bg-stone-900 px-5 py-3 text-center text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Continue to checkout</Link><Link to="/shop" className="mt-3 block rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Continue shopping</Link></aside>
    </div>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>;
}
