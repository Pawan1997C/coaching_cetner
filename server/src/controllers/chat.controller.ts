import { z } from 'zod';
import { Course } from '../models/Course';
import { Enquiry } from '../models/Enquiry';
import { Faculty } from '../models/Faculty';
import { Review } from '../models/Review';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { getSettings } from './site.controller';

/**
 * Rule-based website assistant (no AI service involved).
 *
 * Answering, in order: 1) replies the admin wrote  2) the admin's FAQs  3) built-in topics (fees, timings,
 * classes, teachers, location, contact, reviews)  4) a friendly fallback. Answers only use content the admin entered.
 *
 * Enquiries: when a visitor wants a demo, admission or a call back, the bot walks them through a short guided
 * conversation (name -> phone -> class -> note -> confirm) and saves the result as an Enquiry. The conversation
 * state (`flow`) travels with each request, so the server stays stateless and re-validates everything.
 */
interface Ctx { s: any; courses: any[]; faculty: any[]; rating: { average: number; count: number } }
type Step = 'name' | 'phone' | 'interest' | 'note' | 'confirm';
interface FlowData { name?: string; phone?: string; interest?: string; message?: string }
export interface Flow { step: Step; data: FlowData }
export interface Answer { reply: string; suggestions: string[]; flow?: Flow | null; submit?: FlowData }

const flowSchema = z.object({
  step: z.enum(['name', 'phone', 'interest', 'note', 'confirm']),
  data: z.object({ name: z.string().max(60).optional(), phone: z.string().max(25).optional(), interest: z.string().max(120).optional(), message: z.string().max(500).optional() }),
});
const bodySchema = z.object({ message: z.string().trim().min(1).max(500), flow: flowSchema.nullish() });
const submitSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/),
  interest: z.string().trim().max(120).optional(),
  message: z.string().trim().max(500).optional(),
});

const loadContext = async (): Promise<Ctx> => {
  const [settings, courses, faculty, reviews] = await Promise.all([
    getSettings(),
    Course.find({ published: true }).sort('order createdAt').populate('subjects', 'name').lean(),
    Faculty.find({ published: true }).sort('order createdAt').lean(),
    Review.find({ status: 'published' }).select('rating').lean(),
  ]);
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0;
  return { s: settings.toObject(), courses: courses as any[], faculty: faculty as any[], rating: { average, count } };
};

