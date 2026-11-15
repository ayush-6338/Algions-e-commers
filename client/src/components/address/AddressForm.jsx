import { useState } from 'react';

const emptyAddress = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false };

export default function AddressForm({ initial = emptyAddress, submitLabel = 'Save address', onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...emptyAddress, ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  function change(event) {
    const { name, value, checked, type } = event.target;
    setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setErrors((previous) => { const next = { ...previous }; delete next[name]; return next; });
  }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = 'Enter the recipient name.';
    if (!/^[6-9]\d{9}$/.test(values.phone)) nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!values.line1.trim()) nextErrors.line1 = 'Enter the street address.';
    if (!values.city.trim()) nextErrors.city = 'Enter the city.';
    if (!values.state.trim()) nextErrors.state = 'Enter the state.';
    if (!/^\d{6}$/.test(values.pincode)) nextErrors.pincode = 'Enter a 6-digit pincode.';
    if (!values.country.trim()) nextErrors.country = 'Enter the country.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { event.currentTarget.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus(); return; }
    setSaving(true);
    try { await onSubmit(values); }
    catch (error) { setErrors({ form: error.response?.data?.message || error.message || 'Could not save this address.' }); }
    finally { setSaving(false); }
  }
  const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600';
  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div aria-live="assertive" className="text-sm text-red-800">{Object.entries(errors).map(([name, message]) => <p key={name}>{message}</p>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Address label<input name="label" className={inputClass} value={values.label} onChange={change} maxLength={40} /></label>
      <label className="text-sm font-medium">Full name<input name="fullName" className={inputClass} value={values.fullName} onChange={change} minLength={2} maxLength={100} required aria-invalid={Boolean(errors.fullName)} /></label>
      <label className="text-sm font-medium">Phone<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" className={inputClass} value={values.phone} onChange={change} maxLength={10} required aria-invalid={Boolean(errors.phone)} /></label>
      <label className="text-sm font-medium sm:col-span-2">Address line 1<input name="line1" className={inputClass} value={values.line1} onChange={change} minLength={3} maxLength={150} required aria-invalid={Boolean(errors.line1)} /></label>
      <label className="text-sm font-medium sm:col-span-2">Address line 2 <span className="font-normal text-stone-500">(optional)</span><input name="line2" className={inputClass} value={values.line2} onChange={change} maxLength={150} /></label>
      <label className="text-sm font-medium">City<input name="city" className={inputClass} value={values.city} onChange={change} minLength={2} required aria-invalid={Boolean(errors.city)} /></label>
      <label className="text-sm font-medium">State<input name="state" className={inputClass} value={values.state} onChange={change} minLength={2} required aria-invalid={Boolean(errors.state)} /></label>
      <label className="text-sm font-medium">Pincode<input name="pincode" inputMode="numeric" autoComplete="postal-code" className={inputClass} value={values.pincode} onChange={change} maxLength={6} required aria-invalid={Boolean(errors.pincode)} /></label>
      <label className="text-sm font-medium">Country<input name="country" className={inputClass} value={values.country} onChange={change} required aria-invalid={Boolean(errors.country)} /></label>
    </div>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="isDefault" checked={Boolean(values.isDefault)} onChange={change} className="h-4 w-4 accent-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600" />Make this my default address</label>
    <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-4">
      {onCancel && <button type="button" onClick={onCancel} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Cancel</button>}
      <button disabled={saving} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-60">{saving ? 'Saving…' : submitLabel}</button>
    </div>
  </form>;
}
