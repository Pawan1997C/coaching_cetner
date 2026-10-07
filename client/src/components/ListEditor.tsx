import { Doc } from '../lib/api';

/** Edits an array of small objects (stats, highlights, FAQs). */
export default function ListEditor({ title, items, fields, onChange, addLabel }: {
  title: string; items: Doc[]; fields: { key: string; label: string; area?: boolean }[]; onChange: (v: Doc[]) => void; addLabel: string;
}) {
  const set = (i: number, k: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 font-semibold">{title}</legend>
      {items.map((it, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            {fields.map((f) =>
              f.area ? (
                <textarea key={f.key} className="input" rows={2} placeholder={f.label} value={it[f.key] ?? ''} onChange={(e) => set(i, f.key, e.target.value)} />
              ) : (
                <input key={f.key} className="input" placeholder={f.label} value={it[f.key] ?? ''} onChange={(e) => set(i, f.key, e.target.value)} />
              )
            )}
          </div>
          <button type="button" className="btn btn-danger h-fit" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...items, {}])}>{addLabel}</button>
    </fieldset>
  );
}
