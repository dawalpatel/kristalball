/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f4f6f4',
          100: '#e3e8e3',
          200: '#c5d1c5',
          300: '#9db19d',
          400: '#738c73',
          500: '#556f55',
          600: '#435843',
          700: '#364736',
          800: '#2d3a2d',
          900: '#273127',
          950: '#131b13',
        },
      }
    },
  },
  plugins: [],
};
