import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#05070d',
        foreground: '#e7ecf3',
        muted: '#0f121b',
        accent: '#6ef1c5',
        border: '#1f2432'
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans]
      }
    }
  },
  plugins: []
};

export default config;
