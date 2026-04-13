export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:      '#07100F',
          accent:    '#2D6352',
          secondary: '#3E8A6E',
          highlight: '#7DDBB8',
          text:      '#E4F5EE',
          muted:     '#6B9E8A',
          surface:   '#0B1A16',
          border:    '#1C3D35',
          danger:    '#E05252',
          warning:   '#E8993C',
          success:   '#3EBD8A',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(45,99,82,0.4)',
        'glow':    '0 0 24px rgba(45,99,82,0.35)',
        'glow-lg': '0 0 48px rgba(45,99,82,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
