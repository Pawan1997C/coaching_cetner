import { FormEvent, useState } from 'react';
import api, { Doc, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Badge, Empty, Field } from '../../components/ui';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import ImageUpload from '../../components/ImageUpload';

const blank = { title: '', level: '', description: '', subjects: [] as string[], schedule: '', duration: '', fee: '', seats: '', order: 0, published: true };

export default function CoursesTab() {
  const { data, loading, reload } = useFetch<Doc>('/courses', { limit: 100 });
  const { data: subjects } = useFetch<Doc>('/subjects', { limit: 100 });
  const site = useSite();
  const [f, setF] = useState<Doc | null>(null);

  const edit = (c: Doc) => setF({ ...c, subjects: c.subjects.map((s: Doc) => s._id) });
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { _id, image, createdAt, updatedAt, __v, ...body } = f!;
    try {
      const res = _id ? await api.put(`/courses/${_id}`, body) : await api.post('/courses', body);
      setF(_id ? null : { ...res.data, subjects: res.data.subjects }); // after creating, stay open so a photo can be added
      toast.success(_id ? 'Class saved' : 'Class created. You can add a photo below.');
      reload(); site.refresh();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (c: Doc) => {
    if (!confirm(`Delete "${c.title}" from the website?`)) return;
    try { await api.delete(`/courses/${c._id}`); toast.success('Class deleted'); reload(); site.refresh(); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggleSubject = (id: string) =>
    setF({ ...f!, subjects: f!.subjects.includes(id) ? f!.subjects.filter((x: string) => x !== id) : [...f!.subjects, id] });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mute">Classes shown on the website. Subjects come from Students, then Subjects.</p>
        <button className="btn btn-primary" onClick={() => setF(f ? null : { ...blank })}>{f ? 'Close' : 'Add class'}</button>
      </div>
      {f && (
        <form onSubmit={save} className="panel mb-5 grid gap-4 sm:grid-cols-2">
          <Field label="Class title"><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Level (e.g. Class 9-10)"><input className="input" value={f.level ?? ''} onChange={(e) => setF({ ...f, level: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="input" rows={2} value={f.description ?? ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2">
            <span className="label">Subjects taught</span>
            <div className="flex flex-wrap gap-3">
              {subjects?.items.map((s: Doc) => (
                <label key={s._id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.subjects.includes(s._id)} onChange={() => toggleSubject(s._id)} />{s.name}</label>
              ))}
              {!subjects?.items.length && <span className="text-sm text-mute">No subjects yet. Add some under Students.</span>}
            </div>
          </div>
          <Field label="Timing"><input className="input" placeholder="Mon-Sat, 7-9 AM" value={f.schedule ?? ''} onChange={(e) => setF({ ...f, schedule: e.target.value })} /></Field>
          <Field label="Duration"><input className="input" placeholder="10 months" value={f.duration ?? ''} onChange={(e) => setF({ ...f, duration: e.target.value })} /></Field>
          <Field label="Fee (shown as text)"><input className="input" placeholder="₹2,500 / month" value={f.fee ?? ''} onChange={(e) => setF({ ...f, fee: e.target.value })} /></Field>
          <Field label="Batch size"><input className="input" placeholder="Max 25 students" value={f.seats ?? ''} onChange={(e) => setF({ ...f, seats: e.target.value })} /></Field>
          <Field label="Display order (lower shows first)"><input className="input" type="number" value={f.order ?? 0} onChange={(e) => setF({ ...f, order: Number(e.target.value) })} /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />Show on website</label>
          {f._id && (
            <ImageUpload label="Photo (optional)" current={f.image?.url} onUpload={async (file) => {
              const fd = new FormData(); fd.append('image', file);
              const { data: updated } = await api.put(`/courses/${f._id}/image`, fd);
              setF({ ...f, image: updated.image }); toast.success('Photo updated'); reload(); site.refresh();
            }} />
          )}
          <div className="flex items-end gap-2 sm:col-span-2">
            <button className="btn btn-primary">{f._id ? 'Save class' : 'Create class'}</button>
            {f._id && <button type="button" className="btn" onClick={() => setF(null)}>Done</button>}
          </div>
        </form>
      )}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Class', 'Subjects', 'Timing', 'Fee', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((c: Doc) => (
              <tr key={c._id}>
                <td className="td font-medium">{c.title}<div className="text-xs text-mute">{c.level}</div></td>
                <td className="td">{c.subjects.map((s: Doc) => s.name).join(', ') || '-'}</td>
                <td className="td">{c.schedule || '-'}</td><td className="td">{c.fee || '-'}</td>
                <td className="td"><Badge tone={c.published ? 'good' : 'neutral'}>{c.published ? 'Live' : 'Hidden'}</Badge></td>
                <td className="td text-right"><div className="flex justify-end gap-1"><button className="btn" onClick={() => edit(c)}>Edit</button><button className="btn btn-danger" onClick={() => remove(c)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No classes yet. Add the first class to show it on the website.</Empty>}
      </div>
    </>
  );
}
