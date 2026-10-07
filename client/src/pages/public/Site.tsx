import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Clock, Mail, MapPin, Menu, MessageCircle, PenLine, Phone, Star, Users, X } from 'lucide-react';
import api, { Doc, errMsg } from '../../lib/api';
import { Avatar } from '../../components/ui';
import { useSite } from '../../context/SiteContext';
import Modal from '../../components/Modal';
import StarRating from '../../components/StarRating';
import ChatWidget from '../../components/ChatWidget';
import { SiteError, SiteLoader } from '../../components/SiteLoader';

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="inline-flex gap-0.5" role="img" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(n) ? 'fill-star text-star' : 'text-line'} />)}
  </span>
);

const Tick = () => (
  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-pen" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 13c3 1 5 4 6 7 3-6 7-12 12-16" />
  </svg>
);

const Section = ({ id, title, intro, alt, children }: { id: string; title: string; intro?: string; alt?: boolean; children: React.ReactNode }) => (
  <section id={id} className={`scroll-mt-16 py-20 ${alt ? 'bg-canvas' : 'bg-white'}`}>
    <div className="mx-auto max-w-6xl px-5">
      <h2 className="max-w-2xl font-display text-3xl md:text-4xl">{title}</h2>
      {intro && <p className="mt-3 max-w-xl text-mute">{intro}</p>}
      <div className="mt-10">{children}</div>
    </div>
  </section>
);

const SPINE = ['border-brand', 'border-pen', 'border-success', 'border-hl'];

