import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { MessageCircle, PhoneCall, Send, X } from 'lucide-react';
import api, { Doc, errMsg } from '../lib/api';

interface Msg { role: 'user' | 'assistant'; content: string; suggestions?: string[] }
type Step = 'name' | 'phone' | 'interest' | 'note' | 'confirm';
interface Flow { step: Step; data: Doc }

const KEY = 'chat-v3';
const INITIAL = ['What are the fees?', 'Class timings', 'How do I book a demo?', 'Where are you located?'];
const STEP_NO: Record<Step, number> = { name: 1, phone: 2, interest: 3, note: 4, confirm: 5 };
const PLACEHOLDER: Record<Step, string> = { name: 'Type your name…', phone: 'Your mobile number…', interest: 'Pick a class or type one…', note: 'Type a note, or tap Skip…', confirm: 'Type yes to send…' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Turns links and phone numbers in a reply into tappable links. */
const LINKS = /(https?:\/\/[^\s]+|\+?\d[\d\s-]{8,}\d)/g;
const linkify = (text: string): ReactNode[] =>
  text.split(LINKS).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith('http')) {
      const label = part.includes('google.com/maps') ? 'Open in Google Maps' : part.includes('wa.me') ? 'Chat on WhatsApp' : part.replace(/^https?:\/\//, '');
      return <a key={i} href={part} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">{label}</a>;
    }
    return <a key={i} href={`tel:${part.replace(/[\s-]/g, '')}`} className="font-semibold text-brand underline">{part}</a>;
  });

const load = (): { msgs: Msg[]; flow: Flow | null } => {
  try { return { msgs: [], flow: null, ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') }; } catch { return { msgs: [], flow: null }; }
};

export default function ChatWidget({ settings }: { settings: Doc }) {
  const bot = settings.chatbot ?? {};
  const name = bot.name || 'Assistant';
  const phone = settings.contact?.phone;
  const leads = bot.collectLeads !== false;

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => load().msgs);
  const [flow, setFlow] = useState<Flow | null>(() => load().flow); // set while the bot is taking enquiry details
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs: msgs.slice(-40), flow })); } catch { /* ignore */ } }, [msgs, flow]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy, open]);
  useEffect(() => { if (open && !busy) input.current?.focus(); }, [open, busy, msgs.length]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || busy) return;
    setMsgs((m) => [...m.map((x) => ({ ...x, suggestions: undefined })), { role: 'user', content }]);
    setText(''); setBusy(true);
    try {
      // A short pause makes the reply feel like a conversation rather than a flash of text.
      const [{ data }] = await Promise.all([api.post('/public/chat', { message: content, flow }), sleep(450)]);
      setMsgs((m) => [...m, { role: 'assistant', content: data.reply, suggestions: data.suggestions }]);
      setFlow(data.flow ?? null);
    } catch (e: any) {
      const limited = e?.response?.status === 429;
      setMsgs((m) => [...m, { role: 'assistant', content: limited ? errMsg(e) : `Sorry, I could not answer just now.${phone ? ` Please call ${phone}.` : ' Please try again in a moment.'}` }]);
    } finally { setBusy(false); }
  };

  const submit = (e: FormEvent) => { e.preventDefault(); send(text); };
  const last = msgs[msgs.length - 1];
  const chips = busy ? [] : msgs.length === 0 ? INITIAL : last?.role === 'assistant' ? last.suggestions ?? [] : [];

  return (
    <>
      {open && (
        <section role="dialog" aria-label={`${name} chat`} className="chat-in fixed inset-x-3 bottom-24 z-40 flex h-[min(34rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-12px_rgba(18,25,54,0.35)] sm:inset-x-auto sm:right-5 sm:w-[24rem]">
          <header className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><MessageCircle size={20} /></span>
            <div className="flex-1 leading-tight">
              <div className="font-semibold">{name}</div>
              <div className="flex items-center gap-1.5 text-xs text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Replies instantly</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/15"><X size={18} /></button>
          </header>

          {flow && (
            <div className="flex items-center gap-3 border-b border-line bg-brand-soft px-4 py-2 text-xs">
              <span className="font-semibold text-brand">Your enquiry · step {STEP_NO[flow.step]} of 5</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white"><span className="block h-full bg-brand transition-all" style={{ width: `${STEP_NO[flow.step] * 20}%` }} /></span>
              <button onClick={() => send('cancel')} disabled={busy} className="font-semibold text-mute hover:text-ink">Cancel</button>
            </div>
          )}

          <div ref={log} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-canvas p-4">
            <Bubble role="assistant">{bot.greeting || 'Hi! Ask me about classes, fees, timings or admissions.'}</Bubble>
            {msgs.map((m, i) => <Bubble key={i} role={m.role}>{m.role === 'assistant' ? linkify(m.content) : m.content}</Bubble>)}
            {busy && <div className="typing flex w-16 gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm" aria-label={`${name} is typing`}><span /><span /><span /></div>}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-sm text-brand hover:bg-brand-soft">{c}</button>)}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-line bg-white p-3">
            <input ref={input} className="input" type={flow?.step === 'phone' ? 'tel' : 'text'} inputMode={flow?.step === 'phone' ? 'tel' : undefined} autoComplete={flow?.step === 'name' ? 'name' : flow?.step === 'phone' ? 'tel' : 'off'}
              placeholder={flow ? PLACEHOLDER[flow.step] : 'Type your question…'} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your message" />
            <button className="btn btn-primary px-3" disabled={busy || !text.trim()} aria-label="Send"><Send size={18} /></button>
          </form>
          {leads && !flow && (
            <button onClick={() => send('Request a call back')} disabled={busy} className="flex items-center justify-center gap-2 border-t border-line bg-white py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"><PhoneCall size={15} /> Request a call back</button>
          )}
        </section>
      )}

      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close chat' : `Chat with ${name}`}
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-white shadow-lg transition-transform hover:scale-105">
        {open ? <X size={22} /> : <><MessageCircle size={22} /><span className="hidden text-sm font-semibold sm:inline">Chat with us</span></>}
      </button>
    </>
  );
}

const Bubble = ({ role, children }: { role: 'user' | 'assistant'; children: ReactNode }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${role === 'user' ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-white text-ink'}`}>{children}</p>
  </div>
);
