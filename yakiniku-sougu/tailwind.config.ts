import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c0c0c',
        surface: '#141414',
        accent: '#c0392b',
        cream: '#f0ebe4',
      },
    },
  },
  plugins: [],
};

export default config;