export default function Site() {
  const { data: d, status, error, load, refresh } = useSite();
  const [menu, setMenu] = useState(false);
  const [interest, setInterest] = useState('');

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (d?.settings?.name) document.title = `${d.settings.name} | ${d.settings.tagline ?? 'Coaching classes'}`;
  }, [d]);

  if (!d) return status === 'error' ? <SiteError message={error} onRetry={refresh} /> : <SiteLoader />;

  const { settings: s, courses, faculty, reviews, rating } = d;
  const c = s.contact ?? {};
  const mapQ = s.mapQuery || c.address;
  const chatOn = s.chatbot?.enabled !== false;
  const nav = [
    s.about || s.highlights?.length ? ['about', 'About'] : null,
    courses.length ? ['classes', 'Classes'] : null,
    faculty.length ? ['faculty', 'Teachers'] : null,
    ['reviews', 'Reviews'],
    s.faqs?.length ? ['faq', 'FAQ'] : null,
    ['contact', 'Contact'],
  ].filter(Boolean) as string[][];

  const enquire = (title: string) => {
    setInterest(title);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Rows on the hero marksheet: the centre's own numbers, else its classes.
  const rows: { label: string; value: string }[] = s.stats?.length
    ? s.stats.slice(0, 4).map((x: Doc) => ({ label: x.label, value: x.value }))
    : courses.slice(0, 4).map((x: Doc) => ({ label: x.title, value: x.level || 'Open' }));

  return (
    <div className="fade-in text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5 font-display text-xl">
            {s.logo?.url ? <img src={s.logo.url} alt="" className="h-9 w-9 rounded object-contain" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg text-white">{s.name?.[0]}</span>}
            {s.name}
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`} className="text-mute transition-colors hover:text-ink">{label}</a>)}
            {c.phone && <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-brand"><Phone size={15} />{c.phone}</a>}
            <a href="#contact" className="btn btn-primary">Enquire now</a>
          </nav>
          <button className="btn px-2.5 md:hidden" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Menu">{menu ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {menu && (
          <nav className="flex flex-col border-t border-line bg-white px-5 py-2 md:hidden">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)} className="py-3 text-sm font-medium">{label}</a>)}
          </nav>
        )}
      </header>

      <div id="top" className="graph relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-mute">
              <span className="h-2 w-2 rounded-full bg-success" /> Admissions open
            </p>
            <h1 className="text-5xl leading-[1.08] md:text-6xl">{s.heroTitle}</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mute">{s.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#contact" className="btn btn-primary btn-lg">Book a free demo class</a>
              {courses.length > 0 && <a href="#classes" className="btn btn-lg">See classes</a>}
            </div>
            {rating.count > 0 && (
              <div className="mt-8 flex items-center gap-3 text-sm text-mute">
                <Stars n={rating.average} /> <span><b className="text-ink">{rating.average}</b> from {rating.count} review{rating.count > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* The marksheet: the centre's own numbers, marked up like a teacher's red pen. */}
          <div className="relative mx-auto w-full max-w-md">
            {s.heroImage?.url && <img src={s.heroImage.url} alt="" className="absolute -right-6 -top-8 h-64 w-52 rotate-3 rounded-xl object-cover shadow-lg" />}
            <div className="sheet relative rounded-md border border-line p-7 pl-16 shadow-[0_18px_40px_-12px_rgba(18,25,54,0.25)]">
              <div className="stamp absolute -right-3 -top-5 rounded-md border-[3px] border-pen bg-white/80 px-3 py-0.5 font-display text-3xl text-pen">A+</div>
              <div className="text-xs font-semibold text-mute">Progress report</div>
              <div className="mb-3 font-display text-2xl leading-tight">{s.name}</div>
              <dl className="space-y-0">
                {rows.map((r, i) => (
                  <div key={i} className="relative flex h-10 items-end justify-between gap-4 pb-1">
                    <dt className="text-sm text-ink/80">{r.label}</dt>
                    <dd className="relative font-display text-xl text-pen">
                      {r.value}
                      {i === 0 && (
                        <svg viewBox="0 0 120 56" className="pointer-events-none absolute -left-4 -top-3 h-14 w-[calc(100%+2rem)] min-w-24" fill="none" aria-hidden preserveAspectRatio="none">
                          <path className="draw stroke-pen" pathLength={1} d="M8 30C8 12 40 4 64 6c28 2 50 12 48 26-2 14-34 20-62 18C26 48 6 42 8 28" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </dd>
                  </div>
                ))}
                {rating.count > 0 && (
                  <div className="flex h-10 items-end justify-between gap-4 pb-1">
                    <dt className="text-sm text-ink/80">Parent rating</dt>
                    <dd className="font-display text-xl text-pen">{rating.average}/5</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-sm text-mute">{s.tagline}</p>
            </div>
          </div>
        </div>
        <div className="graph-fade pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-white/0" />
      </div>

      {(s.about || s.highlights?.length > 0) && (
        <Section id="about" title={`About ${s.name}`}>
          <div className="grid gap-12 md:grid-cols-2">
            <p className="whitespace-pre-line text-lg leading-relaxed text-ink/85">{s.about}</p>
            <ul className="space-y-6">
              {s.highlights?.map((h: Doc, i: number) => (
                <li key={i} className="flex gap-3"><Tick /><div><h3 className="font-semibold">{h.title}</h3><p className="mt-1 text-mute">{h.text}</p></div></li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {courses.length > 0 && (
        <Section id="classes" alt title="Classes and subjects" intro="Pick the class that matches your child's level. Tell us which one you are considering and we will confirm the next batch.">
          <div className="grid gap-5 lg:grid-cols-2">
            {courses.map((x: Doc, i: number) => (
              <article key={x._id} className="relative flex flex-col overflow-hidden rounded-xl border border-line bg-white sm:flex-row">
                <div className={`flex-1 border-l-8 p-6 ${SPINE[i % SPINE.length]}`}>
                  {x.image?.url && <img src={x.image.url} alt="" className="mb-4 h-32 w-full rounded-lg object-cover" />}
                  {x.level && <span className="badge mb-3 bg-brand-soft text-brand">{x.level}</span>}
                  <h3 className="font-display text-2xl leading-tight">{x.title}</h3>
                  {x.description && <p className="mt-2 text-mute">{x.description}</p>}
                  {x.subjects?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {x.subjects.map((sub: Doc) => <span key={sub._id} className="rounded-md border border-line px-2 py-0.5 text-sm">{sub.name}</span>)}
                    </div>
                  )}
                  <ul className="mt-4 space-y-1.5 text-sm text-mute">
                    {x.schedule && <li className="flex items-center gap-2"><Clock size={15} /> {x.schedule}</li>}
                    {x.duration && <li className="flex items-center gap-2"><CalendarDays size={15} /> {x.duration}</li>}
                    {x.seats && <li className="flex items-center gap-2"><Users size={15} /> {x.seats}</li>}
                  </ul>
                </div>
                <div className="relative flex items-center justify-between gap-3 border-t border-dashed border-line bg-canvas/60 p-6 sm:w-44 sm:flex-col sm:items-start sm:justify-center sm:border-l sm:border-t-0">
                  <span className="absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full border border-line bg-canvas sm:block" />
                  <span className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full border border-line bg-canvas sm:block" />
                  {x.fee && <div><div className="text-xs text-mute">Fee</div><div className="font-display text-xl leading-tight">{x.fee}</div></div>}
                  <button className="btn btn-primary" onClick={() => enquire(x.title)}>Enquire</button>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {faculty.length > 0 && (
        <Section id="faculty" title="Meet the teachers">
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {faculty.map((f: Doc) => (
              <figure key={f._id}>
                {f.photo?.url
                  ? <img src={f.photo.url} alt={f.name} className="aspect-[4/5] w-full rounded-lg object-cover" />
                  : <div className="grid aspect-[4/5] w-full place-items-center rounded-lg bg-brand-soft font-display text-6xl text-brand/40">{f.name[0]}</div>}
                <figcaption className="mt-3">
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-sm text-brand">{f.designation}</div>
                  <div className="text-sm text-mute">{[f.qualification, f.experience && `${f.experience} experience`].filter(Boolean).join(', ')}</div>
                  {f.bio && <p className="mt-2 text-sm text-ink/80">{f.bio}</p>}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      <Section id="reviews" alt title="What students and parents say" intro={reviews.length ? undefined : 'No reviews yet. Studied with us? Be the first to share your experience.'}>
          {reviews.length === 0 ? <div className="max-w-sm"><ReviewForm /></div> : (
          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="font-display text-6xl leading-none">{rating.average}</div>
              <div className="mt-3"><Stars n={rating.average} size={20} /></div>
              <div className="mt-1 text-sm text-mute">{rating.count} review{rating.count > 1 ? 's' : ''}</div>
              <ReviewForm />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {reviews.map((r: Doc, i: number) => (
                <blockquote key={r._id} className={`rounded-xl border border-line bg-white p-6 ${i === 0 ? 'sm:col-span-2' : ''}`}>
                  <Stars n={r.rating} />
                  <p className={`mt-3 ${i === 0 ? 'font-display text-xl leading-snug' : 'leading-relaxed'}`}>{r.text}</p>
                  <footer className="mt-4 flex items-center gap-3 text-sm">
                    <Avatar name={r.name} size={36} />
                    <div><div className="font-semibold">{r.name}</div>{r.role && <div className="text-mute">{r.role}</div>}</div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
          )}
        </Section>

      {s.faqs?.length > 0 && (
        <Section id="faq" title="Common questions">
          <div className="max-w-3xl divide-y divide-line border-y border-line">
            {s.faqs.map((f: Doc, i: number) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:hidden">
                  {f.question}<ChevronDown size={20} className="shrink-0 text-mute transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-2xl text-mute">{f.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      <Section id="contact" alt title="Visit us or send an enquiry" intro="Leave your number and we will call you back, usually within one working day.">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-line bg-white p-6 md:p-8">
            <EnquiryForm courses={courses} interest={interest} setInterest={setInterest} />
          </div>
          <div className="flex flex-col gap-5">
            {mapQ && (
              <div className="relative min-h-[18rem] flex-1 overflow-hidden rounded-xl border border-line">
                <iframe title="Map showing our location" className="absolute inset-0 h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&z=15&output=embed`} />
                <a className="btn absolute bottom-3 left-3" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`} target="_blank" rel="noreferrer">Get directions</a>
              </div>
            )}
            <ul className="space-y-3 rounded-xl border border-line bg-white p-6 text-sm">
              {c.address && <Info icon={<MapPin size={18} />} label="Address"><span className="whitespace-pre-line">{c.address}</span></Info>}
              {c.phone && <Info icon={<Phone size={18} />} label="Phone"><a className="font-semibold text-brand" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></Info>}
              {c.whatsapp && <Info icon={<MessageCircle size={18} />} label="WhatsApp"><a className="font-semibold text-brand" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Chat with us</a></Info>}
              {c.email && <Info icon={<Mail size={18} />} label="Email"><a className="font-semibold text-brand" href={`mailto:${c.email}`}>{c.email}</a></Info>}
              {c.hours && <Info icon={<Clock size={18} />} label="Hours"><span className="whitespace-pre-line">{c.hours}</span></Info>}
            </ul>
          </div>
        </div>
      </Section>

      <footer className="bg-brand-dark text-white/75">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_0.8fr_1.2fr]">
          <div>
            <div className="font-display text-2xl text-white">{s.name}</div>
            <p className="mt-2 max-w-xs text-sm">{s.tagline}</p>
            <div className="mt-4 flex gap-4 text-sm">
              {s.social?.facebook && <a href={s.social.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>}
              {s.social?.instagram && <a href={s.social.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>}
              {s.social?.youtube && <a href={s.social.youtube} target="_blank" rel="noreferrer" className="hover:text-white">YouTube</a>}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`} className="block hover:text-white">{label}</a>)}
          </div>
          <ul className="space-y-3 text-sm">
            {c.address && <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-white/50" /><span className="whitespace-pre-line">{c.address}</span></li>}
            {c.phone && <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-white/50" /><a href={`tel:${c.phone.replace(/\s/g, '')}`} className="hover:text-white">{c.phone}</a></li>}
            {c.email && <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-white/50" /><a href={`mailto:${c.email}`} className="break-all hover:text-white">{c.email}</a></li>}
            {c.hours && <li className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0 text-white/50" /><span className="whitespace-pre-line">{c.hours}</span></li>}
          </ul>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} {s.name}. All rights reserved.</div>
      </footer>

      {chatOn && <ChatWidget settings={s} />}
      {c.whatsapp && (
        <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
          className={`fixed right-5 z-30 grid place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 ${chatOn ? 'bottom-24 h-12 w-12' : 'bottom-5 h-14 w-14'}`}>
          <MessageCircle size={chatOn ? 22 : 26} />
        </a>
      )}
    </div>
  );
}

const Info = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <li className="flex gap-3"><span className="mt-0.5 text-brand">{icon}</span><div><div className="text-xs text-mute">{label}</div>{children}</div></li>
);

