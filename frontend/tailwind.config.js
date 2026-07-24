/** @type {import('tailwindcss').Config} */
// Design tokens for the "Liquid Glass" language — near-black canvas, volt
// accent, emerald secondary family, generous radii, soft glow shadows.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A', // app background
        panel: 'rgba(32,32,32,0.55)', // card base
        edge: 'rgba(255,255,255,0.08)', // hairline borders
        accent: {
          DEFAULT: '#D7FF1F', // primary volt
          dim: '#AACC19',
        },
        lime: '#9FFF2D', // success
        mint: {
          DEFAULT: '#10B981', // secondary emerald family
          deep: '#047857',
          soft: '#34D399',
        },
        txt: {
          DEFAULT: '#FFFFFF',
          sec: '#B5B5B5',
          mut: '#6F6F6F',
        },
        danger: '#FF5A5A',
        warn: '#FFC93D',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        btn: '18px',
        input: '16px',
        sheet: '28px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glow-accent': '0 0 42px rgba(215,255,31,0.14)',
        'glow-mint': '0 0 42px rgba(16,185,129,0.18)',
        lift: '0 16px 48px rgba(0,0,0,0.45)',
      },
      keyframes: {
        // slow drifting gradient blobs behind the glass
        blob: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(60px,-40px) scale(1.15)' },
          '66%': { transform: 'translate(-40px,50px) scale(0.92)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
        // gentle vertical float for dashboard widgets
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        // map marker pulse ring
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
      animation: {
        blob: 'blob 26s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.22,1,0.36,1) infinite',
      },
    },
  },
  plugins: [],
};
