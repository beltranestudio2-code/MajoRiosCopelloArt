/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1a17",
        paper: "#faf7f2",
        navy: "#14213d",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        brand: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
