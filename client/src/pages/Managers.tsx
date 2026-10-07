import { FormEvent, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api, { Doc, errMsg, money } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { toast } from '../lib/toast';
import { useAuth } from '../context/AuthContext';
import { Badge, Empty, Field } from '../components/ui';

const day = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex justify-end gap-1">
    <button className="btn px-2.5" onClick={onEdit} aria-label="Edit"><Pencil size={15} /></button>
    <button className="btn btn-danger px-2.5" onClick={onDelete} aria-label="Delete"><Trash2 size={15} /></button>
  </div>
);

/* ---------------- Subjects ---------------- */
const blankSubject = { name: '', code: '' };

export function SubjectManager() {
  const isAdmin = useAuth().user?.role === 'admin';
  const { data, loading, reload } = useFetch<Doc>('/subjects', { limit: 200 });
  const [f, setF] = useState<Doc>(blankSubject);
  const editing = !!f._id;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = { name: f.name, code: f.code };
      if (editing) await api.put(`/subjects/${f._id}`, body); else await api.post('/subjects', body);
      toast.success(editing ? 'Subject updated' : 'Subject added');
      setF(blankSubject); reload();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (s: Doc) => {
    if (!confirm(`Delete the subject "${s.name}"?`)) return;
    try { await api.delete(`/subjects/${s._id}`); toast.success('Subject deleted'); if (f._id === s._id) setF(blankSubject); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr><th className="th">Subject</th><th className="th">Code</th><th className="th" /></tr></thead>
          <tbody>
            {data?.items.map((s: Doc) => (
              <tr key={s._id} className={f._id === s._id ? 'bg-brand-soft/60' : ''}>
                <td className="td font-medium">{s.name}</td><td className="td">{s.code || '-'}</td>
                <td className="td">{isAdmin && <RowActions onEdit={() => setF({ _id: s._id, name: s.name, code: s.code ?? '' })} onDelete={() => remove(s)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No subjects yet. Add the first one.</Empty>}
      </div>
      {isAdmin ? (
        <form onSubmit={save} className="panel space-y-3 lg:sticky lg:top-6">
          <h2 className="font-semibold">{editing ? 'Edit subject' : 'Add subject'}</h2>
          <Field label="Subject name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Code (optional)"><input className="input" placeholder="MATH" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <div className="flex gap-2">
            <button className="btn btn-primary">{editing ? 'Save changes' : 'Add subject'}</button>
            {editing && <button type="button" className="btn" onClick={() => setF(blankSubject)}>Cancel</button>}
          </div>
        </form>
      ) : <p className="text-sm text-mute">Only admins can change subjects.</p>}
    </div>
  );
}

/* ---------------- Batches ---------------- */
const blankBatch = { name: '', schedule: '', monthlyFee: '', capacity: '', startDate: '', endDate: '', subjects: [] as string[], active: true };

export function BatchManager() {
  const isAdmin = useAuth().user?.role === 'admin';
  const { data, loading, reload } = useFetch<Doc>('/batches', { limit: 200 });
  const { data: subjects } = useFetch<Doc>('/subjects', { limit: 200 });
  const [f, setF] = useState<Doc>(blankBatch);
  const editing = !!f._id;

  const edit = (b: Doc) =>
    setF({ _id: b._id, name: b.name, schedule: b.schedule ?? '', monthlyFee: b.monthlyFee ?? '', capacity: b.capacity ?? '', startDate: day(b.startDate), endDate: day(b.endDate), subjects: (b.subjects ?? []).map((s: Doc) => s._id), active: b.active !== false });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      name: f.name, schedule: f.schedule, subjects: f.subjects, active: f.active,
      monthlyFee: f.monthlyFee === '' ? 0 : Number(f.monthlyFee),
      capacity: f.capacity === '' ? null : Number(f.capacity), // null clears the value on edit
      startDate: f.startDate || null, endDate: f.endDate || null,
    };
    try {
      if (editing) await api.put(`/batches/${f._id}`, body); else await api.post('/batches', body);
      toast.success(editing ? 'Batch updated' : 'Batch added');
      setF(blankBatch); reload();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (b: Doc) => {
    if (!confirm(`Delete the batch "${b.name}"?`)) return;
    try { await api.delete(`/batches/${b._id}`); toast.success('Batch deleted'); if (f._id === b._id) setF(blankBatch); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggle = (id: string) => setF({ ...f, subjects: f.subjects.includes(id) ? f.subjects.filter((x: string) => x !== id) : [...f.subjects, id] });

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Batch', 'Subjects', 'Monthly fee', 'Seats', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((b: Doc) => (
              <tr key={b._id} className={f._id === b._id ? 'bg-brand-soft/60' : ''}>
                <td className="td"><div className="font-medium">{b.name}</div><div className="text-xs text-mute">{b.schedule}</div></td>
                <td className="td">{b.subjects?.length ? b.subjects.map((s: Doc) => s.name).join(', ') : <span className="text-mute">None</span>}</td>
                <td className="td">{b.monthlyFee ? money(b.monthlyFee) : '-'}</td>
                <td className="td">{b.capacity ?? '-'}</td>
                <td className="td"><Badge tone={b.active === false ? 'neutral' : 'good'}>{b.active === false ? 'Inactive' : 'Active'}</Badge></td>
                <td className="td">{isAdmin && <RowActions onEdit={() => edit(b)} onDelete={() => remove(b)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No batches yet. Add the first batch.</Empty>}
      </div>

      {isAdmin ? (
        <form onSubmit={save} className="panel space-y-3 lg:sticky lg:top-6">
          <h2 className="font-semibold">{editing ? 'Edit batch' : 'Add batch'}</h2>
          <Field label="Batch name"><input className="input" required placeholder="Class 10 - Morning" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Timing"><input className="input" placeholder="Mon-Sat, 7-9 AM" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly fee"><input className="input" type="number" min={0} value={f.monthlyFee} onChange={(e) => setF({ ...f, monthlyFee: e.target.value })} /></Field>
            <Field label="Seats"><input className="input" type="number" min={1} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
            <Field label="Starts"><input className="input" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
            <Field label="Ends"><input className="input" type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
          </div>
          <div>
            <span className="label">Subjects</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {subjects?.items.map((s: Doc) => (
                <label key={s._id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.subjects.includes(s._id)} onChange={() => toggle(s._id)} />{s.name}</label>
              ))}
              {!subjects?.items.length && <span className="text-sm text-mute">Add subjects first (Subjects tab).</span>}
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Active<span className="block text-xs text-mute">Inactive batches stay in your records but are hidden when adding new students and exams.</span></span></label>
          <div className="flex gap-2">
            <button className="btn btn-primary">{editing ? 'Save changes' : 'Add batch'}</button>
            {editing && <button type="button" className="btn" onClick={() => setF(blankBatch)}>Cancel</button>}
          </div>
        </form>
      ) : <p className="text-sm text-mute">Only admins can change batches.</p>}
    </div>
  );
}
