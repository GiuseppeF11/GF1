/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center:true
    },
    extend: {
      colors: {
        '--red': '#E10600',
        '--black': '#000000', 
        '--grey': '#999999',
        '--white': '#FFFFFF',
      }

    },
  },
  plugins: [],
}

