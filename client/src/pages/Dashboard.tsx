import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck, ClipboardCheck, GraduationCap, IndianRupee, Printer, UserPlus, Wallet } from 'lucide-react';
import { Doc, dateStr, money } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar, Empty, PageHeader, Select, Stat } from '../components/ui';

const tip = { contentStyle: { borderRadius: 8, border: '1px solid rgb(var(--line))', boxShadow: 'none', fontSize: 12 } };
const axisFor = (stroke: string) => ({ fontSize: 12, stroke, tickLine: false, axisLine: false }) as const;

const Chart = ({ title, sub, empty, children }: { title: string; sub?: string; empty: boolean; children: React.ReactElement }) => (
  <section className="panel">
    <h2 className="font-semibold">{title}</h2>
    {sub && <p className="mb-3 text-xs text-mute">{sub}</p>}
    {empty ? <Empty>No data yet. It will show here once records are added.</Empty> : <ResponsiveContainer width="100%" height={240}>{children}</ResponsiveContainer>}
  </section>
);

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { colors } = useTheme();
  const [batch, setBatch] = useState('');
  const { data: o } = useFetch<Doc>('/analytics/overview');
  const { data: trend } = useFetch<Doc[]>('/analytics/attendance-trend', { days: 30, batch });
  const { data: fees } = useFetch<Doc[]>('/analytics/fee-collection', { months: 6 });
  const { data: perf } = useFetch<Doc[]>('/analytics/performance', { batch });
  const { data: batches } = useFetch<Doc>('/batches', { limit: 100 });
  const { data: enq } = useFetch<Doc>(isAdmin ? '/enquiries' : null, { status: 'new', limit: 5 });

  const axis = axisFor(colors.mute);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const actions = [
    { to: '/admin/students', label: 'Add student', icon: UserPlus },
    { to: '/admin/attendance', label: 'Take attendance', icon: CalendarCheck },
    ...(isAdmin ? [{ to: '/admin/fees', label: 'Record a fee', icon: IndianRupee }] : []),
    { to: '/admin/exams', label: 'Schedule exam', icon: ClipboardCheck },
  ];

  return (
    <>
      <PageHeader title={`${greeting}, ${user?.name.split(' ')[0]}`} sub={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}>
        <div className="w-48"><Select value={batch} onChange={setBatch} placeholder="All batches" options={(batches?.items ?? []).map((b: Doc) => ({ value: b._id, label: b.name }))} /></div>
        <button className="btn" onClick={() => window.print()}><Printer size={16} /> Print</button>
      </PageHeader>

      <div className="no-print mb-6 flex flex-wrap gap-2">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="btn"><Icon size={16} className="text-brand" /> {label}</Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active students" value={o?.activeStudents ?? '-'} icon={<GraduationCap size={20} />} hint={o ? `${o.batches} active batches` : undefined} />
        <Stat label="Attendance, last 30 days" value={o ? `${o.attendanceRate30d}%` : '-'} icon={<CalendarCheck size={20} />} tone="bg-success/10 text-success" />
        <Stat label="Fees collected" value={o ? money(o.fees.collected) : '-'} icon={<Wallet size={20} />} tone="bg-success/10 text-success" />
        <Stat label="Fees pending" value={o ? money(o.fees.pending) : '-'} icon={<Wallet size={20} />} tone="bg-pen/10 text-pen" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Chart title="Daily attendance" sub="Percent of students present or late, last 30 days" empty={!trend?.length}>
          <AreaChart data={trend ?? []}>
            <defs><linearGradient id="att" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.brand} stopOpacity={0.25} /><stop offset="100%" stopColor={colors.brand} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={colors.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} {...axis} />
            <YAxis domain={[0, 100]} {...axis} />
            <Tooltip {...tip} />
            <Area dataKey="rate" name="Attendance %" stroke={colors.brand} strokeWidth={2} fill="url(#att)" />
          </AreaChart>
        </Chart>
        <Chart title="Exam performance" sub="Average and highest score per exam" empty={!perf?.length}>
          <BarChart data={perf ?? []}>
            <CartesianGrid stroke={colors.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="title" {...axis} />
            <YAxis domain={[0, 100]} {...axis} />
            <Tooltip {...tip} />
            <Bar dataKey="average" name="Average %" fill={colors.brand} radius={[4, 4, 0, 0]} />
            <Bar dataKey="highest" name="Highest %" fill={colors.hl} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Chart>
        <Chart title="Fees collected" sub="Per month, last 6 months" empty={!fees?.length}>
          <BarChart data={fees ?? []}>
            <CartesianGrid stroke={colors.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...tip} formatter={(v: number) => money(v)} />
            <Bar dataKey="collected" name="Collected" fill="#148A5B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Chart>

        <div className="grid gap-4">
          <section className="panel">
            <h2 className="mb-2 font-semibold">Upcoming exams</h2>
            {o?.upcomingExams?.length ? (
              <ul className="divide-y divide-line">
                {o.upcomingExams.map((e: Doc) => (
                  <li key={e._id} className="flex items-center gap-3 py-2.5">
                    <span className="w-12 shrink-0 rounded-lg bg-brand-soft py-1 text-center text-brand">
                      <span className="block text-lg font-semibold leading-none">{new Date(e.date).getDate()}</span>
                      <span className="text-[11px]">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </span>
                    <div className="min-w-0 text-sm"><div className="truncate font-medium">{e.title}</div><div className="text-xs text-mute">{e.subject?.name}, {e.batch?.name}</div></div>
                  </li>
                ))}
              </ul>
            ) : <Empty>No exams scheduled. Add one under Exams.</Empty>}
          </section>

          {isAdmin && (
            <section className="panel">
              <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">New enquiries</h2><Link to="/admin/enquiries" className="text-sm font-semibold text-brand">View all</Link></div>
              {enq?.items.length ? (
                <ul className="divide-y divide-line">
                  {enq.items.map((e: Doc) => (
                    <li key={e._id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={e.name} />
                      <div className="min-w-0 flex-1 text-sm"><div className="truncate font-medium">{e.name}</div><div className="truncate text-xs text-mute">{e.interest || 'General enquiry'}</div></div>
                      <a href={`tel:${e.phone}`} className="text-sm font-semibold text-brand">{e.phone}</a>
                      <span className="hidden text-xs text-mute sm:block">{dateStr(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No new enquiries from the website.</Empty>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
