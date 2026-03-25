/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Warm cream palette (HEX-inspired) ──────────────────── */
        'base':          '#f5f4ef',        // warm cream page bg
        'surface':       '#eceae3',        // slightly darker section bg
        'card':          '#ffffff',        // pure white cards
        'primary':       '#1a1825',        // dark navy-purple text
        'secondary':     '#6b6a72',        // muted secondary text
        'tertiary':      '#9e9da5',        // faint helper text

        /* ── Brand blue (kept for auction urgency) ───────────────── */
        'accent':        '#0071e3',
        'accent-dark':   '#0059b5',
        'accent-light':  '#e8f0fd',

        /* ── Semantic ────────────────────────────────────────────── */
        'live-red':      '#e8341c',        // warmer red to match warm palette
        'border-subtle': 'rgba(26,24,37,0.10)',
      },

      fontFamily: {
        /* UI / body */
        sans:   ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        /* Editorial headings (italic serif) */
        serif:  ['"Instrument Serif"', 'Georgia', 'serif'],
      },

      fontSize: {
        'display-xl': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['3.5rem',  { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'display-md': ['2.75rem', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
      },

      boxShadow: {
        'card':       '0 1px 3px rgba(26,24,37,0.07), 0 8px 24px rgba(26,24,37,0.06)',
        'card-hover': '0 2px 6px rgba(26,24,37,0.08), 0 16px 40px rgba(26,24,37,0.10)',
        'glass':      '0 1px 0 rgba(26,24,37,0.09)',
        'btn':        '0 1px 3px rgba(26,24,37,0.18)',
        'btn-accent': '0 2px 8px rgba(0,113,227,0.28)',
      },

      borderRadius: {
        'card':  '14px',
        'input': '8px',
        'pill':  '9999px',
        'btn':   '7px',
      },

      backdropBlur: {
        glass: '20px',
      },

      transitionDuration: {
        '250': '250ms',
      },

      spacing: {
        '4.5': '1.125rem',
        '18':  '4.5rem',
      },

      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        priceFlash: {
          '0%, 100%': { color: '#0071e3' },
          '50%':      { color: '#0059b5', transform: 'scale(1.03)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        slideIn:    'slideIn 0.32s cubic-bezier(0.16,1,0.3,1)',
        slideUp:    'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        fadeIn:     'fadeIn 0.35s ease',
        priceFlash: 'priceFlash 0.55s ease',
        shimmer:    'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [],
};
