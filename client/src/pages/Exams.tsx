import { FormEvent, useEffect, useState } from 'react';
import api, { Doc, dateStr, errMsg, today } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { Badge, Empty, Spinner, Field, Notice, PageHeader, Select } from '../components/ui';

export default function Exams() {
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading, reload } = useFetch<Doc>('/exams', { limit: 100 });

  const remove = async (e: Doc) => {
    if (!confirm(`Delete "${e.title}" and all its results?`)) return;
    try { await api.delete(`/exams/${e._id}`); toast.success('Exam deleted'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <PageHeader title="Exams" sub="Schedule tests, enter marks and see results">
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Schedule exam'}</button>
      </PageHeader>
      {showForm && <ExamForm onSaved={() => { setShowForm(false); toast.success('Exam scheduled'); reload(); }} />}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Exam', 'Batch', 'Subject', 'Date', 'Marks (pass)', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((e: Doc) => (
              <>
                <tr key={e._id}>
                  <td className="td font-medium">{e.title}</td><td className="td">{e.batch?.name}</td><td className="td">{e.subject?.name}</td>
                  <td className="td">{dateStr(e.date)}</td><td className="td">{e.totalMarks} ({e.passMarks})</td>
                  <td className="td text-right"><div className="flex justify-end gap-1">
                    <button className="btn" onClick={() => setOpenId(openId === e._id ? null : e._id)}>{openId === e._id ? 'Hide' : 'Marks and results'}</button>
                    <button className="btn btn-danger" onClick={() => remove(e)}>Delete</button>
                  </div></td>
                </tr>
                {openId === e._id && <tr key={e._id + 'm'}><td colSpan={6} className="bg-canvas p-4"><Marks examId={e._id} /></td></tr>}
              </>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>No exams yet. Schedule the first test for a batch.</Empty>}
      </div>
    </>
  );
}

function ExamForm({ onSaved }: { onSaved: () => void }) {
  const [f, setF] = useState<Doc>({ title: '', batch: '', subject: '', date: today(), totalMarks: 100, passMarks: 35 });
  const [error, setError] = useState('');
  const { data: batches } = useFetch<Doc>('/batches', { limit: 100 });
  const { data: subjects } = useFetch<Doc>('/subjects', { limit: 100 });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.post('/exams', { ...f, totalMarks: Number(f.totalMarks), passMarks: Number(f.passMarks) }); onSaved(); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="panel mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-3"><Notice error={error} /></div>
      <Field label="Title"><input className="input" required placeholder="Unit test 1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Batch"><Select value={f.batch} onChange={(v) => setF({ ...f, batch: v })} placeholder="Choose a batch" options={(batches?.items ?? []).filter((b: Doc) => b.active !== false).map((b: Doc) => ({ value: b._id, label: b.name }))} /></Field>
      <Field label="Subject"><Select value={f.subject} onChange={(v) => setF({ ...f, subject: v })} placeholder="Choose a subject" options={(subjects?.items ?? []).map((s: Doc) => ({ value: s._id, label: s.name }))} /></Field>
      <Field label="Date"><input className="input" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Total marks"><input className="input" type="number" min={1} required value={f.totalMarks} onChange={(e) => setF({ ...f, totalMarks: e.target.value })} /></Field>
      <Field label="Pass marks"><input className="input" type="number" min={0} required value={f.passMarks} onChange={(e) => setF({ ...f, passMarks: e.target.value })} /></Field>
      <div><button className="btn btn-primary" disabled={!f.batch || !f.subject}>Schedule exam</button></div>
    </form>
  );
}

function Marks({ examId }: { examId: string }) {
  const { data, reload } = useFetch<Doc>(`/exams/${examId}/results`);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;
    setMarks(Object.fromEntries(data.results.map((r: Doc) => [r.student._id, String(r.marksObtained)])));
  }, [data]);
  if (!data) return <Spinner />;

  const byStudent: Record<string, Doc> = Object.fromEntries(data.results.map((r: Doc) => [r.student._id, r]));
  const save = async () => {
    setError(''); setMsg('');
    const results = data.roster.filter((s: Doc) => marks[s._id] !== undefined && marks[s._id] !== '').map((s: Doc) => ({ student: s._id, marksObtained: Number(marks[s._id]) }));
    if (!results.length) return setError('Enter marks for at least one student.');
    try { await api.put(`/exams/${examId}/results`, { results }); toast.success('Marks saved'); reload(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div>
      <Notice error={error}>{msg}</Notice>
      <table className="w-full">
        <thead><tr>{[`Student`, `Marks (out of ${data.exam.totalMarks})`, 'Percentage', 'Grade', 'Result', 'Rank'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>
          {data.roster.map((s: Doc) => {
            const r = byStudent[s._id];
            return (
              <tr key={s._id}>
                <td className="td">{s.rollNo} · {s.name}</td>
                <td className="td"><input className="input w-24" type="number" min={0} max={data.exam.totalMarks} value={marks[s._id] ?? ''} onChange={(e) => setMarks({ ...marks, [s._id]: e.target.value })} /></td>
                <td className="td">{r ? `${r.percentage}%` : '-'}</td><td className="td">{r?.grade ?? '-'}</td>
                <td className="td">{r ? <Badge tone={r.passed ? 'good' : 'bad'}>{r.passed ? 'Pass' : 'Fail'}</Badge> : '-'}</td>
                <td className="td">{r?.rank ?? '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!data.roster.length && <Empty>No active students in this batch.</Empty>}
      <button className="btn btn-primary mt-3" onClick={save}>Save marks</button>
    </div>
  );
}
