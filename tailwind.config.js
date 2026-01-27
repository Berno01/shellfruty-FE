/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "shell-pink": {
          DEFAULT: "#eaa6b6",
          50: "#fdf4f6",
          100: "#fbe8ec",
          200: "#f8d5de",
          300: "#f2b5c5",
          400: "#eaa6b6",
          500: "#e07d96",
          600: "#ca5675",
        },
      },
    },
  },
  plugins: [],
};
