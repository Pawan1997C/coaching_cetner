import { FormEvent, useEffect, useState } from 'react';
import api, { Doc, errMsg } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Field, Spinner } from '../../components/ui';
import { toast } from '../../lib/toast';
import { useSite } from '../../context/SiteContext';
import ImageUpload from '../../components/ImageUpload';
import ListEditor from '../../components/ListEditor';

export default function SettingsTab() {
  const { data, reload } = useFetch<Doc>('/site');
  const site = useSite();
  const [s, setS] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return <Spinner />;

  const set = (k: string, v: any) => setS({ ...s, [k]: v });
  const nested = (g: string, k: string, v: string) => setS({ ...s, [g]: { ...(s[g] ?? {}), [k]: v } });
  const upload = (path: string, label: string) => async (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    const { data: updated } = await api.put(`/site/${path}`, fd);
    setS((cur) => (cur ? { ...cur, logo: updated.logo, heroImage: updated.heroImage } : cur)); // keep unsaved text edits
    site.patchSettings(updated);
    toast.success(`${label} updated`);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { theme, chatbot, ...rest } = s; // those have their own tabs
      const { data: saved } = await api.put('/site', rest);
      site.patchSettings(saved); // the website and admin header update straight away
      reload();
      toast.success('Website details saved. Changes are live.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <section className="panel space-y-4">
        <h2 className="text-lg font-semibold">Brand and home page</h2>
        <Field label="Centre name"><input className="input" required value={s.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Tagline (shown in the browser tab)"><input className="input" value={s.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
        <Field label="Home page headline"><input className="input" value={s.heroTitle ?? ''} onChange={(e) => set('heroTitle', e.target.value)} /></Field>
        <Field label="Home page sub-headline"><textarea className="input" rows={2} value={s.heroSubtitle ?? ''} onChange={(e) => set('heroSubtitle', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Logo" current={s.logo?.url} onUpload={upload('logo', 'Logo')} />
          <ImageUpload label="Home page photo (optional)" current={s.heroImage?.url} onUpload={upload('hero', 'Home page photo')} />
        </div>
      </section>

      <section className="panel space-y-5">
        <h2 className="text-lg font-semibold">About</h2>
        <Field label="About the centre (blank lines start a new paragraph)"><textarea className="input" rows={6} value={s.about ?? ''} onChange={(e) => set('about', e.target.value)} /></Field>
        <ListEditor title="Numbers (shown under the headline)" addLabel="Add number" items={s.stats ?? []} onChange={(v) => set('stats', v)} fields={[{ key: 'value', label: 'Value, e.g. 2,500+' }, { key: 'label', label: 'Label, e.g. Students taught' }]} />
        <ListEditor title="Why choose us" addLabel="Add point" items={s.highlights ?? []} onChange={(v) => set('highlights', v)} fields={[{ key: 'title', label: 'Title' }, { key: 'text', label: 'Short description', area: true }]} />
      </section>

      <section className="panel space-y-4">
        <h2 className="text-lg font-semibold">Contact and location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><input className="input" value={s.contact?.phone ?? ''} onChange={(e) => nested('contact', 'phone', e.target.value)} /></Field>
          <Field label="WhatsApp number (with country code)"><input className="input" placeholder="919876543210" value={s.contact?.whatsapp ?? ''} onChange={(e) => nested('contact', 'whatsapp', e.target.value)} /></Field>
          <Field label="Email"><input className="input" type="email" value={s.contact?.email ?? ''} onChange={(e) => nested('contact', 'email', e.target.value)} /></Field>
          <Field label="Opening hours"><input className="input" placeholder="Mon-Sat, 7 AM - 8 PM" value={s.contact?.hours ?? ''} onChange={(e) => nested('contact', 'hours', e.target.value)} /></Field>
        </div>
        <Field label="Address"><textarea className="input" rows={2} value={s.contact?.address ?? ''} onChange={(e) => nested('contact', 'address', e.target.value)} /></Field>
        <Field label="Map location (address, landmark, or latitude,longitude. Leave empty to use the address)"><input className="input" value={s.mapQuery ?? ''} onChange={(e) => set('mapQuery', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Facebook link"><input className="input" value={s.social?.facebook ?? ''} onChange={(e) => nested('social', 'facebook', e.target.value)} /></Field>
          <Field label="Instagram link"><input className="input" value={s.social?.instagram ?? ''} onChange={(e) => nested('social', 'instagram', e.target.value)} /></Field>
          <Field label="YouTube link"><input className="input" value={s.social?.youtube ?? ''} onChange={(e) => nested('social', 'youtube', e.target.value)} /></Field>
        </div>
      </section>

      <section className="panel">
        <ListEditor title="Frequently asked questions" addLabel="Add question" items={s.faqs ?? []} onChange={(v) => set('faqs', v)} fields={[{ key: 'question', label: 'Question' }, { key: 'answer', label: 'Answer', area: true }]} />
      </section>

      <button className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
