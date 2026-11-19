/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8' },
        violet: { DEFAULT: '#7C3AED', dark: '#6D28D9' },
      }
    }
  },
  plugins: []
}
