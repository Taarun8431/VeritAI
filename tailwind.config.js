/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: '#080b0f',
        card: '#0d1117',
        elevated: '#161b22',
        sidebar: '#21262d',
        input: '#30363d',
        hover: '#21262d',
        border: 'rgba(240,246,252,0.1)',
        'border-hover': 'rgba(240,246,252,0.2)',
        primary: {
          DEFAULT: '#58a6ff',
          dark: '#79c0ff',
          light: 'rgba(56,139,253,0.1)',
          glow: 'rgba(56,139,253,0.25)',
        },
        text: {
          primary: '#f0f6fc',
          secondary: '#c9d1d9',
          muted: '#8b949e',
          sidebar: 'rgba(240,246,252,0.75)',
          'sidebar-active': '#f0f6fc',
        },
        verdict: {
          true: '#56d364',
          false: '#f85149',
          partial: '#d29922',
          conflict: '#bb8009',
          unknown: '#8b949e',
          temporal: '#79c0ff',
        },
        shadow: {
          sm: '0 1px 3px rgba(1,4,9,0.12), 0 1px 2px rgba(1,4,9,0.24)',
          md: '0 4px 6px rgba(1,4,9,0.12), 0 2px 4px rgba(1,4,9,0.24)',
          lg: '0 10px 15px rgba(1,4,9,0.12), 0 4px 6px rgba(1,4,9,0.24)',
          card: '0 1px 4px rgba(1,4,9,0.12), 0 0px 0px rgba(1,4,9,0.08), 0 1px 2px rgba(1,4,9,0.16)',
          stat: '0 4px 20px rgba(1,4,9,0.14)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'count': 'count 1s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
        'scanline': 'scanline 3s linear infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(56,139,253,0.5)' },
          '100%': { boxShadow: '0 0 0 8px rgba(56,139,253,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        count: {
          from: { '--count': '0' },
          to: { '--count': 'var(--final-count)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
