/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // v3.0 Design System (ui-ux-pro-max recommendation)
        primary: {
          DEFAULT: '#0D9488',     // teal-600
          hover:   '#0F766E',     // teal-700
          soft:    'rgba(13, 148, 136, 0.15)',
          ring:    'rgba(13, 148, 136, 0.45)',
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        accent: {
          DEFAULT: '#EA580C',     // orange-600
          hover:   '#C2410C',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        surface: {
          DEFAULT: '#111827',     // gray-900 — card base
          elevated: '#1E293B',    // slate-800
          hover:    '#1F2937',
          subtle:   '#334155',    // slate-700
        },
        bg: '#0F172A',             // slate-900
        ink: {
          DEFAULT: '#F8FAFC',     // slate-50 — primary text
          secondary: '#CBD5E1',
          muted:     '#94A3B8',
          disabled:  '#64748B',
          inverse:   '#0F172A',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  { DEFAULT: '#DC2626', hover: '#B91C1C' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        tc:   ['Noto Sans TC', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        // 4pt scale, baseline 16px
        'display': ['3.5rem',   { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1':      ['2.5rem',   { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2':      ['2rem',     { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'h3':      ['1.5rem',   { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'h4':      ['1.25rem',  { lineHeight: '1.4',                              fontWeight: '600' }],
        'body':    ['1rem',     { lineHeight: '1.6' }],
        'sm':      ['0.875rem', { lineHeight: '1.5' }],
        'xs':      ['0.75rem',  { lineHeight: '1.45' }],
      },
      spacing: {
        // 4pt grid (UI-UX §5 spacing scale)
        '1': '4px', '2': '8px', '3': '12px', '4': '16px',
        '5': '20px', '6': '24px', '8': '32px', '10': '40px',
        '12': '48px', '16': '64px', '20': '80px', '24': '96px', '32': '128px',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
        'full': '9999px',
      },
      maxWidth: {
        'prose': '65ch',
        'container': '1200px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow':  'spin-slow 1.2s linear infinite',
        'listening':  'listening-pulse 1.2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        spinSlow:  { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        listeningPulse: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '1' },
          '50%':      { transform: 'scale(1.15)', opacity: '0.7' },
        },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow-primary': '0 0 0 4px rgba(13, 148, 136, 0.15)',
        'glow-accent':  '0 4px 14px rgba(234, 88, 12, 0.35)',
        'card':         '0 1px 3px rgba(0, 0, 0, 0.2)',
        'card-hover':   '0 8px 24px rgba(0, 0, 0, 0.3)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