function EnquiryForm({ courses, interest, setInterest }: { courses: Doc[]; interest: string; setInterest: (v: string) => void }) {
  const [f, setF] = useState<Doc>({ name: '', phone: '', email: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('busy'); setError('');
    try {
      await api.post('/public/enquiries', { ...f, interest });
      setState('done');
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details ? Object.values(details).flat().join(' ') : errMsg(err));
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13c3 1 5 4 6 7 3-6 7-12 12-16" /></svg></div>
        <h3 className="font-display text-2xl">Thanks, we have your details</h3>
        <p className="mt-2 text-mute">We will call you back on {f.phone}, usually within one working day.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <h3 className="font-display text-2xl sm:col-span-2">Request a call back</h3>
      {error && <p role="alert" className="rounded-lg border border-pen/20 bg-pen/5 px-3 py-2 text-sm text-pen sm:col-span-2">{error}</p>}
      <label><span className="label">Your name</span><input className="input" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label><span className="label">Phone</span><input className="input" required type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <label><span className="label">Email (optional)</span><input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label><span className="label">Class you are interested in</span>
        <select className="input" value={interest} onChange={(e) => setInterest(e.target.value)}>
          <option value="">Not sure yet</option>
          {courses.map((c) => <option key={c._id} value={c.title}>{c.title}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2"><span className="label">Message (optional)</span><textarea className="input" rows={3} maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
      {/* honeypot: hidden from people, filled in by bots */}
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      <div className="sm:col-span-2"><button className="btn btn-primary btn-lg w-full sm:w-auto" disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Request a call back'}</button></div>
    </form>
  );
}

function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Doc>({ name: '', role: '', rating: 5, text: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    if (done) { setDone(''); setF({ name: '', role: '', rating: 5, text: '', website: '' }); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      setDone((await api.post('/public/reviews', f)).data.message);
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details ? Object.values(details).flat().join(' ') : errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-6">
      <button className="btn btn-primary" onClick={() => setOpen(true)}><PenLine size={16} /> Write a review</button>
      <Modal open={open} onClose={close} title="Write a review">
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13c3 1 5 4 6 7 3-6 7-12 12-16" /></svg></div>
            <h3 className="font-display text-2xl">Thank you!</h3>
            <p className="mx-auto mt-2 max-w-xs text-mute">{done}</p>
            <button className="btn btn-primary btn-lg mt-6" onClick={close}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="pr-8">
              <h3 className="font-display text-2xl">Share your experience</h3>
              <p className="mt-1 text-sm text-mute">Your review helps other families choose. It appears on the website after we approve it.</p>
            </div>
            {error && <p role="alert" className="rounded-lg border border-pen/20 bg-pen/5 px-3 py-2 text-sm text-pen">{error}</p>}
            <div><span className="label">How would you rate us?</span><StarRating value={f.rating} onChange={(n) => setF({ ...f, rating: n })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="label">Your name</span><input data-autofocus className="input" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label><span className="label">You are a… (optional)</span><input className="input" placeholder="Parent, Class 10 student" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></label>
            </div>
            <label className="block">
              <span className="label">Your review</span>
              <textarea className="input" required rows={4} minLength={10} maxLength={600} placeholder="What did you like? How did it help?" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
              <span className="mt-1 block text-right text-xs text-mute">{f.text.length}/600</span>
            </label>
            <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" className="btn" onClick={close}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