// ---------------------------------------------------------------- text helpers
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set('the a an is are do does you your i we my me to of for in on at and or what how can will it this that with about please tell there have has be kya hai hain ka ki ke mein me'.split(' '));
const stem = (t: string) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);
const meaningful = (s: string) => norm(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
const tidy = (s: string) => s.replace(/[ \t]{2,}/g, ' ').replace(/ +\n/g, '\n').trim();

/** Does the (normalised) question contain this keyword? Single words match exactly or as a plural; phrases match whole words. */
const hasKeyword = (nq: string, tokens: string[], raw: string) => {
  const k = norm(raw);
  if (!k) return false;
  if (k.includes(' ')) return ` ${nq} `.includes(` ${k} `);
  return tokens.some((t) => t === k || t === `${k}s` || t === `${k}es`);
};

// ---------------------------------------------------------------- built-in topics (English + common Hinglish)
// Priority order: on a tie the earlier topic wins ("class 10 fees" is about fees, not classes).
const TOPICS: { id: string; words: string[] }[] = [
  { id: 'fees', words: ['fee', 'cost', 'price', 'charge', 'rupee', 'kitna', 'kitni', 'paise', 'payment', 'instalment', 'installment', 'discount', 'scholarship', 'expensive'] },
  { id: 'timings', words: ['timing', 'time', 'schedule', 'batch', 'hours', 'open', 'slot', 'kab', 'samay', 'duration', 'how long'] },
  { id: 'enquiry', words: ['enquiry', 'enquire', 'inquiry', 'inquire', 'callback', 'call back', 'call me', 'contact me', 'interested', 'get in touch', 'take my details', 'talk to someone', 'talk to a person'] },
  { id: 'demo', words: ['demo', 'trial', 'admission', 'enroll', 'enrol', 'enrolment', 'join', 'register', 'registration', 'dakhila', 'seat', 'apply'] },
  { id: 'location', words: ['where', 'address', 'location', 'map', 'direction', 'reach', 'near', 'kahan', 'kaha', 'pata', 'landmark', 'route', 'visit'] },
  { id: 'contact', words: ['phone', 'call', 'contact', 'number', 'whatsapp', 'email', 'mail', 'mobile', 'sampark'] },
  { id: 'faculty', words: ['teacher', 'faculty', 'staff', 'tutor', 'sir', 'madam', 'shikshak', 'qualification', 'experience'] },
  { id: 'reviews', words: ['review', 'rating', 'feedback', 'result', 'testimonial', 'reputation'] },
  { id: 'classes', words: ['subject', 'class', 'course', 'syllabus', 'program', 'programme', 'board', 'cbse', 'offer', 'teach', 'standard', 'grade', 'kya padhate'] },
  { id: 'greet', words: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening', 'good afternoon'] },
  { id: 'thanks', words: ['thanks', 'thank', 'thankyou', 'shukriya', 'dhanyavad'] },
  { id: 'bye', words: ['bye', 'goodbye', 'see you'] },
];
// Words that mean "I want to do it", as opposed to "tell me about admissions".
const START = /\b(demo|trial|join|enrol|enroll|register|apply|enquiry|enquire|inquiry|inquire|callback|call back|call me|contact me|interested|get in touch|take my details)\b/;

const INITIAL = ['What are the fees?', 'Class timings', 'How do I book a demo?', 'Where are you located?'];
const FOLLOW_UPS: Record<string, string[]> = {
  fees: ['Class timings', 'Book a demo'],
  timings: ['Class fees', 'Book a demo'],
  classes: ['Class fees', 'Class timings'],
  faculty: ['Subjects offered', 'Book a demo'],
  location: ['Contact details', 'Class timings'],
  contact: ['Class fees', 'Book a demo'],
  demo: ['Class fees', 'Class timings'],
  reviews: ['Class fees', 'Book a demo'],
};

/** Classes the visitor mentioned by name or number ("10th class fees" matches "Class 10"). */
const mentionedCourses = (nq: string, courses: any[]) => {
  const nums: string[] = nq.match(/\d+/g) ?? [];
  return courses.filter((c) => {
    const names = [c.title, c.level].filter(Boolean).map(norm);
    if (names.some((n) => n && ` ${nq} `.includes(` ${n} `))) return true;
    const own: string[] = names.join(' ').match(/\d+/g) ?? [];
    return nums.some((n) => own.includes(n));
  });
};

const subjectsOf = (c: any) => (c.subjects ?? []).map((x: any) => x.name).join(', ');
const list = (rows: string[]) => rows.join('\n');
const leadsOn = (s: any) => s.chatbot?.collectLeads !== false;

const answerTopic = (id: string, nq: string, ctx: Ctx, allowFlow: boolean): Answer => {
  const { s, courses, faculty, rating } = ctx;
  const c = s.contact ?? {};
  const asked = mentionedCourses(nq, courses);
  const scope = asked.length ? asked : courses;
  const reach = c.phone ? ` You can also call ${c.phone}.` : '';
  const follow = FOLLOW_UPS[id] ?? INITIAL;
  // The "next step" hint depends on whether the bot may take details, and is dropped while a guided enquiry is running.
  const ask = !allowFlow ? '' : leadsOn(s) ? 'Tap "Request a call back" below and we will call you.' : 'Please use the enquiry form in the Contact section of this page.';
  const out = (reply: string, suggestions: string[]): Answer => ({ reply: tidy(reply), suggestions });

  switch (id) {
    case 'fees': {
      const rows = scope.filter((x) => x.fee).map((x) => `${x.title}: ${x.fee}`);
      return out(rows.length ? `Fees${asked.length ? ' for the class you asked about' : ''}:\n${list(rows)}` : `Fees depend on the class and batch. ${ask}${reach}`, follow);
    }
    case 'timings': {
      const rows = scope.filter((x) => x.schedule).map((x) => `${x.title}: ${x.schedule}${x.duration ? ` (${x.duration})` : ''}`);
      const hours = c.hours ? `\nOffice hours: ${c.hours}` : '';
      return out(rows.length ? `Class timings:\n${list(rows)}${hours}` : c.hours ? `We are open ${c.hours}. Batch timings are shared when you enquire. ${ask}` : `Batch timings are shared when you enquire. ${ask}${reach}`, follow);
    }
    case 'classes': {
      if (asked.length) {
        const rows = asked.map((x) => `${x.title}${x.level ? ` (${x.level})` : ''}${subjectsOf(x) ? `\nSubjects: ${subjectsOf(x)}` : ''}${x.schedule ? `\nTiming: ${x.schedule}` : ''}${x.fee ? `\nFee: ${x.fee}` : ''}`);
        return out(rows.join('\n\n'), follow);
      }
      const rows = courses.map((x) => `${x.title}${subjectsOf(x) ? `: ${subjectsOf(x)}` : ''}`);
      return out(rows.length ? `We offer:\n${list(rows)}` : `Our class list is being updated. ${ask}`, follow);
    }
    case 'faculty': {
      const rows = faculty.map((f) => {
        const bits = [f.designation, f.qualification, f.experience && `${f.experience} experience`].filter(Boolean).join(', ');
        return `${f.name}${bits ? `, ${bits}` : ''}`;
      });
      return out(rows.length ? `Our teachers:\n${list(rows)}` : `You can meet our teachers at a free demo class. ${ask}`, follow);
    }
    case 'location': {
      const q = s.mapQuery || c.address;
      return out(c.address ? `We are at ${c.address}.${q ? `\nhttps://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : ''}${c.hours ? `\nOpen: ${c.hours}` : ''}` : `You will find our location and map in the Contact section of this page.${reach}`, follow);
    }
    case 'contact': {
      const rows = [c.phone && `Phone: ${c.phone}`, c.whatsapp && `WhatsApp: https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}`, c.email && `Email: ${c.email}`, c.hours && `Hours: ${c.hours}`].filter(Boolean) as string[];
      return out(rows.length ? list(rows) : `Please use the enquiry form in the Contact section. ${ask}`, follow);
    }
    case 'enquiry':
    case 'demo': {
      const canCollect = allowFlow && leadsOn(s);
      if (canCollect && (id === 'enquiry' || START.test(nq))) {
        return begin(asked.length === 1 ? { interest: asked[0].title } : {}, ctx, id === 'demo' ? 'We would be happy to arrange a free demo class!' : 'Happy to help!');
      }
      if (canCollect) return out('Admissions and demo classes are arranged by our team. I can take your details so they can call you with the next steps. Would you like that?', ['Yes, take my details', 'No thanks']);
      return out(`We would be happy to arrange a free demo class. ${ask}${reach}`, follow);
    }
    case 'reviews':
      return out(rating.count ? `Parents and students rate us ${rating.average} out of 5 from ${rating.count} review${rating.count > 1 ? 's' : ''}. You can read them in the Reviews section of this page.` : 'You can read what families say in the Reviews section of this page.', follow);
    case 'greet':
      return out(`Hello! I can help with classes, fees, timings and admissions at ${s.name}. What would you like to know?`, INITIAL);
    case 'thanks':
      return out('You are welcome! Is there anything else I can help you with?', INITIAL);
    default:
      return out('Goodbye, and thank you for visiting!', []);
  }
};

export const answerQuestion = (question: string, ctx: Ctx, allowFlow = true): Answer => {
  const nq = norm(question);
  const tokens = nq.split(' ');
  const bot = ctx.s.chatbot ?? {};

  // 1) Replies written by the admin: the most specific (longest) matching keyword wins.
  let best: { score: number; answer: string } | null = null;
  for (const r of bot.replies ?? []) {
    const score = String(r.keywords ?? '').split(',').map((k) => k.trim()).filter((k) => hasKeyword(nq, tokens, k)).reduce((a, k) => a + norm(k).length, 0);
    if (score && (!best || score > best.score)) best = { score, answer: r.answer };
  }
  if (best) return { reply: best.answer, suggestions: INITIAL };

  // 2) FAQs from the website: reply when most of an FAQ's key words appear in the question.
  const qWords = new Set(meaningful(question));
  let faq: { ratio: number; answer: string } | null = null;
  for (const f of ctx.s.faqs ?? []) {
    const fw = meaningful(f.question ?? '');
    const shared = fw.filter((w) => qWords.has(w)).length;
    const ratio = fw.length ? shared / fw.length : 0;
    if (ratio >= 0.6 && (shared >= 2 || fw.length <= 2) && (!faq || ratio > faq.ratio)) faq = { ratio, answer: f.answer };
  }
  if (faq) return { reply: faq.answer, suggestions: INITIAL };

  // 3) Built-in topics: the topic with the most keyword hits wins; ties go to the earlier one in TOPICS.
  let top: { id: string; hits: number } | null = null;
  for (const t of TOPICS) {
    const hits = t.words.filter((w) => hasKeyword(nq, tokens, w)).length;
    if (hits && (!top || hits > top.hits)) top = { id: t.id, hits };
  }
  if (top) return answerTopic(top.id, nq, ctx, allowFlow);

  // 4) Nothing matched.
  const phone = ctx.s.contact?.phone;
  const next = !allowFlow ? '' : leadsOn(ctx.s) ? ' tap "Request a call back" below and we will get back to you.' : ' use the enquiry form in the Contact section.';
  return { reply: tidy(bot.fallback || `I am not sure about that one.${phone ? ` Please call ${phone}, or` : ' You can'}${next || '.'}`), suggestions: INITIAL };
};

// ---------------------------------------------------------------- guided enquiry
const STEPS: Step[] = ['name', 'phone', 'interest', 'note', 'confirm'];
const CANCEL = /^(cancel|stop|exit|quit|never mind|nevermind|not now|leave it)$/;
const RESTART = /^(start again|start over|restart|redo|change something)$/;
const YES = /^(yes|y|yeah|yep|ok|okay|sure|send|send it|yes send it|yes please|confirm|correct|sounds good|haan|ha|ji|theek hai)( please)?$/;
const SKIP = /^(skip|no|none|nothing|nope|nil|no thanks|no thank you)$/;
const NOT_SURE = /^(not sure( yet)?|skip|any|anything|none|dont know|don t know|do not know|no idea)$/;
const WH = /^(what|how|when|where|why|which|who|whom|kya|kitna|kitni|kab|kahan|kaise|do|does|is|are|can|could|will|would|tell)\b/i;
const NAME_PREFIX = /^(my name is|name is|i am|i'm|im|this is|it is|it's|its|mera naam|main)\s+/i;

const firstName = (n?: string) => (n ?? '').split(' ')[0];
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_m, a, b) => a + b.toUpperCase());
const looksLikeQuestion = (m: string) => m.includes('?') || (WH.test(m.trim()) && m.trim().split(/\s+/).length >= 3);

const parseName = (m: string): string | null => {
  const t = m.trim().replace(NAME_PREFIX, '').replace(/[.!,]+$/, '').trim();
  if (!/^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(t) || t.split(/\s+/).length > 5) return null;
  return titleCase(t);
};
const parsePhone = (m: string): string | null => {
  const found = m.match(/\+?\d[\d\s()-]{7,}\d/)?.[0];
  const digits = found?.replace(/\D/g, '') ?? '';
  return found && digits.length >= 10 && digits.length <= 13 ? found.replace(/\s+/g, ' ').trim() : null;
};

const promptFor = (step: Step, d: FlowData, ctx: Ctx, short = false): { reply: string; suggestions: string[] } => {
  switch (step) {
    case 'name': return { reply: 'What is your name?', suggestions: ['Cancel'] };
    case 'phone': return { reply: `Nice to meet you, ${firstName(d.name)}! What mobile number can our team reach you on?`, suggestions: ['Cancel'] };
    case 'interest': return { reply: 'Which class are you interested in?', suggestions: [...ctx.courses.slice(0, 6).map((c) => c.title), 'Not sure yet'] };
    case 'note': return { reply: 'Anything you would like us to know, such as a preferred timing or a question? You can also skip this.', suggestions: ['Skip'] };
    case 'confirm':
      return {
        reply: short
          ? 'Shall I send your details to our team?'
          : `Please check your details:\nName: ${d.name}\nPhone: ${d.phone}${d.interest ? `\nClass: ${d.interest}` : ''}${d.message ? `\nNote: ${d.message}` : ''}\n\nShall I send this to our team? They will use it only to contact you about admissions.`,
        suggestions: ['Yes, send it', 'Start again', 'Cancel'],
      };
  }
};

/** First step that still needs an answer after `from` (skips the class question if it is already known or there are no classes). */
const stepAfter = (from: Step, d: FlowData, ctx: Ctx): Step => {
  for (const s of STEPS.slice(STEPS.indexOf(from) + 1)) {
    if (s === 'interest' && (d.interest !== undefined || ctx.courses.length === 0)) continue;
    return s;
  }
  return 'confirm';
};

export const begin = (data: FlowData, ctx: Ctx, intro = 'Happy to help!'): Answer => {
  const note = data.interest ? ` I have noted your interest in ${data.interest}.` : '';
  const p = promptFor('name', data, ctx);
  return { reply: `${intro}${note} I will take a few details so our team can call you. You can type "cancel" at any time.\n\n${p.reply}`, suggestions: p.suggestions, flow: { step: 'name', data } };
};

const next = (flow: Flow, patch: FlowData, ctx: Ctx): Answer => {
  const data = { ...flow.data, ...patch };
  const step = stepAfter(flow.step, data, ctx);
  const p = promptFor(step, data, ctx);
  return { reply: p.reply, suggestions: p.suggestions, flow: { step, data } };
};
const stay = (flow: Flow, ctx: Ctx, lead: string): Answer => {
  const p = promptFor(flow.step, flow.data, ctx, true);
  return { reply: `${lead}\n\n${p.reply}`, suggestions: p.suggestions, flow };
};
/** The visitor asked something mid-enquiry: answer it, then carry on where we were. */
const interrupt = (message: string, flow: Flow, ctx: Ctx): Answer => stay(flow, ctx, answerQuestion(message, ctx, false).reply);

export const advance = (message: string, flow: Flow, ctx: Ctx): Answer => {
  const raw = message.trim();
  const nq = norm(raw);

  if (CANCEL.test(nq)) return { reply: 'No problem, I have not saved anything. Ask me anything else about the centre.', suggestions: INITIAL, flow: null };
  if (RESTART.test(nq)) return begin({}, ctx, 'Sure, let us start again.');

  switch (flow.step) {
    case 'name': {
      if (looksLikeQuestion(raw)) return interrupt(raw, flow, ctx);
      const name = parseName(raw);
      return name ? next(flow, { name }, ctx) : stay(flow, ctx, 'Sorry, I did not catch that. Please type your name, for example "Rahul Sharma".');
    }
    case 'phone': {
      const phone = parsePhone(raw);
      if (phone) return next(flow, { phone }, ctx);
      if (looksLikeQuestion(raw)) return interrupt(raw, flow, ctx);
      return stay(flow, ctx, 'That does not look like a valid phone number. Please enter a 10-digit mobile number, for example 98765 43210.');
    }
    case 'interest': {
      const exact = ctx.courses.find((c) => norm(c.title) === nq);
      const named = exact ? [exact] : mentionedCourses(nq, ctx.courses);
      if (!named.length && looksLikeQuestion(raw)) return interrupt(raw, flow, ctx);
      const interest = NOT_SURE.test(nq) ? '' : named.length === 1 ? named[0].title : raw.slice(0, 120);
      return next(flow, { interest }, ctx);
    }
    case 'note':
      return next(flow, { message: SKIP.test(nq) ? '' : raw.slice(0, 500) }, ctx);
    case 'confirm':
      if (YES.test(nq)) return { reply: '', suggestions: [], flow: null, submit: flow.data };
      return stay(flow, ctx, 'Please choose "Yes, send it" to submit, "Start again" to redo your details, or "Cancel".');
  }
};

// ---------------------------------------------------------------- saving and abuse limits
const recent = new Map<string, number[]>();
const allowChatEnquiry = (ip: string) => {
  const now = Date.now();
  if (recent.size > 5000) recent.clear();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (times.length >= 5) { recent.set(ip, times); return false; }
  recent.set(ip, [...times, now]);
  return true;
};

export const chat = asyncHandler(async (req, res) => {
  const { message, flow } = bodySchema.parse(req.body);
  const ctx = await loadContext();
  if (ctx.s.chatbot?.enabled === false) throw new ApiError(404, 'Chat is turned off');

  const result = flow && leadsOn(ctx.s) ? advance(message, flow as Flow, ctx) : answerQuestion(message, ctx);
  if (!result.submit) return res.json({ reply: result.reply, suggestions: result.suggestions, flow: result.flow ?? null });

  // The visitor confirmed: validate again (never trust the client's copy), then save as an enquiry.
  const parsed = submitSchema.safeParse(result.submit);
  if (!parsed.success) return res.json({ ...begin({}, ctx, 'Sorry, some details were missing.'), flow: begin({}, ctx).flow });
  const d = parsed.data;
  const phone = ctx.s.contact?.phone;

  if (!allowChatEnquiry(req.ip ?? 'unknown')) {
    return res.json({ reply: `We have already received several requests from your connection. ${phone ? `Please call us on ${phone}` : 'Please use the enquiry form on this page'} and we will help you directly.`, suggestions: INITIAL, flow: null });
  }
  const duplicate = await Enquiry.findOne({ phone: d.phone, createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } });
  if (!duplicate) await Enquiry.create({ name: d.name, phone: d.phone, interest: d.interest || undefined, message: d.message || undefined, source: 'chatbot' });

  const hours = ctx.s.contact?.hours;
  res.json({
    reply: `Thank you ${firstName(d.name)}! Your details are with our team and they will call you on ${d.phone}.${hours ? ` Our office hours are ${hours}.` : ''}\n\nIs there anything else I can help you with?`,
    suggestions: INITIAL,
    flow: null,
    submitted: true,
  });
});
