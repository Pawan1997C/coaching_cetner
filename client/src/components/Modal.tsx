import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Accessible dialog: Esc and backdrop close it, focus moves in and is trapped, then returns to the trigger. */
export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = () =>
      [...(box.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input:not([type=hidden]),select,[tabindex]:not([tabindex="-1"])') ?? [])].filter((el) => el.offsetParent !== null);
    const t = setTimeout(() => (box.current?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0])?.focus(), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return closeRef.current();
      if (e.key !== 'Tab') return;
      const f = focusable();
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div className="backdrop-in absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={() => closeRef.current()} />
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} className="modal-in relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button onClick={() => closeRef.current()} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-mute hover:bg-canvas hover:text-ink"><X size={20} /></button>
        {children}
      </div>
    </div>,
    document.body
  );
}
