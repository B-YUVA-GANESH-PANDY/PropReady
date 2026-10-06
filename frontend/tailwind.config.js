/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F8FAFC',
          secondary: '#FFFFFF',
          tertiary: '#F1F5F9',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        blue: {
          PRIMARY: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        teal: {
          DEFAULT: '#0D9488',
          light: '#CCFBF1',
          hover: '#0F766E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          elevated: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E2E8F0',
          subtle: '#F1F5F9',
          active: '#CBD5E1',
        },
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        accent: {
          blue: '#2563EB',
          teal: '#0D9488',
          tealLight: '#CCFBF1',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        nodeActive: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(37, 99, 235, 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(37, 99, 235, 0)' },
        }
      },
      animation: {
        scanline: 'scanline 2.5s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        nodeActive: 'nodeActive 1.5s ease-out infinite',
      }
    },
  },
  plugins: [],
}
