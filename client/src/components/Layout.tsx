import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, CalendarCheck, ClipboardCheck, ExternalLink, Globe, GraduationCap, Inbox, LayoutDashboard, LogOut, Menu, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner } from './ui';
import { useSite } from '../context/SiteContext';

type Item = { to: string; label: string; icon: typeof Inbox; end?: boolean; admin?: boolean };
const groups: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Academics',
    items: [
      { to: '/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/admin/exams', label: 'Exams', icon: ClipboardCheck },
      { to: '/admin/materials', label: 'Study materials', icon: BookOpen },
    ],
  },
  { title: 'Finance', items: [{ to: '/admin/fees', label: 'Fees', icon: Wallet, admin: true }] },
  {
    title: 'Website',
    items: [
      { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox, admin: true },
      { to: '/admin/website', label: 'Website content', icon: Globe, admin: true },
    ],
  },
];

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: site, load } = useSite();
  const brand = site?.settings?.name || 'Coaching Platform';
  const logo = site?.settings?.logo?.url;
  useEffect(() => { if (user) load(); }, [user, load]);
  useEffect(() => setOpen(false), [pathname]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const nav = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        {logo ? <img src={logo} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-white font-display text-lg text-brand">{brand[0]}</span>}
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-lg text-white">{brand}</div>
          <div className="text-xs text-white/60">Admin panel</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => {
          const items = g.items.filter((i) => !i.admin || user.role === 'admin');
          if (!items.length) return null;
          return (
            <div key={g.title}>
              <div className="mb-1 px-3 text-xs font-medium text-white/50">{g.title}</div>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/10 font-semibold text-white before:absolute before:-left-3 before:top-2 before:h-5 before:w-1 before:rounded-r before:bg-pen' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="mb-3 flex items-center gap-2 text-sm text-white/75 hover:text-white"><ExternalLink size={16} /> View website</a>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={36} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{user.name}</div>
            <div className="text-xs capitalize text-white/60">{user.role}</div>
          </div>
          <button onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-dark md:flex">{nav}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
        <span className="truncate font-display text-lg">{brand}</span>
        <button className="btn px-2.5" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-dark">
            <button className="absolute right-3 top-4 text-white/75" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
            {nav}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
