import { useEffect, useState } from 'react';
import api, { Doc, errMsg, today } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { Badge, Empty, Notice, PageHeader, Select } from '../components/ui';

const STATUSES = [
  ['present', 'P', 'bg-success text-white'],
  ['absent', 'A', 'bg-pen text-white'],
  ['late', 'L', 'bg-hl text-ink'],
  ['leave', 'Lv', 'bg-mute text-white'],
] as const;

export default function Attendance() {
  const [batch, setBatch] = useState('');
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState<Doc[]>([]);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [from, setFrom] = useState(today().slice(0, 8) + '01');
  const [to, setTo] = useState(today());

  const { data: batches } = useFetch<Doc>('/batches', { limit: 100 });
  const { data: sheet } = useFetch<Doc>(batch ? '/attendance' : null, { batch, date });
  const { data: report, reload: reloadReport } = useFetch<Doc[]>(batch ? '/attendance/report' : null, { batch, from, to });

  useEffect(() => {
    if (sheet) { setRecords(sheet.records); setSaved(sheet.exists); setMsg(''); }
  }, [sheet]);

  const setStatus = (i: number, status: string) => setRecords(records.map((r, j) => (j === i ? { ...r, status } : r)));
  const markAll = (status: string) => setRecords(records.map((r) => ({ ...r, status })));

  const save = async () => {
    setError(''); setMsg('');
    try {
      await api.post('/attendance', { batch, date, records: records.map((r) => ({ student: r.student._id ?? r.student, status: r.status })) });
      setSaved(true); toast.success('Attendance saved'); reloadReport();
    } catch (e) { setError(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Attendance" sub="Mark the day's attendance for a batch and review reports" />
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-56"><span className="label">Batch</span><Select value={batch} onChange={setBatch} placeholder="Choose a batch" options={(batches?.items ?? []).map((b: Doc) => ({ value: b._id, label: b.name }))} /></div>
        <div><span className="label">Date</span><input className="input" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <Notice error={error}>{msg}</Notice>

      {!batch ? <Empty>Choose a batch to take attendance.</Empty> : (
        <section className="panel mb-8 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
            <div className="text-sm text-mute">{records.length} students {saved && <Badge tone="good">Already marked</Badge>}</div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => markAll('present')}>Mark all present</button>
              <button className="btn btn-primary" onClick={save} disabled={!records.length}>Save attendance</button>
            </div>
          </div>
          {records.length === 0 ? <Empty>No active students in this batch.</Empty> : (
            <table className="w-full">
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.student._id ?? i}>
                    <td className="td w-24">{r.student.rollNo}</td>
                    <td className="td font-medium">{r.student.name}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {STATUSES.map(([s, label, on]) => (
                          <button key={s} title={s} onClick={() => setStatus(i, s)} className={`h-8 w-9 rounded text-xs font-semibold ${r.status === s ? on : 'bg-canvas text-mute hover:bg-line'}`}>{label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {batch && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">Attendance report</h2>
            <div className="flex items-end gap-2">
              <div><span className="label">From</span><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><span className="label">To</span><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <button className="btn" onClick={() => window.print()}>Print</button>
            </div>
          </div>
          <div className="panel overflow-x-auto p-0">
            <table className="w-full">
              <thead><tr>{['Roll no', 'Student', 'Present', 'Late', 'Absent', 'Leave', 'Days', 'Attendance'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {report?.map((r) => (
                  <tr key={r.student._id}>
                    <td className="td">{r.student.rollNo}</td><td className="td font-medium">{r.student.name}</td>
                    <td className="td">{r.present}</td><td className="td">{r.late}</td><td className="td">{r.absent}</td><td className="td">{r.leave}</td><td className="td">{r.total}</td>
                    <td className="td"><Badge tone={r.percentage >= 75 ? 'good' : r.percentage >= 60 ? 'warn' : 'bad'}>{r.percentage}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report?.length && <Empty>No attendance recorded in this range.</Empty>}
          </div>
        </section>
      )}
    </>
  );
}
