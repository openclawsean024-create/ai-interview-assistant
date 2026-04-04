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
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: '#818CF8',
        },
        gold: '#F59E0B',
        emerald: '#10B981',
        danger: '#EF4444',
        bg: '#09090B',
        surface: '#18181B',
        'surface-light': '#27272A',
        border: '#3F3F46',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
        'listening': 'listening-pulse 1.2s ease-in-out infinite',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.2)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
    },
  },
  plugins: [],
};
