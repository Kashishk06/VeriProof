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
          primary: '#050816',
          surface: '#0B1020',
          elevated: '#11182B',
          card: '#0D1526',
        },
        cyan: {
          primary: '#22D3EE',
          glow: '#06B6D4',
          dim: '#0891B2',
        },
        blue: {
          accent: '#3B82F6',
          dim: '#1D4ED8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        crimson: '#DC2626',
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        border: 'rgba(148,163,184,0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)',
        'hero-gradient': 'radial-gradient(ellipse at 60% 50%, rgba(34,211,238,0.08) 0%, rgba(59,130,246,0.05) 30%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(17,24,43,0.9) 0%, rgba(11,16,32,0.95) 100%)',
        'glow-cyan': 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(34,211,238,0.1), 0 4px 20px rgba(0,0,0,0.5)',
        'cyber-hover': '0 0 30px rgba(34,211,238,0.2), 0 8px 30px rgba(0,0,0,0.6)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.4)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'particle': 'particle 8s linear infinite',
        'data-stream': 'dataStream 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dataStream: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
    },
  },
  plugins: [],
}
