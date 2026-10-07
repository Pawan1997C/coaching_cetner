/** @type {import('tailwindcss').Config} */
// Colours, fonts and corner radii come from CSS variables so the admin can retheme the site (see src/lib/theme.ts).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        brand: { DEFAULT: v('brand'), dark: v('brand-dark'), soft: v('brand-soft') },
        pen: v('pen'),
        hl: v('hl'),
        star: '#F2A60D',
        success: '#148A5B',
        canvas: v('canvas'),
        line: v('line'),
        mute: v('mute'),
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
      },
      borderRadius: { md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)', '2xl': 'var(--r-2xl)' },
    },
  },
  plugins: [],
};
