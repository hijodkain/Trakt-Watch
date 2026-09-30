/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          elevated: '#14141e',
          card: '#1a1a24',
        },
        fg: {
          DEFAULT: '#f5f5f5',
          muted: '#8b8b9a',
          subtle: '#5a5a6a',
        },
        accent: {
          DEFAULT: '#e50914',
          hover: '#f40612',
          light: '#ff1a1a',
        },
        border: {
          DEFAULT: '#2a2a3a',
          light: '#3a3a4a',
        },
        poster: {
          overlay: 'linear-gradient(180deg, transparent 40%, #0a0a0f 100%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        poster: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        'poster-hover': '0 30px 60px -20px rgba(229, 9, 20, 0.3)',
        glow: '0 0 30px rgba(229, 9, 20, 0.4)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};