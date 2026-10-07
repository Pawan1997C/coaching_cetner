// A tiny global toast bus: `toast.success('Saved')` works from any component, hook or helper.
export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem { id: number; kind: ToastKind; message: string; duration: number }

const listeners = new Set<(t: ToastItem) => void>();
let nextId = 0;

const push = (kind: ToastKind, message: string, duration = kind === 'error' ? 6000 : 3500) => {
  const item = { id: ++nextId, kind, message, duration };
  listeners.forEach((l) => l(item));
  return item.id;
};

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
};

export const subscribeToasts = (fn: (t: ToastItem) => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
