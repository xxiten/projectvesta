/**
 * Shared Tailwind preset — maps design tokens to utility classes so apps stay
 * visually consistent. Apps extend this preset in their own tailwind config.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        neutral: {
          0: '#ffffff',
          50: '#f7f7f6',
          100: '#eeeeec',
          200: '#dededb',
          300: '#c4c4bf',
          500: '#8a8a83',
          700: '#4b4b46',
          900: '#1c1c1a',
        },
        accent: {
          500: '#0f766e',
          600: '#0d6058',
        },
        state: {
          free: '#16a34a',
          occupied: '#0f766e',
          option: '#d97706',
          conflict: '#dc2626',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
      },
    },
  },
};
