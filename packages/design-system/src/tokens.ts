/**
 * Design tokens — the calm, reduced, "Apple-like" foundation.
 * Single neutral scale + one restrained accent. Surfaces, not chrome.
 * Consumed both as TS (logic) and as CSS variables (globals.css).
 */
export const tokens = {
  color: {
    // Warm-neutral greys for a quiet, premium feel
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
    // Single restrained accent (deep teal)
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
  radius: { sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '40px' },
  font: {
    sans: 'ui-sans-serif, -apple-system, "Segoe UI", Roboto, Inter, sans-serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
  },
} as const;

export type Tokens = typeof tokens;
