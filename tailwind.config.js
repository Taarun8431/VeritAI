/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        sidebar: 'var(--bg-sidebar)',
        primary: {
          DEFAULT: '#7c3aed',
          dark: '#4f46e5',
          light: 'var(--primary-light)',
        },
        verdict: {
          true: '#10b981',
          false: '#ef4444',
          partial: '#f59e0b',
          conflict: '#f97316',
          unknown: '#64748b',
          temporal: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        display: ['Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'count': 'count 1s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.5)' },
          '100%': { boxShadow: '0 0 0 8px rgba(124,58,237,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
