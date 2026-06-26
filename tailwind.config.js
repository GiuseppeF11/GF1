/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'f1-red': '#E10600',
        'f1-dark': '#15151e',
        'f1-surface': '#1e1e2e',
        'f1-border': '#2a2a3e',
        'f1-muted': '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
