import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from './SiteContext';
import { DEFAULT_THEME, Theme, applyTheme, cacheTheme, normalizeTheme, readCachedTheme, resolveColors } from '../lib/theme';

/**
 * Applies the theme the admin chose (stored in site settings) as CSS variables on <html>.
 * - The admin panel only uses it when "applyToAdmin" is on.
 * - `preview()` lets the customizer show unsaved changes live.
 */
interface Ctx { saved: Theme; colors: ReturnType<typeof resolveColors>; preview: (t: Theme | null) => void }
const ThemeContext = createContext<Ctx>(null as any);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data, load } = useSite();
  const { pathname } = useLocation();
  const [draft, setDraft] = useState<Theme | null>(null);

  useEffect(() => { load(); }, [load]); // the theme lives in site settings, so make sure they are loaded everywhere

  const raw = data?.settings?.theme;
  const saved = useMemo(() => normalizeTheme(raw ?? readCachedTheme()), [raw]);
  useEffect(() => { if (raw) cacheTheme(saved); }, [raw, saved]);

  const base = draft ?? saved;
  const onAdmin = pathname.startsWith('/admin');
  const effective = useMemo(() => (onAdmin && !base.applyToAdmin ? DEFAULT_THEME : base), [onAdmin, base]);
  useLayoutEffect(() => applyTheme(effective), [effective]);

  const value = useMemo(() => ({ saved, colors: resolveColors(effective), preview: setDraft }), [saved, effective]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
