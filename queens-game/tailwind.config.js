/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          300: "#e9d5ff",
        },
        blue: {
          300: "#bfdbfe",
        },
        green: {
          300: "#bbf7d0",
        },
        yellow: {
          200: "#fef08a",
        },
        orange: {
          200: "#fed7aa",
        },
        red: {
          300: "#fecaca",
        },
        gray: {
          200: "#e5e7eb",
          400: "#9ca3af",
          700: "#374151",
          800: "#1f2937",
        },
        amber: {
          600: "#d6d3d1",
        },
      },
    },
  },
  plugins: [],
};
