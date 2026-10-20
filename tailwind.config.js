/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"DM Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#0b0b0b',
        rail: '#2b2b2b',
        pine: { DEFAULT: '#2f5d4a', dark: '#24493a', light: '#e6f0eb' },
        mint: '#5fd0a6',
        teal: '#0e9aa7',
        sky: '#3a8fc7',
        grape: '#7b3fe4',
        alert: '#d93f3f',
        venue: { DEFAULT: '#1f4d3a', accent: '#e8a33d' },
      },
      boxShadow: { card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)' },
    },
  },
  plugins: [],
}
