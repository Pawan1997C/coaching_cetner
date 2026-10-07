import { useState } from 'react';
import api, { Doc, dateStr, errMsg } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { Badge, Empty, Notice, PageHeader, Select } from '../components/ui';

const STATUS = ['new', 'contacted', 'enrolled', 'closed'];
const tone = (s: string) => (s === 'new' ? 'warn' : s === 'enrolled' ? 'good' : 'neutral') as 'warn' | 'good' | 'neutral';

export default function Enquiries() {
  const [status, setStatus] = useState('new');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const { data, loading, reload } = useFetch<Doc>('/enquiries', { status, q, limit: 100 });

  const patch = async (id: string, body: Doc) => {
    try { await api.put(`/enquiries/${id}`, body); toast.success('Enquiry updated'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (e: Doc) => {
    if (!confirm(`Delete the enquiry from ${e.name}?`)) return;
    try { await api.delete(`/enquiries/${e._id}`); toast.success('Enquiry deleted'); reload(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <PageHeader title="Enquiries" sub="People who contacted you through the website">
        <input className="input w-56" placeholder="Search name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="w-40"><Select value={status} onChange={setStatus} placeholder="All" options={STATUS.map((s) => ({ value: s, label: s }))} /></div>
      </PageHeader>
      <Notice error={error} />
      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Received', 'Name', 'Contact', 'Interested in', 'Message', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {data?.items.map((e: Doc) => (
              <tr key={e._id} className="align-top">
                <td className="td whitespace-nowrap">{dateStr(e.createdAt)}</td>
                <td className="td font-medium">{e.name}{e.source === 'chatbot' && <div className="mt-0.5"><Badge tone="neutral">via chat</Badge></div>}</td>
                <td className="td">
                  <a className="text-brand underline" href={`tel:${e.phone}`}>{e.phone}</a>
                  {e.email && <div className="text-xs text-mute">{e.email}</div>}
                </td>
                <td className="td">{e.interest || '-'}</td>
                <td className="td max-w-xs text-mute">{e.message || '-'}</td>
                <td className="td">
                  <select className="input w-32" value={e.status} onChange={(ev) => patch(e._id, { status: ev.target.value })}>
                    {STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="mt-1"><Badge tone={tone(e.status)}>{e.status}</Badge></div>
                </td>
                <td className="td text-right"><button className="btn btn-danger" onClick={() => remove(e)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data?.items.length && <Empty>{status === 'new' ? 'No new enquiries.' : 'No enquiries match this filter.'}</Empty>}
      </div>
    </>
  );
}
