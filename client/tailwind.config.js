/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121936', // text: blue-black ink
        brand: { DEFAULT: '#1B2A7A', dark: '#121C57', soft: '#E8EBFA' }, // fountain-pen blue
        pen: '#D63B2F', // teacher's red pen: marks, alerts, pending
        hl: '#FFE066', // highlighter yellow
        star: '#F2A60D',
        success: '#148A5B',
        canvas: '#F5F6FB',
        line: '#DFE3F0',
        mute: '#59607F',
      },
      fontFamily: {
        display: ['"Young Serif"', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
