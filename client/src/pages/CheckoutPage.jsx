import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddressDialog from '../components/address/AddressDialog.jsx';
import SafeImage from '../components/common/SafeImage.jsx';
import { ErrorState, money, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import { useCart } from '../context/CartContext.jsx';
import { createAddress, getAddresses } from '../services/addressService.js';
import { checkout } from '../services/orderService.js';

const methods = [
  ['card_sandbox', 'Card (sandbox)', 'Simulated card payment'],
  ['upi_sandbox', 'UPI (sandbox)', 'Simulated UPI payment'],
  ['cod', 'Cash on delivery', 'Pay when your order arrives'],
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, error: cartError, refreshCart, applyCoupon, clearCoupon } = useCart();
  const idempotencyKey = useRef(crypto.randomUUID());
  const firstErrorRef = useRef(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [addressDialog, setAddressDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card_sandbox');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [couponDraft, setCouponDraft] = useState(cart.couponCode || '');
  const [couponError, setCouponError] = useState('');
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [addressChoiceError, setAddressChoiceError] = useState('');
  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true); setAddressError('');
    try {
      const rows = await getAddresses(); setAddresses(rows);
      setSelectedAddress((current) => current || rows.find((row) => row.isDefault)?._id || rows[0]?._id || '');
    } catch (requestError) { setAddressError(requestError.response?.data?.message || 'Could not load saved addresses.'); }
    finally { setAddressesLoading(false); }
  }, []);
  useEffect(() => { loadAddresses(); }, [loadAddresses]);
  useEffect(() => {
    setCouponDraft(cart.couponCode || '');
    if (!cartLoading && !cartError && cart.items.length === 0) navigate('/cart', { replace: true });
  }, [cart.couponCode, cart.items.length, cartError, cartLoading, navigate]);

  async function saveAddress(values) {
    const saved = await createAddress(values);
    setAddresses((current) => [...current, saved]); setSelectedAddress(saved._id); setAddressDialog(false);
  }
  async function handleCoupon() {
    setCouponError('');
    try { await applyCoupon(couponDraft.trim()); }
    catch (requestError) { setCouponError(requestError.response?.data?.message || 'This coupon could not be applied.'); }
  }
  async function handleRemoveCoupon() {
    setCouponError('');
    try { await clearCoupon(); setCouponDraft(''); }
    catch (requestError) { setCouponError(requestError.response?.data?.message || 'Could not remove this coupon.'); }
  }
  async function placeOrder(event) {
    event.preventDefault(); setError(null); setAddressChoiceError('');
    if (!selectedAddress) { setAddressChoiceError('Choose or add a delivery address.'); firstErrorRef.current?.focus(); return; }
    if (paymentMethod === 'card_sandbox' && (!card.name.trim() || !/^\d{12,19}$/.test(card.number.replaceAll(' ', '')) || !/^\d{2}\/\d{2}$/.test(card.expiry) || !/^\d{3,4}$/.test(card.cvv))) {
      setError({ message: 'Complete the demo card fields with a valid name, card number, expiry and CVV.', code: 'PAYMENT_DETAILS_REQUIRED' });
      document.querySelector('[name="cardName"]')?.focus(); return;
    }
    setProcessing(true);
    try {
      const result = await checkout({ addressId: selectedAddress, paymentMethod, couponCode: cart.couponCode || undefined, simulateFailure: paymentMethod === 'card_sandbox' && card.number.replaceAll(' ', '').endsWith('0000') }, idempotencyKey.current);
      await refreshCart().catch(() => {});
      const order = result.order;
      if (order.paymentStatus === 'failed') navigate(`/orders/${order._id}?payment=failed`, { replace: true });
      else navigate(`/orders/${order._id}/confirmation`, { replace: true });
    } catch (requestError) {
      setError({ message: requestError.response?.data?.message || 'Could not place your order.', code: requestError.response?.data?.code, details: requestError.response?.data?.details });
    } finally { setProcessing(false); }
  }

  if (cartLoading && !cart.items.length) return <Skeleton variant="panel" count={3} />;
  if (cartError && !cart.items.length) return <ErrorState message={cartError} onRetry={() => refreshCart().catch(() => {})} />;

  const totals = cart.totals;
  return <form onSubmit={placeOrder} className="space-y-7">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Secure checkout</p><h1 className="mt-2 text-3xl font-semibold">Delivery &amp; payment</h1></header>
    {error && <div role="alert" aria-live="assertive" className="rounded-xl border border-red-300 bg-white p-4 text-sm text-red-900"><p>{error.message}</p>{error.code === 'OUT_OF_STOCK' && <><ul className="mt-2 list-disc pl-5">{error.details?.map((item, index) => <li key={`${item.item}-${index}`}>{item.item}: {item.message}</li>)}</ul><Link to="/cart" className="mt-3 inline-block font-medium underline">Review cart</Link></>}</div>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <section aria-labelledby="delivery-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 1</p><h2 id="delivery-title" className="mt-1 text-xl font-semibold">Delivery address</h2></div><button type="button" onClick={() => setAddressDialog(true)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Add new address</button></div>
          {addressesLoading ? <div role="status" className="mt-5 h-24 animate-pulse rounded-xl bg-stone-100" /> : addressError ? <p role="alert" className="mt-4 text-sm text-red-800">{addressError} <button type="button" onClick={loadAddresses} className="underline">Retry</button></p> : addresses.length ? <div className="mt-5 grid gap-3">{addresses.map((address, index) => <label key={address._id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-sky-600 ${selectedAddress === address._id ? 'border-sky-600 bg-sky-50' : 'border-stone-200'}`}><input ref={index === 0 ? firstErrorRef : undefined} type="radio" name="deliveryAddress" value={address._id} checked={selectedAddress === address._id} onChange={() => { setSelectedAddress(address._id); setAddressChoiceError(''); }} className="mt-1 h-4 w-4 accent-sky-600" /><span className="text-sm"><span className="font-semibold">{address.fullName} · {address.label}</span>{address.isDefault && <span className="ml-2 text-xs font-medium text-sky-700">Default</span>}<span className="mt-1 block leading-6 text-stone-600">{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</span></span></label>)}</div> : <p className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">Add a delivery address to continue.</p>}
          {addressChoiceError && <p role="alert" className="mt-3 text-sm text-red-800">{addressChoiceError}</p>}
        </section>
        <section aria-labelledby="payment-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Step 2</p><h2 id="payment-title" className="mt-1 text-xl font-semibold">Payment method</h2>
          <div className="mt-5 grid gap-3">{methods.map(([value, title, subtitle]) => <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-sky-600 ${paymentMethod === value ? 'border-sky-600 bg-sky-50' : 'border-stone-200'}`}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-1 h-4 w-4 accent-sky-600" /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-stone-600">{subtitle}</span></span></label>)}</div>
          {paymentMethod === 'card_sandbox' && <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4"><h3 className="font-medium">Demo card details</h3><p className="mt-1 text-xs leading-5 text-stone-600">Demo only. Use any number; a number ending 0000 simulates a failed payment. Card details stay in this browser and are never sent to the server.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Name on card<input name="cardName" autoComplete="cc-name" value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" /></label><label className="text-sm sm:col-span-2">Card number<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(event) => setCard({ ...card, number: event.target.value.replace(/[^\d ]/g, '').slice(0, 23) })} className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" /></label><label className="text-sm">Expiry<input name="cardExpiry" placeholder="MM/YY" autoComplete="cc-exp" value={card.expiry} onChange={(event) => setCard({ ...card, expiry: event.target.value.slice(0, 5) })} className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" /></label><label className="text-sm">CVV<input name="cardCvv" inputMode="numeric" autoComplete="cc-csc" value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value.replace(/\D/g, '').slice(0, 4) })} className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" /></label></div></div>}
        </section>
      </div>
      <aside aria-label="Order summary" className="rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-28"><h2 className="text-lg font-semibold">Order summary</h2><ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">{cart.items.map((item) => <li key={`${item.product._id}-${item.variant?._id || 'base'}`} className="flex gap-3"><SafeImage src={item.product.images?.[0]} alt={item.product.name} width={56} height={56} className="h-14 w-14 shrink-0 rounded-lg border border-stone-200 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.product.name}</p><p className="text-xs text-stone-500">Qty {item.quantity}{item.variant?.label ? ` · ${item.variant.label}` : ''}</p></div><span className="whitespace-nowrap text-sm">{money(item.unitPrice * item.quantity)}</span></li>)}</ul>
        <div className="mt-5 border-t border-stone-200 pt-4"><label htmlFor="checkout-coupon" className="text-sm font-medium">Coupon code</label><div className="mt-2 flex gap-2"><input id="checkout-coupon" value={couponDraft} onChange={(event) => setCouponDraft(event.target.value.toUpperCase())} disabled={Boolean(cart.couponCode)} className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" /><button type="button" onClick={cart.couponCode ? handleRemoveCoupon : handleCoupon} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{cart.couponCode ? 'Remove' : 'Apply'}</button></div>{couponError && <p role="alert" className="mt-2 text-xs text-red-800">{couponError}</p>}{cart.couponCode && <p className="mt-2 text-xs text-emerald-800">{cart.couponCode} applied</p>}</div>
        <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div><div className="flex justify-between"><dt>Discount</dt><dd>{totals.discount ? `−${money(totals.discount)}` : money(0)}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{money(totals.tax)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{totals.shipping ? money(totals.shipping) : 'Free'}</dd></div><div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold"><dt>Total</dt><dd>{money(totals.total)}</dd></div></dl>
        <button type="submit" disabled={processing || !cart.items.length} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-wait disabled:opacity-60">{processing && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}{processing ? 'Placing order…' : 'Place order'}</button>
        <Link to="/cart" className="mt-3 block text-center text-sm text-stone-600 underline underline-offset-4">Review cart</Link>
      </aside>
    </div>
    <AddressDialog open={addressDialog} onClose={() => setAddressDialog(false)} onSave={saveAddress} />
  </form>;
}
