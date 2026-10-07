import { FormEvent, useState } from 'react';
import api, { Doc, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Avatar, Badge, Empty, Field } from '../../components/ui';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import ImageUpload from '../../components/ImageUpload';

const blank = { name: '', designation: '', qualification: '', experience: '', bio: '', order: 0, published: true };

export default function FacultyTab() {
  const { data, loading, reload } = useFetch<Doc>('/faculty', { limit: 100 });
  const site = useSite();
  const [f, setF] = useState<Doc | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { _id, photo, createdAt, updatedAt, __v, ...body } = f!;
    try {
      const res = _id ? await api.put(`/faculty/${_id}`, body) : await api.post('/faculty', body);
      setF(_id ? null : res.data); // after creating, stay open so a photo can be added
      toast.success(_id ? 'Teacher saved' : 'Teacher added. You can add a photo below.');
      reload(); site.refresh();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (t: Doc) => {
    if (!confirm(`Remove ${t.name} from the website?`)) return;
    try { await api.delete(`/faculty/${t._id}`); toast.success('Teacher removed'); reload(); site.refresh(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mute">Teachers shown on the website.</p>
        <button className="btn btn-primary" onClick={() => setF(f ? null : { ...blank })}>{f ? 'Close' : 'Add teacher'}</button>
      </div>
      {f && (
        <form onSubmit={save} className="panel mb-5 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Designation"><input className="input" placeholder="Senior Mathematics Teacher" value={f.designation ?? ''} onChange={(e) => setF({ ...f, designation: e.target.value })} /></Field>
          <Field label="Qualification"><input className="input" value={f.qualification ?? ''} onChange={(e) => setF({ ...f, qualification: e.target.value })} /></Field>
          <Field label="Experience"><input className="input" placeholder="12 years" value={f.experience ?? ''} onChange={(e) => setF({ ...f, experience: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Short bio"><textarea className="input" rows={2} value={f.bio ?? ''} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field></div>
          <Field label="Display order (lower shows first)"><input className="input" type="number" value={f.order ?? 0} onChange={(e) => setF({ ...f, order: Number(e.target.value) })} /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />Show on website</label>
          {f._id && (
            <ImageUpload label="Photo" current={f.photo?.url} onUpload={async (file) => {
              const fd = new FormData(); fd.append('image', file);
              const { data: updated } = await api.put(`/faculty/${f._id}/photo`, fd);
              setF({ ...f, photo: updated.photo }); toast.success('Photo updated'); reload(); site.refresh();
            }} />
          )}
          <div className="flex items-end gap-2 sm:col-span-2">
            <button className="btn btn-primary">{f._id ? 'Save teacher' : 'Create teacher'}</button>
            {f._id && <button type="button" className="btn" onClick={() => setF(null)}>Done</button>}
          </div>
        </form>
      )}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Teacher', 'Designation', 'Experience', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((t: Doc) => (
              <tr key={t._id}>
                <td className="td"><div className="flex items-center gap-2"><Avatar name={t.name} src={t.photo?.url} /><span className="font-medium">{t.name}</span></div></td>
                <td className="td">{t.designation || '-'}</td><td className="td">{t.experience || '-'}</td>
                <td className="td"><Badge tone={t.published ? 'good' : 'neutral'}>{t.published ? 'Live' : 'Hidden'}</Badge></td>
                <td className="td text-right"><div className="flex justify-end gap-1"><button className="btn" onClick={() => setF(t)}>Edit</button><button className="btn btn-danger" onClick={() => remove(t)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No teachers yet. Add your faculty to build trust with parents.</Empty>}
      </div>
    </>
  );
}
