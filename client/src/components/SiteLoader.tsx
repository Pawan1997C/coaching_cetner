import { Wifi } from 'lucide-react';

const Bar = ({ className = '' }: { className?: string }) => <div className={`shimmer ${className}`} />;

/** Skeleton that mirrors the real home page (header, headline, marksheet) so nothing jumps when content arrives. */
export function SiteLoader() {
  return (
    <div className="min-h-screen bg-white" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading the website</span>
      <div className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5"><Bar className="h-9 w-9" /><Bar className="h-5 w-36" /></div>
          <div className="hidden items-center gap-6 md:flex">{[14, 12, 16, 12].map((w, i) => <Bar key={i} className="h-4" />)}<Bar className="h-9 w-28" /></div>
        </div>
      </div>

      <div className="graph">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 md:grid-cols-[1.1fr_1fr] md:pt-24">
          <div className="space-y-4">
            <Bar className="h-7 w-36 !rounded-full" />
            <Bar className="h-12 w-full" />
            <Bar className="h-12 w-5/6" />
            <Bar className="h-12 w-2/3" />
            <div className="space-y-2 pt-3"><Bar className="h-4 w-full max-w-md" /><Bar className="h-4 w-4/5 max-w-md" /></div>
            <div className="flex gap-3 pt-4"><Bar className="h-12 w-52 !rounded-xl" /><Bar className="h-12 w-32 !rounded-xl" /></div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="sheet sheet-idle relative rounded-md border border-line p-7 pl-16 shadow-[0_18px_40px_-12px_rgba(18,25,54,0.2)]">
              <Bar className="mb-2 h-3 w-24" />
              <Bar className="mb-5 h-7 w-48" />
              <div className="space-y-0">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="relative flex h-10 items-end justify-between gap-4 pb-1">
                    <Bar className="h-4 w-32" />
                    <div className="relative">
                      <Bar className="h-6 w-16" />
                      {i === 0 && (
                        <svg viewBox="0 0 120 56" className="pointer-events-none absolute -left-4 -top-3 h-14 w-[calc(100%+2rem)] min-w-24" fill="none" aria-hidden preserveAspectRatio="none">
                          <path className="scribble stroke-pen" pathLength={1} d="M8 30C8 12 40 4 64 6c28 2 50 12 48 26-2 14-34 20-62 18C26 48 6 42 8 28" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="graph grid min-h-screen place-items-center p-6">
      <div className="max-w-sm rounded-xl border border-line bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-pen/10 text-pen"><Wifi size={22} /></span>
        <h1 className="text-2xl">We could not load the site</h1>
        <p className="mt-2 text-sm text-mute">{message || 'Please check your connection and try again.'}</p>
        <button className="btn btn-primary btn-lg mt-6" onClick={onRetry}>Try again</button>
      </div>
    </div>
  );
}
