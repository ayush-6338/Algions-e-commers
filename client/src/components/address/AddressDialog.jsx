import { useEffect, useRef } from 'react';
import AddressForm from './AddressForm.jsx';

export default function AddressDialog({ open, address, onClose, onSave }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="address-dialog-title" className="m-auto max-h-[92dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-900">
    <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-7">
      <h2 id="address-dialog-title" className="text-xl font-semibold">{address ? 'Edit address' : 'Add a new address'}</h2>
      <button type="button" aria-label="Close address form" onClick={onClose} className="rounded-full px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Close</button>
    </div>
    <div className="p-5 sm:p-7"><AddressForm key={address?._id || 'new'} initial={address} onSubmit={onSave} onCancel={onClose} /></div>
  </dialog>;
}
