/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm graphite foundation.
        base: '#0B0C0E',
        panel: '#15171A',
        'panel-soft': '#101215',
        line: '#292D30',
        ink: '#EDEFEA',
        muted: '#9DA29E',

        // Class names stay the same so every tool inherits the new theme:
        // "cyan" is now signal lime, "electric" is now soft sage.
        cyan: '#C6F36B',
        electric: '#9AD9A0',

        // Neutral scale without the old blue cast.
        slate: {
          50: '#F7F7F4',
          100: '#ECEDE8',
          200: '#D8DAD3',
          300: '#B9BDB4',
          400: '#9A9F96',
          500: '#7F857C',
          600: '#636860',
          700: '#4A4F48',
          800: '#31362F',
          900: '#21251F',
          950: '#141710',
        },

        // Status colors retuned to match the palette.
        emerald: {
          200: '#BDE9CE',
          300: '#9BDFB7',
          400: '#74CFA0',
          500: '#4FB986',
          600: '#35996D',
          700: '#277456',
          800: '#1D5540',
          900: '#163B2E',
          950: '#0C241C',
        },
        rose: {
          200: '#F4C4B7',
          300: '#EFA994',
          400: '#EC8A73',
          500: '#DF6C54',
          600: '#BC523E',
          700: '#8F3E31',
          800: '#6B3028',
          900: '#49221D',
          950: '#2B1411',
        },
        amber: {
          200: '#F3DCA6',
          300: '#ECCB84',
          400: '#E4B865',
          500: '#D29E48',
          600: '#AB7C34',
          700: '#805C28',
          800: '#5C421F',
          900: '#3D2C17',
          950: '#24190D',
        },
      },
      ringColor: {
        DEFAULT: '#C6F36B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.25), 0 12px 32px -20px rgba(0,0,0,.9)',
        glow: '0 0 0 1px rgba(198,243,107,.16), 0 12px 34px -16px rgba(198,243,107,.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
