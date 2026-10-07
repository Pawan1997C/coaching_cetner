import type { CSSProperties } from 'react';

export type Radius = 'sharp' | 'soft' | 'round';
export interface Theme {
  preset: string;
  brand: string;
  accent: string;
  highlight: string;
  fontDisplay: string;
  fontBody: string;
  radius: Radius;
  applyToAdmin: boolean;
}

export const PRESETS = [
  { id: 'pen-blue', name: 'Pen blue', brand: '#1B2A7A', accent: '#D63B2F', highlight: '#FFE066' },
  { id: 'forest', name: 'Forest', brand: '#1F5F4A', accent: '#C8553D', highlight: '#F2D16B' },
  { id: 'maroon', name: 'Maroon', brand: '#7A1F3D', accent: '#1F6F8B', highlight: '#F4C95D' },
  { id: 'teal', name: 'Teal', brand: '#0F6B73', accent: '#E4572E', highlight: '#FFD166' },
  { id: 'violet', name: 'Violet', brand: '#4B2E83', accent: '#E0457B', highlight: '#FFE066' },
  { id: 'charcoal', name: 'Charcoal', brand: '#23272F', accent: '#E8590C', highlight: '#FFD43B' },
];

// Display fonts either have a single bold weight (serifs) or are used at 600.
export const DISPLAY_FONTS = [
  { name: 'Young Serif', css: '"Young Serif", Georgia, serif', gf: 'Young+Serif', weight: 400 },
  { name: 'DM Serif Display', css: '"DM Serif Display", Georgia, serif', gf: 'DM+Serif+Display', weight: 400 },
  { name: 'Fraunces', css: 'Fraunces, Georgia, serif', gf: 'Fraunces:wght@600', weight: 600 },
  { name: 'Playfair Display', css: '"Playfair Display", Georgia, serif', gf: 'Playfair+Display:wght@600', weight: 600 },
  { name: 'Bricolage Grotesque', css: '"Bricolage Grotesque", system-ui, sans-serif', gf: 'Bricolage+Grotesque:wght@600', weight: 600 },
  { name: 'Poppins', css: 'Poppins, system-ui, sans-serif', gf: 'Poppins:wght@400;500;600;700', weight: 600 },
];
export const BODY_FONTS = [
  { name: 'Figtree', css: 'Figtree, system-ui, sans-serif', gf: 'Figtree:wght@400;500;600;700' },
  { name: 'Inter', css: 'Inter, system-ui, sans-serif', gf: 'Inter:wght@400;500;600;700' },
  { name: 'DM Sans', css: '"DM Sans", system-ui, sans-serif', gf: 'DM+Sans:wght@400;500;600;700' },
  { name: 'Nunito Sans', css: '"Nunito Sans", system-ui, sans-serif', gf: 'Nunito+Sans:wght@400;600;700' },
  { name: 'Poppins', css: 'Poppins, system-ui, sans-serif', gf: 'Poppins:wght@400;500;600;700' },
  { name: 'Source Sans 3', css: '"Source Sans 3", system-ui, sans-serif', gf: 'Source+Sans+3:wght@400;600;700' },
];

