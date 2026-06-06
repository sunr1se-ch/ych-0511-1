/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f7ef',
          100: '#daebe8',
          200: '#b5d7d1',
          300: '#85bcb3',
          400: '#569a91',
          500: '#397d75',
          600: '#2d655f',
          700: '#28524e',
          800: '#244441',
          900: '#203937',
        },
        field: {
          DEFAULT: '#2d5a27',
          light: '#4a7c42',
          dark: '#1e3d1a',
        },
        wheat: {
          DEFAULT: '#f5deb3',
          dark: '#daa520',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
