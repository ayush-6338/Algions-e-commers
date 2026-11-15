import { CloseIcon } from './Icons.jsx';

export default function AnnouncementBar({ hidden, onDismiss }) {
  return <div className={`relative flex h-8 w-full items-center justify-center bg-stone-900 px-10 text-center text-[10px] font-medium text-white transition-transform duration-200 sm:text-xs ${hidden ? '-translate-y-full' : 'translate-y-0'}`} aria-hidden={hidden}>
    <span className="whitespace-nowrap">Free shipping on orders above ₹999 · Easy 7-day returns</span>
    <button type="button" onClick={onDismiss} aria-label="Dismiss announcement" tabIndex={hidden ? -1 : 0} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"><CloseIcon /></button>
  </div>;
}
