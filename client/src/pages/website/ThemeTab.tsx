import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import api, { Doc, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import { useTheme } from '../../context/ThemeContext';
import { Spinner } from '../../components/ui';
import { BODY_FONTS, DEFAULT_THEME, DISPLAY_FONTS, PRESETS, RADII, Radius, Theme, contrast, loadAllFonts, normalizeTheme, themeStyle } from '../../lib/theme';

const HEX = /^#[0-9a-fA-F]{6}$/;

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="flex items-center gap-3">
      <input type="color" aria-label={`${label} colour`} value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-mute">{hint}</div>
      </div>
      <input className="input w-28 font-mono uppercase" value={text} maxLength={7} aria-label={`${label} hex`}
        onChange={(e) => { setText(e.target.value); if (HEX.test(e.target.value)) onChange(e.target.value.toUpperCase()); }} />
    </div>
  );
}

const Choice = ({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string }) => (
  <button type="button" role="radio" aria-checked={active} aria-label={label} onClick={onClick}
    className={`relative rounded-lg border p-3 text-left transition-colors ${active ? 'border-brand bg-brand-soft ring-2 ring-brand/20' : 'border-line bg-white hover:border-brand/40'}`}>
    {children}
    {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand text-white"><Check size={12} /></span>}
  </button>
);

export default function ThemeTab() {
  const { data, reload } = useFetch<Doc>('/site');
  const site = useSite();
  const { preview } = useTheme();
  const [t, setT] = useState<Theme | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAllFonts(); return () => preview(null); }, [preview]); // fonts for previews; drop unsaved preview on leave
  useEffect(() => { if (data) setT(normalizeTheme(data.theme)); }, [data]);
  useEffect(() => { if (t) preview(t); }, [t, preview]);

  const saved = useMemo(() => normalizeTheme(data?.theme), [data]);
  if (!t) return <Spinner />;
  const dirty = JSON.stringify(t) !== JSON.stringify(saved);
  const set = (patch: Partial<Theme>) => setT({ ...t, ...patch });
  const setColor = (k: 'brand' | 'accent' | 'highlight') => (v: string) => set({ [k]: v, preset: 'custom' });
  const lowContrast = contrast(t.brand, '#FFFFFF') < 4.5;

  const save = async () => {
    setSaving(true);
    try {
      const { data: updated } = await api.put('/site', { theme: t });
      site.patchSettings(updated);
      reload();
      toast.success('Theme saved. It is live on your website.');
    } catch (e: any) {
      const d = e?.response?.data?.details;
      toast.error(d ? Object.values(d).flat().join(' ') : errMsg(e));
    } finally { setSaving(false); }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="panel space-y-4">
          <div><h2 className="text-lg font-semibold">Colour scheme</h2><p className="text-sm text-mute">Start from a preset, then fine-tune the colours. Changes preview live; nothing goes public until you save.</p></div>
          <div role="radiogroup" aria-label="Colour presets" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <Choice key={p.id} label={p.name} active={t.preset === p.id} onClick={() => set({ preset: p.id, brand: p.brand, accent: p.accent, highlight: p.highlight })}>
                <div className="mb-2 flex gap-1.5">{[p.brand, p.accent, p.highlight].map((c) => <span key={c} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c }} />)}</div>
                <div className="text-sm font-semibold">{p.name}</div>
              </Choice>
            ))}
          </div>
          <div className="space-y-4 border-t border-line pt-4">
            <ColorField label="Main colour" hint="Buttons, links, header and footer" value={t.brand} onChange={setColor('brand')} />
            <ColorField label="Accent colour" hint="Red-pen marks, ticks, alerts" value={t.accent} onChange={setColor('accent')} />
            <ColorField label="Highlight colour" hint="Small highlights and chart bars" value={t.highlight} onChange={setColor('highlight')} />
            {lowContrast && (
              <p className="flex items-start gap-2 rounded-lg border border-hl bg-hl/30 p-3 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> This main colour is quite light, so white text on buttons will be hard to read. Pick a darker shade.</p>
            )}
          </div>
        </section>

        <section className="panel space-y-5">
          <div><h2 className="text-lg font-semibold">Fonts</h2></div>
          <div>
            <span className="label">Headings</span>
            <div role="radiogroup" aria-label="Heading font" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DISPLAY_FONTS.map((f) => (
                <Choice key={f.name} label={f.name} active={t.fontDisplay === f.name} onClick={() => set({ fontDisplay: f.name })}>
                  <div className="text-2xl leading-tight" style={{ fontFamily: f.css, fontWeight: f.weight }}>Aa Results</div>
                  <div className="mt-1 text-xs text-mute">{f.name}</div>
                </Choice>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Body text</span>
            <div role="radiogroup" aria-label="Body font" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BODY_FONTS.map((f) => (
                <Choice key={f.name} label={f.name} active={t.fontBody === f.name} onClick={() => set({ fontBody: f.name })}>
                  <div className="text-base" style={{ fontFamily: f.css }}>Small batches, weekly tests</div>
                  <div className="mt-1 text-xs text-mute">{f.name}</div>
                </Choice>
              ))}
            </div>
          </div>
        </section>

        <section className="panel space-y-4">
          <h2 className="text-lg font-semibold">Corners and scope</h2>
          <div role="radiogroup" aria-label="Corner style" className="grid grid-cols-3 gap-3">
            {(Object.keys(RADII) as Radius[]).map((r) => (
              <Choice key={r} label={RADII[r].label} active={t.radius === r} onClick={() => set({ radius: r })}>
                <div className="mb-2 h-9 border-2 border-brand bg-brand-soft" style={{ borderRadius: RADII[r].xl }} />
                <div className="text-sm font-semibold">{RADII[r].label}</div>
              </Choice>
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm">
            <input type="checkbox" className="mt-1" checked={t.applyToAdmin} onChange={(e) => set({ applyToAdmin: e.target.checked })} />
            <span><b>Use this theme in the admin panel too</b><span className="block text-mute">Turn off to keep the admin panel in the default blue look while the public website uses your theme.</span></span>
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary btn-lg" onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save theme'}</button>
          <button className="btn" onClick={() => setT(saved)} disabled={!dirty}>Discard changes</button>
          <button className="btn" onClick={() => setT({ ...DEFAULT_THEME })}>Reset to default</button>
          {dirty && <span className="text-sm text-mute">You have unsaved changes.</span>}
        </div>
      </div>

      {/* Scoped CSS variables: the preview always shows the draft, whatever the admin panel is using. */}
      <aside style={themeStyle(t)} className="xl:sticky xl:top-6" aria-label="Theme preview">
        <div className="overflow-hidden rounded-2xl border border-line bg-white font-sans text-ink shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-display text-lg">Your Centre</span>
            <span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">Enquire now</span>
          </div>
          <div className="graph p-5">
            <h3 className="font-display text-3xl leading-tight" style={{ fontWeight: 'var(--display-weight)' }}>Learn with clarity</h3>
            <p className="mt-2 text-sm text-mute">Small batches, experienced teachers and weekly tests.</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Book a demo</span>
              <span className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold">See classes</span>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex overflow-hidden rounded-xl border border-line">
              <div className="flex-1 border-l-8 border-brand p-3">
                <span className="badge bg-brand-soft text-brand">Class 10</span>
                <div className="mt-1 font-display text-lg">Board preparation</div>
                <div className="mt-1 text-xs text-mute">Maths, Science, English</div>
              </div>
              <div className="border-l border-dashed border-line bg-canvas p-3 text-sm"><div className="text-xs text-mute">Fee</div><b className="font-display">₹2,500</b></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display rounded-md border-[3px] border-pen px-2 text-2xl text-pen" style={{ transform: 'rotate(-8deg)' }}>A+</span>
              <span className="rounded-full bg-hl px-3 py-1 text-xs font-semibold">Highlighted</span>
              <span className="badge bg-pen/10 text-pen">Pending</span>
            </div>
          </div>
          <div className="bg-brand-dark px-4 py-3 text-xs text-white/75">Footer and sidebar colour</div>
        </div>
      </aside>
    </div>
  );
}
