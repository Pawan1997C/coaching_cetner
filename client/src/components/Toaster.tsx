import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastItem, subscribeToasts } from '../lib/toast';

const STYLE = {
  success: { icon: CheckCircle2, bar: 'border-l-success', text: 'text-success' },
  error: { icon: AlertCircle, bar: 'border-l-pen', text: 'text-pen' },
  info: { icon: Info, bar: 'border-l-brand', text: 'text-brand' },
};

function ToastView({ t, onClose }: { t: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onClose, t.duration);
    return () => clearTimeout(timer);
  }, [paused, t.duration, onClose]);

  const { icon: Icon, bar, text } = STYLE[t.kind];
  return (
    <div
      role={t.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`toast-in flex items-start gap-3 rounded-xl border border-l-4 border-line bg-white p-3.5 shadow-[0_8px_24px_-6px_rgba(18,25,54,0.25)] ${bar}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${text}`} />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button onClick={onClose} aria-label="Dismiss" className="rounded p-0.5 text-mute hover:bg-canvas hover:text-ink"><X size={16} /></button>
    </div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () =>
      subscribeToasts((t) =>
        // Ignore an identical message that is already on screen (avoids a stack of duplicates).
        setItems((cur) => (cur.some((c) => c.message === t.message && c.kind === t.kind) ? cur : [...cur.slice(-3), t]))
      ),
    []
  );

  const close = (id: number) => setItems((cur) => cur.filter((t) => t.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-96">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full"><ToastView t={t} onClose={() => close(t.id)} /></div>
      ))}
    </div>
  );
}
