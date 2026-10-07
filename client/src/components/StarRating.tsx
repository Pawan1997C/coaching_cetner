import { useState } from 'react';
import { Star } from 'lucide-react';

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Clickable 1-5 star input with keyboard support (arrow keys move the selection). */
export default function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(5, value + 1)); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(1, value - 1)); }
  };
  return (
    <div>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)} onKeyDown={onKey}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} tabIndex={value === n ? 0 : -1}
            onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} className="rounded p-0.5 transition-transform hover:scale-110">
            <Star size={32} className={n <= shown ? 'fill-star text-star' : 'text-line'} />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm text-mute" aria-live="polite">{shown ? LABELS[shown - 1] : ''}</p>
    </div>
  );
}
