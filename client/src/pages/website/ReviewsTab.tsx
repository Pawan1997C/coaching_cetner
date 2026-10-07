import { FormEvent, useState } from 'react';
import api, { Doc, dateStr, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import { Badge, Empty, Field, Select } from '../../components/ui';

const tone = (s: string) => (s === 'published' ? 'good' : s === 'pending' ? 'warn' : 'neutral') as 'good' | 'warn' | 'neutral';

export default function ReviewsTab() {
  const [status, setStatus] = useState('pending');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Doc>({ name: '', role: '', rating: 5, text: '' });
  const site = useSite();
  const { data, loading, reload } = useFetch<Doc>('/reviews', { status, limit: 100 });

  const setReview = async (id: string, body: Doc) => {
    try {
      await api.put(`/reviews/${id}`, body);
      toast.success(body.status === 'published' ? 'Review published on the website' : 'Review hidden from the website');
      reload(); site.refresh();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (r: Doc) => {
    if (!confirm(`Delete the review from ${r.name}?`)) return;
    try { await api.delete(`/reviews/${r._id}`); toast.success('Review deleted'); reload(); site.refresh(); } catch (e) { toast.error(errMsg(e)); }
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { ...f, status: 'published' });
      setF({ name: '', role: '', rating: 5, text: '' }); setOpen(false); setStatus('published');
      toast.success('Review published on the website');
      reload(); site.refresh();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44"><Select value={status} onChange={setStatus} placeholder="All reviews" options={[{ value: 'pending', label: 'Waiting for approval' }, { value: 'published', label: 'Published' }, { value: 'hidden', label: 'Hidden' }]} /></div>
        <p className="text-sm text-mute">Reviews from visitors stay hidden until you publish them.</p>
        <button className="btn btn-primary ml-auto" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Add review'}</button>
      </div>
      {open && (
        <form onSubmit={add} className="panel mb-5 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Role (e.g. Parent of Class 10 student)"><input className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></Field>
          <Field label="Rating"><Select value={String(f.rating)} onChange={(v) => setF({ ...f, rating: Number(v) })} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` }))} /></Field>
          <div className="sm:col-span-2"><Field label="Review"><textarea className="input" required rows={3} maxLength={800} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field></div>
          <div><button className="btn btn-primary">Publish review</button></div>
        </form>
      )}
      <div className="space-y-3">
        {data?.items.map((r: Doc) => (
          <article key={r._id} className="panel">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-hl">{'★'.repeat(r.rating)}<span className="text-line">{'★'.repeat(5 - r.rating)}</span></span>
              <span className="font-semibold">{r.name}</span>{r.role && <span className="text-sm text-mute">· {r.role}</span>}
              <Badge tone={tone(r.status)}>{r.status}</Badge>
              <span className="ml-auto text-xs text-mute">{r.source === 'website' ? 'From website' : 'Added by you'} · {dateStr(r.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm">{r.text}</p>
            <div className="mt-3 flex gap-2">
              {r.status !== 'published' && <button className="btn btn-primary" onClick={() => setReview(r._id, { status: 'published' })}>Publish</button>}
              {r.status === 'published' && <button className="btn" onClick={() => setReview(r._id, { status: 'hidden' })}>Hide</button>}
              <button className="btn btn-danger" onClick={() => remove(r)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !data?.items.length && <Empty>{status === 'pending' ? 'No reviews waiting for approval.' : 'No reviews here yet.'}</Empty>}
    </>
  );
}
