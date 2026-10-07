const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Renkler CSS degiskenlerinden gelir (src/index.css): acik ve koyu tema ayni token adlarini kullanir.
      colors: {
        canvas: v('canvas'),
        sheet: v('sheet'),
        sunken: v('sunken'),
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        ink: { DEFAULT: v('ink'), 2: v('ink-2'), 3: v('ink-3'), inverse: v('ink-inverse') },
        // Kenar cubugu ve TLP bantlari: ayni siyah ailesi
        night: { DEFAULT: v('night'), 2: v('night-2'), 3: v('night-3'), text: v('night-text') },
        // Tek marka / eylem rengi. Kirmizi ailesi onem derecesi ve tehlikeye ayrildi.
        petrol: { 50: v('petrol-50'), 100: v('petrol-100'), 600: v('petrol-600'), 700: v('petrol-700'), 800: v('petrol-800') },
        'on-accent': v('on-accent'),
        risk: {
          critical: v('risk-critical'),
          high: v('risk-high'),
          medium: v('risk-medium'),
          low: v('risk-low'),
          unknown: v('risk-unknown'),
        },
        brass: '#D2B15C',
        // FIRST TLP 2.0 resmi renkleri (her iki temada da siyah zemin uzerinde)
        tlp: {
          red: '#FF2B2B',
          amber: '#FFC000',
          green: '#33FF00',
          clear: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['"Public Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '5px',
      },
      boxShadow: {
        sheet: 'var(--shadow-sheet)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        rise: 'rise 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
