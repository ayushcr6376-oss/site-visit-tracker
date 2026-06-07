/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#3B5BDB',
          600: '#2F4AC0',
          700: '#1E3A8A',
          800: '#172554',
          900: '#0F1D4A',
        },
        premium: {
          gray: '#F5F5F7',
          'gray-mid': '#E8E8ED',
          'gray-dark': '#86868B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 2px 16px rgba(30, 58, 138, 0.06)',
        card: '0 4px 24px rgba(30, 58, 138, 0.08)',
        modal: '0 24px 48px rgba(15, 29, 74, 0.18)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
