import { useEffect } from 'react';

export default function ToastMessage({ message, tone = 'success', onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);
  if (!message) return null;
  return <div role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'} className={`fixed bottom-5 right-5 z-[150] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${tone === 'error' ? 'border-red-300 bg-white text-red-900' : 'border-stone-300 bg-white text-stone-900'}`}>
    <div className="flex items-start gap-4"><p>{message}</p><button type="button" aria-label="Dismiss notification" onClick={onDismiss} className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">×</button></div>
  </div>;
}
