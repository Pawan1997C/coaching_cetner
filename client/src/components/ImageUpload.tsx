import { useState } from 'react';
import { errMsg } from '../lib/api';

/** Shows the current image and uploads a new one as soon as a file is chosen. */
export default function ImageUpload({ label, current, onUpload }: { label: string; current?: string; onUpload: (file: File) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { await onUpload(file); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        {current ? <img src={current} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded bg-canvas text-xs text-mute">None</div>}
        <input type="file" accept="image/*" disabled={busy} className="text-sm" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {busy && <p className="mt-1 text-xs text-mute">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-pen">{error}</p>}
    </div>
  );
}
