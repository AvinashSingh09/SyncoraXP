/** @type {import('tailwindcss').Config} */
export default {
  // Scoped ONLY to the virtual events module — no global leakage
  content: [
    './src/virtual-events/**/*.{jsx,js,tsx,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
