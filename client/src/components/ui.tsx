import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export const PageHeader = ({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
    </div>
    <div className="no-print flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
  </label>
);

export const Notice = ({ error, children }: { error?: string; children?: ReactNode }) =>
  error || children ? (
    <p role={error ? 'alert' : 'status'} className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${error ? 'border-pen/20 bg-pen/5 text-pen' : 'border-success/20 bg-success/5 text-success'}`}>
      {error ?? children}
    </p>
  ) : null;

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-mute">
    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand"><Inbox size={18} /></span>
    <p className="max-w-xs">{children}</p>
  </div>
);

export const Badge = ({ tone, children }: { tone: 'good' | 'warn' | 'bad' | 'neutral'; children: ReactNode }) => {
  const c = { good: 'bg-success/10 text-success', warn: 'bg-hl/60 text-[#6b5400]', bad: 'bg-pen/10 text-pen', neutral: 'bg-canvas text-mute ring-1 ring-inset ring-line' }[tone];
  return <span className={`badge ${c}`}>{children}</span>;
};

export const Select = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) => (
  <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const TONES = ['bg-brand-soft text-brand', 'bg-pen/10 text-pen', 'bg-success/10 text-success', 'bg-hl/60 text-[#6b5400]'];
export const Avatar = ({ name, src, size = 32 }: { name: string; src?: string; size?: number }) =>
  src ? (
    <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.4 }} className={`grid shrink-0 place-items-center rounded-full font-semibold ${TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]}`}>
      {name.trim()[0]?.toUpperCase()}
    </span>
  );

export const Stat = ({ label, value, icon, tone = 'text-brand bg-brand-soft', hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: string; hint?: string }) => (
  <div className="panel flex items-start gap-4">
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
    <div className="min-w-0">
      <div className="text-sm text-mute">{label}</div>
      <div className="font-display text-3xl leading-tight">{value}</div>
      {hint && <div className="text-xs text-mute">{hint}</div>}
    </div>
  </div>
);

export const Spinner = ({ label = 'Loading…' }: { label?: string }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-mute">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
    {label}
  </div>
);
