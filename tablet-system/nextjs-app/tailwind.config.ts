import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold:      '#C9A84C',
        gold2:     '#DEB96A',
        'lux-black':  '#06060A',
        'lux-card':   '#0F0F14',
        'lux-card2':  '#141419',
        'lux-white':  '#EFEFEF',
        'lux-muted':  '#666672',
        'lux-border': 'rgba(201,168,76,0.14)',
        'lux-gold-dim': 'rgba(201,168,76,0.12)',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:  ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(201,168,76,0.14)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #8B6914 0%, #C9A84C 50%, #DEB96A 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
