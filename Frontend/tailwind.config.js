/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'aptos-green': '#00D395',
        'aptos-blue': '#0085FF',
        'aptos-purple': '#794CFF',
        'aptos-dark': '#0F1B42',
      },
    },
  },
  plugins: [],
}