import { FormEvent, useState } from 'react';
import api, { Doc, errMsg } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';
import { BatchManager, SubjectManager } from './Managers';
import { Avatar, Badge, Empty, Field, Notice, PageHeader, Select } from '../components/ui';

type Tab = 'students' | 'batches' | 'subjects';

export default function Students() {
  const [tab, setTab] = useState<Tab>('students');
  return (
    <>
      <PageHeader title="Students" sub="Profiles, batches and subjects" />
      <div className="mb-5 flex gap-1 border-b border-line">
        {(['students', 'batches', 'subjects'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-brand text-ink' : 'border-transparent text-mute'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'students' && <StudentList />}
      {tab === 'batches' && <BatchManager />}
      {tab === 'subjects' && <SubjectManager />}
    </>
  );
}

function StudentList() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [batch, setBatch] = useState('');
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useFetch<Doc>('/students', { q, batch, limit: 100 });
  const { data: batches } = useFetch<Doc>('/batches', { limit: 100 });
  const bOpts = (batches?.items ?? []).map((b: Doc) => ({ value: b._id, label: b.name }));

  const remove = async (s: Doc) => {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try { await api.delete(`/students/${s._id}`); toast.success('Student deleted'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search name, roll no, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="w-48"><Select value={batch} onChange={setBatch} placeholder="All batches" options={bOpts} /></div>
        <button className="btn btn-primary ml-auto" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Add student'}</button>
      </div>
      {open && <StudentForm batches={(batches?.items ?? []).filter((b: Doc) => b.active !== false).map((b: Doc) => ({ value: b._id, label: b.name }))} onSaved={() => { setOpen(false); reload(); }} />}
      <Notice error={error} />
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Roll no', 'Student', 'Batch', 'Guardian', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((s: Doc) => (
              <tr key={s._id}>
                <td className="td">{s.rollNo}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.name} src={s.avatar?.url} />
                    <div><div className="font-medium">{s.name}</div><div className="text-xs text-mute">{s.phone}</div></div>
                  </div>
                </td>
                <td className="td">{s.batch?.name ?? '-'}</td>
                <td className="td">{s.guardianName ?? '-'}<div className="text-xs text-mute">{s.guardianPhone}</div></td>
                <td className="td"><Badge tone={s.status === 'active' ? 'good' : 'neutral'}>{s.status}</Badge></td>
                <td className="td text-right">{user?.role === 'admin' && <button className="btn btn-danger" onClick={() => remove(s)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No students found. Add the first student to get started.</Empty>}
      </div>
    </>
  );
}

function StudentForm({ batches, onSaved }: { batches: { value: string; label: string }[]; onSaved: () => void }) {
  const [f, setF] = useState<Doc>({ name: '', phone: '', email: '', guardianName: '', guardianPhone: '', batch: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...f, batch: f.batch || undefined };
      const { data } = await api.post('/students', body);
      if (photo) {
        const fd = new FormData();
        fd.append('avatar', photo);
        await api.put(`/students/${data._id}/avatar`, fd);
      }
      toast.success('Student added');
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-3"><Notice error={error} /></div>
      <Field label="Full name"><input className="input" required value={f.name} onChange={set('name')} /></Field>
      <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Email"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="Guardian name"><input className="input" value={f.guardianName} onChange={set('guardianName')} /></Field>
      <Field label="Guardian phone"><input className="input" value={f.guardianPhone} onChange={set('guardianPhone')} /></Field>
      <Field label="Batch"><Select value={f.batch} onChange={(v) => setF({ ...f, batch: v })} options={batches} placeholder="No batch yet" /></Field>
      <Field label="Photo (JPG, PNG or WebP, up to 3 MB)"><input className="input" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></Field>
      <div className="flex items-end"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save student'}</button></div>
    </form>
  );
}
