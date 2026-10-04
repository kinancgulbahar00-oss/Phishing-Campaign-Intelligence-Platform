export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#060A12',
        surface: {
          DEFAULT: '#0A101C',
          2: '#0F1726',
          3: '#151F33',
        },
        line: {
          DEFAULT: '#1B2740',
          strong: '#253453',
        },
        ink: {
          DEFAULT: '#E8EDF7',
          2: '#9AA8C0',
          3: '#6B7A94',
        },
        brand: {
          50: '#FBF4DE',
          200: '#E9D08A',
          300: '#DCBC63',
          400: '#C9A227',
          500: '#B8912F',
          600: '#8F6F1E',
          900: '#3A2D0C',
        },
        risk: {
          critical: '#F04438',
          high: '#FF7A45',
          medium: '#FDB022',
          low: '#12B76A',
          info: '#5B8DEF',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        panel: '14px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -18px rgba(0,0,0,0.9)',
        lift: '0 18px 40px -22px rgba(0,0,0,0.95)',
        gold: '0 0 0 1px rgba(201,162,39,0.35), 0 10px 30px -12px rgba(201,162,39,0.35)',
      },
      backgroundImage: {
        'hairline-t': 'linear-gradient(90deg, transparent, rgba(201,162,39,0.35), transparent)',
        'panel-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0) 42%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
