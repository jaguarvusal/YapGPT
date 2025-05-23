/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)' },
          '50%': { transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite'
      }
    },
  },
  plugins: [],
} 