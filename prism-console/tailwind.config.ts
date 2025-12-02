import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        br: {
          orange: '#FF9D00',
          'orange-bright': '#FF6B00',
          pink: '#FF0066',
          'pink-dark': '#FF006B',
          purple: '#D600AA',
          violet: '#7700FF',
          blue: '#0066FF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
