/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1F2937',
        muted: {
          DEFAULT: '#374151',
          foreground: '#9CA3AF'
        },
        border: 'rgba(255,255,255,0.1)'
      },
      animation: {
        'in': 'in 0.7s ease-in forwards',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        in: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
