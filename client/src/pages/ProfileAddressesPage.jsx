import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import AddressDialog from '../components/address/AddressDialog.jsx';
import ToastMessage from '../components/common/ToastMessage.jsx';
import { createAddress, deleteAddress, getAddresses, makeDefaultAddress, updateAddress } from '../services/addressService.js';

export default function ProfileAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, address: null });
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAddresses(await getAddresses()); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not load addresses.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function saveAddress(values) {
    if (dialog.address) await updateAddress(dialog.address._id, values);
    else await createAddress(values);
    setDialog({ open: false, address: null });
    setToast({ message: 'Address saved.', tone: 'success' });
    await load();
  }
  async function remove(address) {
    if (!window.confirm(`Delete the address for ${address.fullName}?`)) return;
    try { await deleteAddress(address._id); setToast({ message: 'Address deleted.', tone: 'success' }); await load(); }
    catch (requestError) { setToast({ message: requestError.response?.data?.message || 'Could not delete this address.', tone: 'error' }); }
  }
  async function makeDefault(address) {
    try { await makeDefaultAddress(address._id); setToast({ message: 'Default address updated.', tone: 'success' }); await load(); }
    catch (requestError) { setToast({ message: requestError.response?.data?.message || 'Could not update the default address.', tone: 'error' }); }
  }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-700">Your account</p><h1 className="mt-2 text-3xl font-semibold">Profile &amp; Addresses</h1><p className="mt-2 text-sm text-stone-600">Manage up to 10 delivery addresses.</p></div><button type="button" disabled={addresses.length >= 10} onClick={() => setDialog({ open: true, address: null })} className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50">Add address</button></header>
    {loading ? <Skeleton variant="panel" count={2} /> : error ? <ErrorState message={error} onRetry={load} /> : addresses.length ? <section aria-label="Saved addresses" className="grid gap-4 md:grid-cols-2">{addresses.map((address) => <article key={address._id} className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{address.label}</h2>{address.isDefault && <span className="mt-2 inline-block"><Badge tone="teal">Default</Badge></span>}</div><p className="text-right text-sm text-stone-600">{address.phone}</p></div>
      <p className="mt-4 text-sm font-medium">{address.fullName}</p><p className="mt-1 text-sm leading-6 text-stone-600">{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.state} {address.pincode}</p>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4"><button type="button" onClick={() => setDialog({ open: true, address })} className="rounded-full border border-stone-300 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Edit</button><button type="button" onClick={() => remove(address)} className="rounded-full border border-stone-300 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Delete</button>{!address.isDefault && <button type="button" onClick={() => makeDefault(address)} className="rounded-full px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Make default</button>}</div>
    </article>)}</section> : <EmptyState title="No saved addresses" message="Add a delivery address to make checkout quicker." />}
    <AddressDialog open={dialog.open} address={dialog.address} onClose={() => setDialog({ open: false, address: null })} onSave={saveAddress} />
    <ToastMessage {...toast} onDismiss={() => setToast({ message: '', tone: 'success' })} />
  </div>;
}
