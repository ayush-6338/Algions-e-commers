import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, money, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import { OrderItems, PriceBreakdown, StatusBadge, orderDate } from '../components/orders/OrderSummary.jsx';
import { getOrders } from '../services/orderService.js';

export default function MyOrdersPage() {
  const [result, setResult] = useState({ items: [], page: 1, totalPages: 0, total: 0 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setResult(await getOrders({ page, limit: 5, ...(status ? { status } : {}) })); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not load your orders.'); }
    finally { setLoading(false); }
  }, [page, status]);
  useEffect(() => { load(); }, [load]);
  function filter(event) { setStatus(event.target.value); setPage(1); }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Your account</p><h1 className="mt-2 text-3xl font-semibold">My orders</h1></div><label className="text-sm font-medium">Filter by status<select value={status} onChange={filter} className="ml-2 min-h-11 rounded-lg border border-stone-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><option value="">All orders</option>{['placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label></header>
    {loading ? <Skeleton variant="panel" count={3} /> : error ? <ErrorState message={error} onRetry={load} /> : result.items.length ? <><section aria-label="Your orders" className="space-y-4">{result.items.map((order) => <article key={order._id} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4"><div><p className="text-sm font-semibold">Order {order.orderNumber}</p><p className="mt-1 text-xs text-stone-500">Placed {orderDate(order.createdAt)}</p></div><div className="flex items-center gap-3"><StatusBadge status={order.status} /><p className="font-semibold">{money(order.pricing?.total ?? order.totals?.total)}</p></div></header><div className="grid gap-5 pt-4 md:grid-cols-[1fr_13rem]"><div><OrderItems items={order.items} /></div><div className="flex flex-col justify-between gap-4"><p className="text-sm text-stone-600">{order.items.length} {order.items.length === 1 ? 'item' : 'items'} · Payment {order.paymentStatus}</p><Link to={`/orders/${order._id}`} className="rounded-full border border-stone-300 px-4 py-2.5 text-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">View order</Link></div></div></article>)}</section><nav aria-label="Orders pages" className="flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Previous</button><span className="text-sm">Page {result.page} of {result.totalPages}</span><button type="button" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Next</button></nav></> : <EmptyState title="No orders yet" message="Your orders will show up here after checkout." />}
  </div>;
}
