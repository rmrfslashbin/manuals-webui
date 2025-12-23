/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./internal/server/templates/**/*.html",
    "./index.html",
    "./frontend/**/*.{vue,js}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
