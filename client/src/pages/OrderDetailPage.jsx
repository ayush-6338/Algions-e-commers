import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import ToastMessage from '../components/common/ToastMessage.jsx';
import { OrderItems, PriceBreakdown, ShippingAddress, StatusBadge, orderDate } from '../components/orders/OrderSummary.jsx';
import { cancelOrder, getOrder, retryOrderPayment } from '../services/orderService.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const paymentKey = useRef(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOrder(await getOrder(id)); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not load this order.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  async function retryPayment() {
    setActionBusy(true);
    paymentKey.current ||= crypto.randomUUID();
    try {
      const result = await retryOrderPayment(id, { simulateFailure: false }, paymentKey.current);
      paymentKey.current = null; setOrder(result.order); setToast({ message: result.order.paymentStatus === 'paid' ? 'Payment complete.' : 'Payment is still pending.', tone: 'success' });
    } catch (requestError) { setToast({ message: requestError.response?.data?.message || 'Payment retry failed.', tone: 'error' }); }
    finally { setActionBusy(false); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this order? Stock will be returned to inventory.')) return;
    const reason = window.prompt('Reason for cancellation (optional):') || '';
    setActionBusy(true);
    try { const result = await cancelOrder(id, reason); setOrder(result.order); setToast({ message: 'Order cancelled.', tone: 'success' }); }
    catch (requestError) { setToast({ message: requestError.response?.data?.message || 'Could not cancel this order.', tone: 'error' }); }
    finally { setActionBusy(false); }
  }
  if (loading) return <Skeleton variant="panel" count={3} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;
  const pricing = order.pricing || order.totals;
  const address = order.shippingAddress || (order.address ? { fullName: order.address.recipient, ...order.address, pincode: order.address.postalCode } : null);
  const canRetry = order.status === 'placed' && ['failed', 'pending'].includes(order.paymentStatus) && order.paymentMethod !== 'cod';
  const timeline = order.status === 'cancelled' ? [...(order.statusHistory || []).filter((entry) => ['placed', 'paid'].includes(entry.status)), ...(order.statusHistory || []).filter((entry) => entry.status === 'cancelled')] : (order.statusHistory || []);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Order details</p><h1 className="mt-2 text-3xl font-semibold">{order.orderNumber}</h1><p className="mt-2 text-sm text-stone-600">Placed {orderDate(order.createdAt)}</p></div><StatusBadge status={order.status} /></header>
    {order.paymentStatus === 'failed' && <section aria-labelledby="payment-failed-title" className="rounded-2xl border border-red-300 bg-white p-5"><h2 id="payment-failed-title" className="font-semibold text-red-900">Payment failed</h2><p className="mt-1 text-sm text-stone-700">Your items are reserved. Retry payment or cancel the order.</p><div className="mt-4 flex flex-wrap gap-3">{canRetry && <button type="button" disabled={actionBusy} onClick={retryPayment} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50">{actionBusy ? 'Processing…' : 'Retry payment'}</button>}{['placed', 'paid'].includes(order.status) && <button type="button" disabled={actionBusy} onClick={cancel} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50">Cancel order</button>}</div></section>}
    <section aria-labelledby="timeline-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><h2 id="timeline-title" className="text-lg font-semibold">Order status</h2><ol className="mt-5 grid gap-4 sm:grid-cols-5">{timeline.map((entry, index) => <li key={`${entry.status}-${entry.at}-${index}`} className="flex items-start gap-3 sm:block"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-900">{index + 1}</span><div className="sm:mt-2"><p className="text-sm font-medium capitalize">{entry.status}</p><p className="mt-1 text-xs text-stone-500">{orderDate(entry.at)}</p>{entry.note && <p className="mt-1 text-xs text-stone-600">{entry.note}</p>}</div></li>)}</ol></section>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="space-y-5"><section aria-labelledby="items-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><h2 id="items-title" className="mb-5 text-lg font-semibold">Items</h2><OrderItems items={order.items} /></section><section aria-labelledby="address-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><h2 id="address-title" className="mb-3 text-lg font-semibold">Shipping address</h2><ShippingAddress address={address} /><p className="mt-4 text-sm text-stone-600">Payment: <span className="font-medium capitalize text-stone-900">{order.paymentMethod?.replaceAll('_', ' ') || '—'}</span> · {order.paymentStatus}</p></section></div>
      <aside className="rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-28"><h2 className="mb-5 text-lg font-semibold">Price details</h2><PriceBreakdown pricing={pricing} />{['placed', 'paid'].includes(order.status) && <button type="button" disabled={actionBusy} onClick={cancel} className="mt-5 w-full rounded-full border border-stone-300 px-5 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50">Cancel order</button>}</aside>
    </div>
    <Link to="/orders" className="inline-block text-sm font-medium text-sky-700 underline underline-offset-4">Back to My Orders</Link>
    <ToastMessage {...toast} onDismiss={() => setToast({ message: '', tone: 'success' })} />
  </div>;
}
