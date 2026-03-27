/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#EFF6FF'
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0891B2',
        sidebar: {
          bg: '#0F172A',
          text: '#94A3B8',
          active: '#2563EB',
          hover: '#1E293B'
        },
        surface: {
          app: '#F8FAFC',
          card: '#FFFFFF',
          'table-alt': '#F8FAFC',
          border: '#E2E8F0'
        },
        txt: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 200ms ease-out',
        'scale-in': 'scale-in 200ms ease-out'
      }
    }
  },
  plugins: []
}