export const RADII: Record<Radius, { label: string; md: string; lg: string; xl: string; '2xl': string }> = {
  sharp: { label: 'Sharp', md: '2px', lg: '3px', xl: '4px', '2xl': '6px' },
  soft: { label: 'Soft', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
  round: { label: 'Round', md: '0.5rem', lg: '0.75rem', xl: '1.25rem', '2xl': '1.75rem' },
};

export const DEFAULT_THEME: Theme = {
  preset: 'pen-blue', brand: '#1B2A7A', accent: '#D63B2F', highlight: '#FFE066',
  fontDisplay: 'Young Serif', fontBody: 'Figtree', radius: 'soft', applyToAdmin: true,
};

const HEX = /^#[0-9a-fA-F]{6}$/;
export const normalizeTheme = (t?: Partial<Theme> | null): Theme => {
  const m = { ...DEFAULT_THEME, ...(t ?? {}) };
  return {
    ...m,
    brand: HEX.test(m.brand) ? m.brand : DEFAULT_THEME.brand,
    accent: HEX.test(m.accent) ? m.accent : DEFAULT_THEME.accent,
    highlight: HEX.test(m.highlight) ? m.highlight : DEFAULT_THEME.highlight,
    fontDisplay: DISPLAY_FONTS.some((f) => f.name === m.fontDisplay) ? m.fontDisplay : DEFAULT_THEME.fontDisplay,
    fontBody: BODY_FONTS.some((f) => f.name === m.fontBody) ? m.fontBody : DEFAULT_THEME.fontBody,
    radius: m.radius in RADII ? m.radius : 'soft',
    applyToAdmin: m.applyToAdmin !== false,
  };
};

// ---- colour maths ----
const toRgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const toHex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const WHITE = [255, 255, 255];
const NEAR_BLACK = [10, 12, 20];

const lum = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Every colour the UI uses, derived from the three the admin picks. */
export const resolveColors = (t: Theme) => {
  const brand = toRgb(t.brand);
  const ink = mix(brand, NEAR_BLACK, 0.82);
  return {
    brand: t.brand, pen: t.accent, hl: t.highlight,
    brandDark: toHex(mix(brand, [0, 0, 0], 0.35)),
    brandSoft: toHex(mix(brand, WHITE, 0.9)),
    canvas: toHex(mix(brand, WHITE, 0.955)),
    line: toHex(mix(brand, WHITE, 0.88)),
    ink: toHex(ink),
    mute: toHex(mix(ink, WHITE, 0.35)),
  };
};

const trip = (hex: string) => toRgb(hex).join(' ');

/** CSS variables for a theme. Used on <html> and (scoped) on the customizer preview. */
export const themeVars = (t: Theme): Record<string, string> => {
  const c = resolveColors(t);
  const r = RADII[t.radius];
  const d = DISPLAY_FONTS.find((f) => f.name === t.fontDisplay)!;
  const b = BODY_FONTS.find((f) => f.name === t.fontBody)!;
  return {
    '--brand': trip(c.brand), '--brand-dark': trip(c.brandDark), '--brand-soft': trip(c.brandSoft),
    '--pen': trip(c.pen), '--hl': trip(c.hl), '--canvas': trip(c.canvas), '--line': trip(c.line),
    '--ink': trip(c.ink), '--mute': trip(c.mute),
    '--font-display': d.css, '--font-body': b.css, '--display-weight': String(d.weight),
    '--r-md': r.md, '--r-lg': r.lg, '--r-xl': r.xl, '--r-2xl': r['2xl'],
  };
};
export const themeStyle = (t: Theme) => themeVars(t) as CSSProperties;

// ---- fonts ----
const LINK_ID = 'theme-fonts';
const setFontLink = (families: string[]) => {
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!families.length) return link?.remove();
  if (!link) { link = document.createElement('link'); link.id = LINK_ID; link.rel = 'stylesheet'; document.head.appendChild(link); }
  const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
  if (link.href !== href) link.href = href;
};
// index.html already loads the default pair, so only add fonts that differ.
export const ensureFonts = (t: Theme) => {
  const d = DISPLAY_FONTS.find((f) => f.name === t.fontDisplay)!;
  const b = BODY_FONTS.find((f) => f.name === t.fontBody)!;
  const need = new Set<string>();
  if (d.name !== DEFAULT_THEME.fontDisplay) need.add(d.gf);
  if (b.name !== DEFAULT_THEME.fontBody) need.add(b.gf);
  setFontLink([...need]);
};
/** Load every option so the customizer can preview each font. */
export const loadAllFonts = () => setFontLink([...new Set([...DISPLAY_FONTS.map((f) => f.gf), ...BODY_FONTS.map((f) => f.gf)])]);

export const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  Object.entries(themeVars(t)).forEach(([k, v]) => root.style.setProperty(k, v));
  ensureFonts(t);
};

const KEY = 'theme-v1';
export const readCachedTheme = (): Theme => {
  try { return normalizeTheme(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { return DEFAULT_THEME; }
};
export const cacheTheme = (t: Theme) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ } };
