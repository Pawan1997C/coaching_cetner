import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import api, { Doc, errMsg } from '../lib/api';

/**
 * Global store for the public site data (settings, classes, faculty, reviews).
 * - The website reads it, the admin panel reads it for branding, and admin edits push changes into it,
 *   so every screen stays in sync without a page reload.
 * - The last response is cached in sessionStorage, so repeat visits render instantly while a fresh copy loads.
 */
export interface SiteData {
  settings: Doc;
  courses: Doc[];
  faculty: Doc[];
  reviews: Doc[];
  rating: { average: number; count: number };
}
type Status = 'idle' | 'loading' | 'ready' | 'error';
interface State { data: SiteData | null; status: Status; error: string; fetchedAt: number }
type Action =
  | { type: 'start' }
  | { type: 'success'; data: SiteData }
  | { type: 'failure'; error: string }
  | { type: 'patchSettings'; settings: Doc };

const CACHE_KEY = 'site-data-v1';
const STALE_MS = 60_000;

const readCache = (): SiteData | null => {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null'); } catch { return null; }
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'start':
      return state.data ? state : { ...state, status: 'loading', error: '' }; // keep showing what we have
    case 'success':
      return { data: action.data, status: 'ready', error: '', fetchedAt: Date.now() };
    case 'failure':
      return state.data ? { ...state, error: action.error } : { ...state, status: 'error', error: action.error };
    case 'patchSettings':
      return state.data ? { ...state, data: { ...state.data, settings: action.settings } } : state;
  }
};

interface Ctx extends State {
  load: () => Promise<void>; // fetch if nothing loaded yet or the copy is stale
  refresh: () => Promise<void>; // always fetch (call after changing classes, faculty or reviews)
  patchSettings: (settings: Doc) => void; // instant update after saving site settings
}
const SiteContext = createContext<Ctx>(null as any);
export const useSite = () => useContext(SiteContext);

export function SiteProvider({ children }: { children: ReactNode }) {
  const cached = useMemo(readCache, []);
  const [state, dispatch] = useReducer(reducer, { data: cached, status: cached ? 'ready' : 'idle', error: '', fetchedAt: 0 });
  const ref = useRef(state);
  ref.current = state;
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (state.data) try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(state.data)); } catch { /* storage full or blocked */ }
  }, [state.data]);

  const doFetch = useCallback(async () => {
    dispatch({ type: 'start' });
    try {
      dispatch({ type: 'success', data: (await api.get('/public/site')).data });
    } catch (e) {
      dispatch({ type: 'failure', error: errMsg(e) });
    }
  }, []);

  const run = useCallback((force: boolean) => {
    if (inflight.current && !force) return inflight.current;
    const p = inflight.current ? inflight.current.then(doFetch) : doFetch(); // a forced refresh waits for the older request
    inflight.current = p;
    p.finally(() => { if (inflight.current === p) inflight.current = null; });
    return p;
  }, [doFetch]);

  const load = useCallback(() => {
    const { fetchedAt, status } = ref.current;
    if (status === 'error' || fetchedAt === 0 || Date.now() - fetchedAt > STALE_MS) return run(false);
    return Promise.resolve();
  }, [run]);
  const refresh = useCallback(() => run(true), [run]);
  const patchSettings = useCallback((settings: Doc) => dispatch({ type: 'patchSettings', settings }), []);

  const value = useMemo(() => ({ ...state, load, refresh, patchSettings }), [state, load, refresh, patchSettings]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
