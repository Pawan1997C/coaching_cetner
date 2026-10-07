import { FormEvent, useState } from 'react';
import api, { Doc, dateStr, errMsg, money } from '../lib/api';
import { toast } from '../lib/toast';
import { useFetch } from '../lib/useFetch';
import { Badge, Empty, Field, Notice, PageHeader, Select } from '../components/ui';

const printReceipt = (r: Doc) => {
  const w = window.open('', '_blank', 'width=480,height=640');
  if (!w) return toast.info('Allow pop-ups in your browser to print the receipt.');
  w.document.write(`<html><head><title>${r.receiptNo}</title><style>
    body{font-family:system-ui,sans-serif;padding:32px;color:#16302B} h1{font-size:20px;margin:0 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:16px} td{padding:8px 0;border-bottom:1px solid #DCE3E0;font-size:14px} td:last-child{text-align:right}
  </style></head><body>
    <h1>Fee receipt</h1><div style="color:#5E716C;font-size:13px">${r.receiptNo} · ${dateStr(r.paidOn)}</div>
    <table>
      <tr><td>Student</td><td>${r.student?.name} (${r.student?.rollNo})</td></tr>
      <tr><td>For</td><td>${r.title}</td></tr>
      <tr><td>Method</td><td>${r.method}</td></tr>
      <tr><td><b>Amount received</b></td><td><b>${money(r.amount)}</b></td></tr>
      <tr><td>Total paid so far</td><td>${money(r.totalPaid)}</td></tr>
      <tr><td>Balance</td><td>${money(r.balance)}</td></tr>
    </table><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
};

export default function Fees() {
  const [status, setStatus] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const params = status === 'pending' ? { pending: 'true' } : status ? { status } : {};
  const { data, loading, reload } = useFetch<Doc>('/fees', params);
  const items: Doc[] = data?.items ?? [];
  const pendingTotal = items.reduce((s, f) => s + Math.max(0, f.totalAmount - (f.discount ?? 0) - f.paidAmount), 0);

  return (
    <>
      <PageHeader title="Fees" sub="Assign fees, record payments and print receipts">
        <div className="w-44">
          <Select value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Pending and partial' }, { value: 'paid', label: 'Paid' }, { value: '', label: 'All fees' }]} />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Assign fee'}</button>
      </PageHeader>
      <Notice error={error} />
      {showForm && <AssignForm onSaved={() => { setShowForm(false); toast.success('Fee assigned'); reload(); }} />}
      {status === 'pending' && <p className="mb-3 text-sm text-mute">{items.length} open fees · <span className="font-semibold text-pen">{money(pendingTotal)}</span> outstanding</p>}

      <div className="panel overflow-x-auto p-0">
        <table className="w-full">
          <thead><tr>{['Student', 'Fee', 'Due', 'Amount', 'Paid', 'Balance', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((f) => {
              const net = f.totalAmount - (f.discount ?? 0);
              const bal = Math.max(0, net - f.paidAmount);
              const overdue = f.status !== 'paid' && f.dueDate && new Date(f.dueDate) < new Date();
              return (
                <>
                  <tr key={f._id}>
                    <td className="td"><div className="font-medium">{f.student?.name}</div><div className="text-xs text-mute">{f.student?.rollNo}</div></td>
                    <td className="td">{f.title}</td>
                    <td className="td">{dateStr(f.dueDate)}</td>
                    <td className="td">{money(net)}</td>
                    <td className="td">{money(f.paidAmount)}</td>
                    <td className="td font-medium">{money(bal)}</td>
                    <td className="td"><Badge tone={f.status === 'paid' ? 'good' : overdue ? 'bad' : 'warn'}>{overdue ? 'overdue' : f.status}</Badge></td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-1">
                        {bal > 0 && <button className="btn" onClick={() => setPayFor(payFor === f._id ? null : f._id)}>Record payment</button>}
                        {f.payments?.length > 0 && (
                          <button className="btn" onClick={async () => {
                            try { const p = f.payments[f.payments.length - 1]; printReceipt((await api.get(`/fees/${f._id}/receipts/${p.receiptNo}`)).data); } catch (e) { setError(errMsg(e)); }
                          }}>Last receipt</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {payFor === f._id && (
                    <tr key={f._id + 'pay'}><td colSpan={8} className="bg-canvas p-4"><PayForm fee={f} balance={bal} onDone={(r) => { setPayFor(null); toast.success('Payment recorded'); reload(); printReceipt(r); }} /></td></tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {!loading && !items.length && <Empty>{status === 'pending' ? 'No pending fees. Everything is collected.' : 'No fee records yet. Assign a fee to a student.'}</Empty>}
      </div>
    </>
  );
}

function PayForm({ fee, balance, onDone }: { fee: Doc; balance: number; onDone: (receipt: Doc) => void }) {
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { onDone((await api.post(`/fees/${fee._id}/payments`, { amount: Number(amount), method })).data.receipt); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="w-full"><Notice error={error} /></div>
      <Field label={`Amount (balance ${money(balance)})`}><input className="input w-44" type="number" min={1} max={balance} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <div className="w-36"><span className="label">Method</span><Select value={method} onChange={setMethod} options={['cash', 'upi', 'card', 'bank', 'cheque'].map((m) => ({ value: m, label: m }))} /></div>
      <button className="btn btn-primary">Save and print receipt</button>
    </form>
  );
}

function AssignForm({ onSaved }: { onSaved: () => void }) {
  const [f, setF] = useState<Doc>({ student: '', title: '', totalAmount: '', discount: '', dueDate: '' });
  const [error, setError] = useState('');
  const { data: students } = useFetch<Doc>('/students', { limit: 200, status: 'active' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees', { ...f, totalAmount: Number(f.totalAmount), discount: Number(f.discount) || 0, dueDate: f.dueDate || undefined });
      onSaved();
    } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit} className="panel mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-3"><Notice error={error} /></div>
      <Field label="Student"><Select value={f.student} onChange={(v) => setF({ ...f, student: v })} placeholder="Choose a student" options={(students?.items ?? []).map((s: Doc) => ({ value: s._id, label: `${s.rollNo} · ${s.name}` }))} /></Field>
      <Field label="Fee title"><input className="input" required placeholder="October tuition" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Due date"><input className="input" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
      <Field label="Amount"><input className="input" type="number" min={0} required value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: e.target.value })} /></Field>
      <Field label="Discount"><input className="input" type="number" min={0} value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} /></Field>
      <div className="flex items-end"><button className="btn btn-primary" disabled={!f.student}>Assign fee</button></div>
    </form>
  );
}
