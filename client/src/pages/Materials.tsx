import { FormEvent, useRef, useState } from 'react';
import api, { Doc, dateStr, errMsg } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';
import { Badge, Empty, Field, Notice, PageHeader, Select } from '../components/ui';

const kind = (f: Doc) => (f.mimeType?.startsWith('image/') ? 'Image' : f.mimeType === 'application/pdf' ? 'PDF' : 'Word');
const size = (b = 0) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Materials() {
  const { user } = useAuth();
  const [batch, setBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, reload } = useFetch<Doc>('/materials', { batch, subject, q });
  const { data: batches } = useFetch<Doc>('/batches', { limit: 100 });
  const { data: subjects } = useFetch<Doc>('/subjects', { limit: 100 });
  const bOpts = (batches?.items ?? []).map((b: Doc) => ({ value: b._id, label: b.name }));
  const sOpts = (subjects?.items ?? []).map((s: Doc) => ({ value: s._id, label: s.name }));

  const remove = async (m: Doc) => {
    if (!confirm(`Delete "${m.title}"? Students will lose access to the file.`)) return;
    try { await api.delete(`/materials/${m._id}`); toast.success('Material deleted'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Study materials" sub="Share PDF, Word and image files with your batches" />
      <UploadForm batches={bOpts} subjects={sOpts} onSaved={reload} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="w-48"><Select value={batch} onChange={setBatch} placeholder="All batches" options={bOpts} /></div>
        <div className="w-48"><Select value={subject} onChange={setSubject} placeholder="All subjects" options={sOpts} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((m: Doc) => (
          <article key={m._id} className="panel flex gap-3">
            {m.file.resourceType === 'image' ? <img src={m.file.url} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded bg-canvas text-sm font-semibold text-brand">{kind(m.file)}</div>}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{m.title}</h3>
              <p className="text-xs text-mute">{[m.subject?.name, m.batch?.name].filter(Boolean).join(' · ') || 'All batches'}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-mute"><Badge tone="neutral">{kind(m.file)}</Badge>{size(m.file.bytes)} · {dateStr(m.createdAt)}</p>
              <div className="mt-2 flex gap-2">
                <a className="btn" href={m.file.url} target="_blank" rel="noreferrer">Open</a>
                {(user?.role === 'admin' || m.uploadedBy?._id === user?.id) && <button className="btn btn-danger" onClick={() => remove(m)}>Delete</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && !data?.items.length && <Empty>No study materials yet. Upload a PDF, Word file or image above.</Empty>}
    </>
  );
}

function UploadForm({ batches, subjects, onSaved }: { batches: any[]; subjects: any[]; onSaved: () => void }) {
  const [f, setF] = useState<Doc>({ title: '', description: '', batch: '', subject: '' });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Choose a file to upload.');
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('file', file); // keep the file last so text fields are parsed first
      await api.post('/materials', fd);
      setF({ title: '', description: '', batch: '', subject: '' }); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Material uploaded');
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="panel mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-4"><Notice error={error} /></div>
      <Field label="Title"><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Batch"><Select value={f.batch} onChange={(v) => setF({ ...f, batch: v })} options={batches} placeholder="All batches" /></Field>
      <Field label="Subject"><Select value={f.subject} onChange={(v) => setF({ ...f, subject: v })} options={subjects} placeholder="No subject" /></Field>
      <Field label="File (PDF, Word or image, up to 15 MB)"><input ref={fileRef} className="input" type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Description (optional)"><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
      <div className="flex items-end"><button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Uploading…' : 'Upload material'}</button></div>
    </form>
  );
}
