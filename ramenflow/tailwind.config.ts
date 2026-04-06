import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red:    '#C0392B',
          orange: '#E67E22',
          cream:  '#FDF6E3',
          dark:   '#2C1810',
          light:  '#FAF0DC',
        },
        status: {
          new:       '#3498DB',
          cooking:   '#E67E22',
          ready:     '#F1C40F',
          delivered: '#27AE60',
          alert:     '#E74C3C',
        },
      },
      fontFamily: {
        serif: ['var(--font-noto-serif-jp)', 'serif'],
        sans:  ['var(--font-noto-sans-jp)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
