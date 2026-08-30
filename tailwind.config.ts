import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          royal: '#2563EB',
          hover: '#1D4ED8',
        },
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        success: { DEFAULT: '#059669', surface: '#ECFDF5' },
        warning: { DEFAULT: '#D97706', surface: '#FFFBEB' },
        danger: { DEFAULT: '#DC2626', surface: '#FEF2F2' },
        info: '#0284C7',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
      },
      keyframes: {
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.72' },
        },
      },
      animation: {
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
