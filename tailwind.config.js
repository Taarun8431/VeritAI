/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          glow: 'var(--primary-glow)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        verdict: {
          true: 'var(--verdict-true)',
          false: 'var(--verdict-false)',
          partial: 'var(--verdict-partial)',
          conflict: 'var(--verdict-conflict)',
          unknown: 'var(--verdict-unknown)',
          temporal: 'var(--verdict-temporal)',
          'true-bg': 'var(--verdict-true-bg)',
          'false-bg': 'var(--verdict-false-bg)',
          'partial-bg': 'var(--verdict-partial-bg)',
          'conflict-bg': 'var(--verdict-conflict-bg)',
          'unknown-bg': 'var(--verdict-unknown-bg)',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'drift-slow': 'drift 20s infinite alternate ease-in-out',
        'drift-slower': 'drift 25s infinite alternate-reverse ease-in-out',
        'draw-underline': 'draw-underline 1s ease forwards',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.4)' },
          '100%': { boxShadow: '0 0 0 10px rgba(124, 58, 237, 0)' },
        },
        'fadeUp': {
          'from': { transform: 'translateY(16px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'drift': {
          'from': { transform: 'translate(0, 0)' },
          'to': { transform: 'translate(40px, 40px)' },
        },
        'draw-underline': {
          'from': { width: '0%' },
          'to': { width: '100%' },
        }
      },
      boxShadow: {
        'verit': 'var(--card-shadow)',
        'verit-hover': 'var(--card-shadow-hover)',
      }
    },
  },
  plugins: [],
}
