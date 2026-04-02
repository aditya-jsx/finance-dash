/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A', // Slate 900
        surface: '#1E293B',    // Slate 800
        primary: '#3B82F6',    // Blue 500
        secondary: '#10B981',  // Emerald 500
        danger: '#EF4444',     // Red 500
        text: '#F8FAFC',       // Slate 50
        muted: '#94A3B8',      // Slate 400
      }
    },
  },
  plugins: [],
}
