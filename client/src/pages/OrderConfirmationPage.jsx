import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import { OrderItems, PriceBreakdown, ShippingAddress, StatusBadge } from '../components/orders/OrderSummary.jsx';
import { getOrder, retryOrderPayment } from '../services/orderService.js';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = useRef(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOrder(await getOrder(id)); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not load your order confirmation.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  async function handleRetry() {
    setBusy(true); key.current ||= crypto.randomUUID();
    try { const result = await retryOrderPayment(id, { simulateFailure: false }, key.current); key.current = null; setOrder(result.order); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Payment retry failed.'); }
    finally { setBusy(false); }
  }
  if (loading) return <Skeleton variant="panel" count={2} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;
  const failed = order.paymentStatus === 'failed';
  const address = order.shippingAddress || (order.address ? { fullName: order.address.recipient, ...order.address, pincode: order.address.postalCode } : null);
  return <div className="mx-auto max-w-3xl space-y-6">
    <section aria-labelledby="confirmation-title" className="rounded-2xl border border-stone-200 bg-white p-6 text-center sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">{failed ? 'Payment needs attention' : 'Order received'}</p><h1 id="confirmation-title" className="mt-3 text-3xl font-semibold">{failed ? 'Your order is reserved' : 'Thank you for your order'}</h1><p className="mt-3 text-stone-600">Order <span className="font-semibold text-stone-900">{order.orderNumber}</span></p><div className="mt-4 flex justify-center"><StatusBadge status={order.status} /></div><p className={`mt-4 text-sm ${failed ? 'text-red-800' : 'text-stone-700'}`}>Payment status: <span className="font-semibold">{order.paymentStatus}</span>{failed && '. Your items remain reserved while you retry or cancel.'}</p>{failed && <button type="button" disabled={busy} onClick={handleRetry} className="mt-5 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50">{busy ? 'Processing…' : 'Retry payment'}</button>}</section>
    <section aria-label="Order contents" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><h2 className="mb-5 text-lg font-semibold">Order summary</h2><OrderItems items={order.items} /><div className="mt-5 border-t border-stone-200 pt-5"><PriceBreakdown pricing={order.pricing || order.totals} /></div></section>
    {address && <section aria-labelledby="confirmation-address" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><h2 id="confirmation-address" className="mb-3 font-semibold">Delivering to</h2><ShippingAddress address={address} /></section>}
    <div className="flex flex-wrap justify-center gap-3"><Link to={`/orders/${id}`} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">View order</Link><Link to="/shop" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Continue shopping</Link></div>
  </div>;
}
