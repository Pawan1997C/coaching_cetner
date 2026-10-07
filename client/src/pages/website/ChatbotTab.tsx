import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Send } from 'lucide-react';
import api, { Doc, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import { Field, Spinner } from '../../components/ui';
import ListEditor from '../../components/ListEditor';

const TOPICS = ['fees', 'class timings', 'classes and subjects', 'teachers', 'location and directions', 'phone, WhatsApp and email', 'demo classes and admission', 'reviews and ratings'];

export default function ChatbotTab() {
  const { data, reload } = useFetch<Doc>('/site');
  const site = useSite();
  const [c, setC] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setC({ enabled: true, collectLeads: true, name: 'Assistant', greeting: '', fallback: '', replies: [], ...(data.chatbot ?? {}) }); }, [data]);
  if (!c) return <Spinner />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const replies = (c.replies ?? []).filter((r: Doc) => r.keywords?.trim() && r.answer?.trim()); // drop empty rows
      const { data: updated } = await api.put('/site', { chatbot: { ...c, replies } });
      site.patchSettings(updated);
      reload();
      toast.success(c.enabled ? 'Chatbot saved.' : 'Chatbot saved and turned off on the website.');
    } catch (err: any) {
      const d = err?.response?.data?.details;
      toast.error(d ? Object.values(d).flat().join(' ') : errMsg(err));
    } finally { setSaving(false); }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <form onSubmit={save} className="space-y-6">
        <section className="panel space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={c.enabled} onChange={(e) => setC({ ...c, enabled: e.target.checked })} />
            <span><b>Show the chat assistant on the website</b><span className="block text-mute">Visitors see a chat button at the bottom right of every page.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={c.collectLeads !== false} onChange={(e) => setC({ ...c, collectLeads: e.target.checked })} />
            <span><b>Let the assistant take enquiry details</b><span className="block text-mute">When a visitor asks for a demo, admission or a call back, the assistant asks their name, phone number and class, confirms with them, and saves it under <b>Enquiries</b> (marked "via chat"). Turn off to point visitors to the contact form instead.</span></span>
          </label>
          <Field label="Assistant name"><input className="input max-w-xs" required maxLength={30} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
          <Field label="Opening message"><textarea className="input" rows={2} maxLength={300} value={c.greeting} onChange={(e) => setC({ ...c, greeting: e.target.value })} /></Field>
        </section>

        <section className="panel space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Your own replies</h2>
            <p className="text-sm text-mute">For anything specific to your centre. If a visitor's message contains one of the trigger words, the assistant sends your reply. These come first, before the built-in answers.</p>
          </div>
          <ListEditor title="" addLabel="Add a reply" items={c.replies ?? []} onChange={(v) => setC({ ...c, replies: v })}
            fields={[{ key: 'keywords', label: 'Trigger words, separated by commas. e.g. admission date, last date' }, { key: 'answer', label: 'Reply, e.g. Admissions are open until 30 June.', area: true }]} />
          <Field label="When the assistant does not understand (optional)">
            <textarea className="input" rows={2} maxLength={300} placeholder="Leave empty for the default: ask the visitor to call or request a call back." value={c.fallback} onChange={(e) => setC({ ...c, fallback: e.target.value })} />
          </Field>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving…' : 'Save chatbot'}</button>
          <a className="btn btn-lg" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open website</a>
        </div>
      </form>

      <aside className="space-y-6 xl:sticky xl:top-6">
        <section className="panel text-sm">
          <h2 className="mb-2 font-semibold">What it already knows</h2>
          <p className="mb-2 text-mute">The assistant answers from the content you enter on this website, so it stays correct when you update it. No AI service is used.</p>
          <ul className="list-disc space-y-0.5 pl-5">{TOPICS.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="mt-2 text-mute">It also answers your FAQs, understands class numbers ("10th fees") and common Hinglish words like "kitni fees".</p>
        </section>
        <Tester />
      </aside>
    </div>
  );
}

/** Try questions against the saved settings without leaving the admin panel. */
function Tester() {
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/public/chat', { message: q });
      setLog((l) => [{ q, a: data.reply }, ...l].slice(0, 5));
      setQ('');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <section className="panel">
      <h2 className="mb-1 font-semibold">Test it</h2>
      <p className="mb-3 text-xs text-mute">Uses the last saved version. Nothing is saved from here; try the full enquiry conversation on the website.</p>
      <form onSubmit={ask} className="flex gap-2">
        <input className="input" placeholder="Ask a question…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Test question" />
        <button className="btn btn-primary px-3" disabled={busy || !q.trim()} aria-label="Ask"><Send size={16} /></button>
      </form>
      <ul className="mt-3 space-y-3">
        {log.map((x, i) => (
          <li key={i} className="text-sm"><div className="font-semibold">{x.q}</div><div className="whitespace-pre-wrap text-mute">{x.a}</div></li>
        ))}
      </ul>
    </section>
  );
}
